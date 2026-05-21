const express = require("express");
const router = express.Router();
const connection = require("../connection");
const logAudit = require("../utils/auditLogger");

const createApplicantsTable = () => {
  const applicantsTable = `
  CREATE TABLE IF NOT EXISTS applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_id INT,
    message VARCHAR(500), 
    candidate_id INT,
    status VARCHAR(50) DEFAULT 'Pending', -- candidate's status
    interview_day DATE NULL,
    interview_time TIME NULL,
    candidate_response VARCHAR(50) DEFAULT NULL, -- confirmed, requested_reschedule
    requested_interview_day DATE NULL,
    requested_interview_time TIME NULL,
    candidate_response_message TEXT NULL,
    company_status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, reschedule_offered
    company_offered_day DATE NULL,
    company_offered_time TIME NULL,
    final_interview_day DATE NULL,
    final_interview_time TIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES job_posts(id),
    FOREIGN KEY (candidate_id) REFERENCES candidate_info(id)
  );`;

  // Execute the query to create the table
  connection.query(applicantsTable, function (err, results, fields) {
    if (err) {
      return console.error(err.message);
    }
    console.log("applications table created successfully");
  });
};
const createCandidateSearchImpressionsTable = () => {
  const candidatesearchimpressionTable = `
      CREATE TABLE IF NOT EXISTS candidate_search_impressions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT NOT NULL,
        candidate_id INT NOT NULL,
        job_id INT NULL,
        searched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_view (company_id, candidate_id, job_id),
        FOREIGN KEY (candidate_id) REFERENCES candidate_info(id),
        FOREIGN KEY (job_id) REFERENCES job_posts(id)
      );
    `;

  connection.query(
    candidatesearchimpressionTable,
    function (err, results, fields) {
      if (err) {
        return console.error(err.message);
      }
      console.log("candidate_search_impressions table created successfully");
    },
  );
};

const openai = require("../lib/openai");
// ─────────────────────────────────────────────────────────────────
// getAllApplicants
// ─────────────────────────────────────────────────────────────────
const getAllApplicants = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const offset = (page - 1) * limit;

    const jobId = req.query.job_id ? Number(req.query.job_id) : null;
    if (!jobId) return res.status(400).json({ error: "job_id is required" });

    // ─────────────────────────────────────────────────────────────────
    // STEP 1: Fetch job — including billing fields + job_type
    // ─────────────────────────────────────────────────────────────────
    const job = await new Promise((resolve, reject) => {
      connection.query(
        `SELECT jp.speciality_id, jp.skill_ids, jp.min_salary, jp.max_salary,
                  jp.min_experience, jp.max_experience,
                  jp.country_id, jp.district_id, jp.city_id,
                  jp.account_id, jp.package_id, jp.company_package_id,
                  jp.degree_id, jp.degreefields_id,
                  jp.billing_model,
                  jp.daily_budget,
                  jp.spent_amount,
                  jp.cost_per_click,
                  jp.status,
                  jp.approval_status,
                  jp.job_location_type
          FROM job_posts jp
          WHERE jp.id = ?`,
        [jobId],
        (err, result) => (err ? reject(err) : resolve(result[0]))
      );
    });

    if (!job) return res.status(404).json({ error: "Job not found" });
    if (job.approval_status !== "Approved") {
      return res.status(403).json({
        error: "Job is pending approval",
        approval_status: job.approval_status,
      });
    }

    const companyId = job.account_id;

    // ─────────────────────────────────────────────────────────────────
    // STEP 2: For daily_budget — check if budget is exhausted
    // ─────────────────────────────────────────────────────────────────
    const isDailyBudget = job.billing_model === "daily_budget";
    const dailyCap = parseFloat(job.daily_budget || 0);
    const spentSoFar = parseFloat(job.spent_amount || 0);
    const budgetExhausted = isDailyBudget && dailyCap > 0 && spentSoFar >= dailyCap;

    // ─────────────────────────────────────────────────────────────────
    // STEP 3: Parse city IDs
    // ─────────────────────────────────────────────────────────────────
    let jobCityIds = [];
    try {
      const parsed = typeof job.city_id === "string"
        ? JSON.parse(job.city_id)
        : job.city_id;
      jobCityIds = Array.isArray(parsed) ? parsed.map(Number) : [];
    } catch { jobCityIds = []; }

    console.log("=== JOB CITY DEBUG ===");
    console.log("job.city_id raw:", job.city_id);
    console.log("job.district_id raw:", job.district_id);
    console.log("parsed jobCityIds:", jobCityIds);
    console.log("job.job_type:", job.job_type);

    // ─────────────────────────────────────────────────────────────────
    // STEP 3.5: Detect remote job
    // A job is remote if job_type is 'remote' OR no cities are set
    // ─────────────────────────────────────────────────────────────────
    const isRemote = job.job_location_type === "remote" || jobCityIds.length === 0;
    console.log("job.job_location_type:", job.job_location_type);

    // ─────────────────────────────────────────────────────────────────
    // STEP 4: Build WHERE clause
    // - Remote jobs: no city filter — fetch all active completed candidates
    // - City jobs:   filter by city OR preferred cities OR already applied
    // ─────────────────────────────────────────────────────────────────
    const whereConditions = [
      `a.accountType = 'candidate'`,
      `a.isActive = 'Active'`,
      `c.profile_completed = 1`,
    ];
    const values = [];

    if (!isRemote && jobCityIds.length > 0) {
      whereConditions.push(`(
          c.city IN (?)
          OR JSON_OVERLAPS(c.otherPreferredCities, CAST(? AS JSON))
          OR EXISTS (
            SELECT 1 FROM applications ap
            WHERE ap.candidate_id = c.id AND ap.job_id = ?
          )
        )`);
      values.push(jobCityIds, JSON.stringify(jobCityIds), jobId);
    }
    // Remote: no location condition — all candidates are eligible

    const whereClause = `WHERE ${whereConditions.join(" AND ")}`;

    // ─────────────────────────────────────────────────────────────────
    // STEP 5: Fetch candidates
    // ─────────────────────────────────────────────────────────────────
    const candidateQuery = `
        SELECT
          a.id AS account_id,
          a.email,
          a.username,
          a.created_at,
          a.isActive,
          c.id AS candidate_id,
          c.full_name,
          c.phone,
          c.date_of_birth,
          c.gender,
          c.marital_status,
          c.total_experience,
          c.expected_salary,
          c.profile_completed,
          c.address,
          c.passport_photo,
          c.resume,
          c.skills,
          c.city,
          c.district,
          c.country,
          c.otherPreferredCities,
          c.is_boosted,
          c.boost_expires_at,
          li.name AS license_type,
          c.license_number,
          COALESCE(
            (SELECT a1.status FROM applications a1
            WHERE a1.candidate_id = c.id AND a1.job_id = ?
            ORDER BY a1.id DESC LIMIT 1),
            'Pending'
          ) AS candidateStatus,
          COALESCE(
            (SELECT a1.interview_day FROM applications a1
            WHERE a1.candidate_id = c.id AND a1.job_id = ?
            ORDER BY a1.id DESC LIMIT 1),
            NULL
          ) AS interview_day,
          COALESCE(
            (SELECT a1.interview_time FROM applications a1
            WHERE a1.candidate_id = c.id AND a1.job_id = ?
            ORDER BY a1.id DESC LIMIT 1),
            NULL
          ) AS interview_time,
          COALESCE(
            (SELECT a1.message FROM applications a1
            WHERE a1.candidate_id = c.id AND a1.job_id = ?
            ORDER BY a1.created_at DESC LIMIT 1),
            NULL
          ) AS message,
          COALESCE(
            (SELECT a1.candidate_response FROM applications a1
            WHERE a1.candidate_id = c.id AND a1.job_id = ?
            ORDER BY a1.id DESC LIMIT 1),
            NULL
          ) AS candidate_response,
          COALESCE(
            (SELECT a1.requested_interview_day FROM applications a1
            WHERE a1.candidate_id = c.id AND a1.job_id = ?
            ORDER BY a1.id DESC LIMIT 1),
            NULL
          ) AS requested_interview_day,
          COALESCE(
            (SELECT a1.requested_interview_time FROM applications a1
            WHERE a1.candidate_id = c.id AND a1.job_id = ?
            ORDER BY a1.id DESC LIMIT 1),
            NULL
          ) AS requested_interview_time,
          COALESCE(
            (SELECT a1.company_status FROM applications a1
            WHERE a1.candidate_id = c.id AND a1.job_id = ?
            ORDER BY a1.id DESC LIMIT 1),
            'pending'
          ) AS company_status,
          COALESCE(
            (SELECT a1.company_offered_day FROM applications a1
            WHERE a1.candidate_id = c.id AND a1.job_id = ?
            ORDER BY a1.id DESC LIMIT 1),
            NULL
          ) AS company_offered_day,
          COALESCE(
            (SELECT a1.company_offered_time FROM applications a1
            WHERE a1.candidate_id = c.id AND a1.job_id = ?
            ORDER BY a1.id DESC LIMIT 1),
            NULL
          ) AS company_offered_time,
          CASE WHEN EXISTS (
            SELECT 1 FROM applications a2
            WHERE a2.candidate_id = c.id
              AND a2.status = 'Approved'
              AND a2.job_id != ?
          ) THEN 1 ELSE 0 END AS is_hired_elsewhere,
          CASE WHEN EXISTS (
            SELECT 1 FROM applications ap
            WHERE ap.candidate_id = c.id AND ap.job_id = ?
          ) THEN 1 ELSE 0 END AS has_applied
        FROM account a
        INNER JOIN candidate_info c ON a.id = c.account_id
        LEFT JOIN license_types li ON c.license_type = li.id
        ${whereClause}
        ORDER BY
          CASE WHEN c.is_boosted = 1 AND c.boost_expires_at > NOW() THEN 0 ELSE 1 END ASC,
          a.id DESC
        LIMIT ? OFFSET ?
      `;

    const candidatesRaw = await new Promise((resolve, reject) => {
      connection.query(
        candidateQuery,
        [
          jobId, jobId, jobId, jobId, jobId,
          jobId, jobId, jobId, jobId, jobId,
          jobId, jobId,
          ...values,
          limit,
          offset,
        ],
        (err, res) => (err ? reject(err) : resolve(res))
      );
    });

    const candidateIds = candidatesRaw.map((c) => c.candidate_id);

    // ─────────────────────────────────────────────────────────────────
    // STEP 6: Fetch today's unlocked candidate IDs for this job
    // ─────────────────────────────────────────────────────────────────
    const unlockedIds = new Set();
    if (isDailyBudget && candidateIds.length) {
      const unlockRows = await new Promise((resolve, reject) =>
        connection.query(
          `SELECT candidate_id FROM candidate_unlocks
       WHERE employer_account_id = ?
         AND candidate_id IN (?)
         AND unlock_scope = 'full'
         AND (
           job_id = ?
           OR DATE(unlocked_at) = CURDATE()
         )`,
          [companyId, candidateIds, jobId],
          (err, rows) => (err ? reject(err) : resolve(rows))
        )
      );
      unlockRows.forEach((r) => unlockedIds.add(r.candidate_id));
    }

    // ─────────────────────────────────────────────────────────────────
    // STEP 7: Log impressions + trigger billing
    // ─────────────────────────────────────────────────────────────────
    if (candidateIds.length > 0 && companyId) {

      // 7a — Log impressions
      const impressionValues = candidateIds.map((candidateId) => [
        companyId, candidateId, jobId,
      ]);
      connection.query(
        `INSERT IGNORE INTO candidate_search_impressions (company_id, candidate_id, job_id) VALUES ?`,
        [impressionValues],
        (err) => { if (err) console.error("Failed to log search impressions:", err); }
      );

      // 7b — CV Credits: deduct 1 per profile viewed
      if (job.billing_model === "cv_credits" && job.company_package_id) {
        connection.query(
          `SELECT used_credits, package_snapshot FROM company_packages WHERE id = ?`,
          [job.company_package_id],
          (err, pkgRows) => {
            if (err || !pkgRows.length) return;
            const pkgRow = pkgRows[0];
            const snapshot = (() => {
              try {
                return typeof pkgRow.package_snapshot === "string"
                  ? JSON.parse(pkgRow.package_snapshot)
                  : (pkgRow.package_snapshot || {});
              } catch { return {}; }
            })();
            const totalCredits = snapshot.credit_count || 0;
            const usedCredits = pkgRow.used_credits || 0;
            const viewCount = candidateIds.length;
            if (usedCredits < totalCredits) {
              const toDeduct = Math.min(viewCount, totalCredits - usedCredits);
              connection.query(
                `UPDATE company_packages
                  SET used_credits = used_credits + ?
                  WHERE id = ? AND used_credits + ? <= ?`,
                [toDeduct, job.company_package_id, toDeduct, totalCredits],
                (err2) => {
                  if (err2) console.error("Failed to deduct CV credits:", err2);
                  else console.log(`✅ Deducted ${toDeduct} CV credit(s) for package ${job.company_package_id}`);
                }
              );
            } else {
              console.warn(`⚠️ CV credits exhausted for package ${job.company_package_id}`);
            }
          }
        );
      }
    }

    // ─────────────────────────────────────────────────────────────────
    // STEP 8: Fetch related data in batch
    // ─────────────────────────────────────────────────────────────────
    const [
      experienceRows,
      educationRows,
      availabilityRows,
      certificatesRows,
      researchRows,
    ] = await Promise.all([
      candidateIds.length
        ? new Promise((resolve, reject) =>
          connection.query(
            `SELECT e.*, s.name AS speciality_name
                FROM candidate_experience e
                LEFT JOIN speciality s ON e.speciality_id = s.id
                WHERE e.candidate_id IN (?)`,
            [candidateIds],
            (err, res) => (err ? reject(err) : resolve(res))
          ))
        : Promise.resolve([]),
      candidateIds.length
        ? new Promise((resolve, reject) =>
          connection.query(
            `SELECT ed.*, df.name AS degreefield_name, dt.name AS degreetype_name,
                        ins.name AS institute_name
                FROM candidate_education ed
                LEFT JOIN degreefields df  ON ed.degree_id      = df.id
                LEFT JOIN degreetypes dt   ON df.degree_type_id = dt.id
                LEFT JOIN institute ins    ON ed.institute_id   = ins.id
                WHERE ed.candidate_id IN (?)`,
            [candidateIds],
            (err, res) => (err ? reject(err) : resolve(res))
          ))
        : Promise.resolve([]),
      candidateIds.length
        ? new Promise((resolve, reject) =>
          connection.query(
            `SELECT * FROM candidate_availability WHERE candidate_id IN (?)`,
            [candidateIds],
            (err, res) => (err ? reject(err) : resolve(res))
          ))
        : Promise.resolve([]),
      candidateIds.length
        ? new Promise((resolve, reject) =>
          connection.query(
            `SELECT * FROM candidate_certificates WHERE candidate_id IN (?) ORDER BY created_at DESC`,
            [candidateIds],
            (err, res) => (err ? reject(err) : resolve(res))
          ))
        : Promise.resolve([]),
      candidateIds.length
        ? new Promise((resolve, reject) =>
          connection.query(
            `SELECT * FROM candidate_research WHERE candidate_id IN (?) ORDER BY created_at DESC`,
            [candidateIds],
            (err, res) => (err ? reject(err) : resolve(res))
          ))
        : Promise.resolve([]),
    ]);

    // ─────────────────────────────────────────────────────────────────
    // STEP 9: Map skills & cities
    // ─────────────────────────────────────────────────────────────────
    const allSkillIds = [];
    const allCityIds = [];

    candidatesRaw.forEach((c) => {
      try {
        c.skills = Array.isArray(c.skills) ? c.skills : JSON.parse(c.skills || "[]");
      } catch { c.skills = []; }
      allSkillIds.push(...c.skills);

      try {
        c.otherPreferredCities = Array.isArray(c.otherPreferredCities)
          ? c.otherPreferredCities
          : JSON.parse(c.otherPreferredCities || "[]");
      } catch { c.otherPreferredCities = []; }

      if (c.city) allCityIds.push(c.city);
      c.otherPreferredCities.forEach((city) => {
        const id = typeof city === "object" ? city.id : city;
        if (id) allCityIds.push(id);
      });
    });

    const skillsMap = {};
    if (allSkillIds.length) {
      const skillRows = await new Promise((resolve, reject) =>
        connection.query(
          `SELECT id, name FROM skills WHERE id IN (?)`,
          [[...new Set(allSkillIds)]],
          (err, res) => (err ? reject(err) : resolve(res))
        )
      );
      skillRows.forEach((s) => (skillsMap[s.id] = s.name));
    }

    const cityMapObj = {};
    if (allCityIds.length) {
      const cityRows = await new Promise((resolve, reject) =>
        connection.query(
          `SELECT id, name FROM cities WHERE id IN (?)`,
          [[...new Set(allCityIds)]],
          (err, res) => (err ? reject(err) : resolve(res))
        )
      );
      cityRows.forEach((c) => (cityMapObj[c.id] = c.name));
    }

    // ─────────────────────────────────────────────────────────────────
    // STEP 10: Build full candidate objects
    // ─────────────────────────────────────────────────────────────────
    const candidates = candidatesRaw.map((c) => {
      const city_name = cityMapObj[c.city] || "-";
      return {
        ...c,
        skills: c.skills.map((id) => ({ id, name: skillsMap[id] || "" })),
        city_name,
        is_boosted: !!c.is_boosted,
        has_applied: !!c.has_applied,
        boost_expires_at: c.boost_expires_at || null,
        is_hired_elsewhere: !!c.is_hired_elsewhere,
        otherPreferredCities: (c.otherPreferredCities || []).map((city) => {
          const cityId = typeof city === "object" ? city.id : city;
          return { id: cityId, name: cityMapObj[cityId] || "" };
        }),
        experience: experienceRows
          .filter((e) => e.candidate_id === c.candidate_id)
          .map((e) => ({
            id: e.id,
            company_name: e.company_name || "-",
            designation: e.designation || "-",
            total_experience: e.total_experience || "-",
            start_date: e.start_date || null,
            end_date: e.end_date || null,
            speciality: e.speciality_id
              ? { id: e.speciality_id, name: e.speciality_name }
              : null,
          })),
        education: educationRows
          .filter((ed) => ed.candidate_id === c.candidate_id)
          .map((ed) => ({
            id: ed.id,
            degreefield: { id: ed.degree_id, name: ed.degreefield_name },
            degreetype: { id: ed.degree_type_id, name: ed.degreetype_name },
            institute: { id: ed.institute_id, name: ed.institute_name },
            is_ongoing: ed.is_ongoing,
            start_date: ed.start_date,
            end_date: ed.end_date,
          })),
        availability: availabilityRows.filter((a) => a.candidate_id === c.candidate_id),
        certificates: certificatesRows.filter((cert) => cert.candidate_id === c.candidate_id),
        research: researchRows.filter((r) => r.candidate_id === c.candidate_id),
      };
    });

    // ─────────────────────────────────────────────────────────────────
    // STEP 11: Parse job requirements for scoring
    // ─────────────────────────────────────────────────────────────────
    let jobSkillIds = [];
    try {
      jobSkillIds = Array.isArray(job.skill_ids)
        ? job.skill_ids.map(Number)
        : JSON.parse(job.skill_ids || "[]").map(Number);
    } catch { jobSkillIds = []; }

    const jobMinSalary = parseFloat(job.min_salary || 0);
    const jobMaxSalary = parseFloat(job.max_salary || 0);
    const jobMinExp = parseInt(job.min_experience) || 0;
    const jobMaxExp = parseInt(job.max_experience) || 50;
    const tierOrder = { strong: 0, good: 1, weak: 2 };

    // ─────────────────────────────────────────────────────────────────
    // STEP 12: Score + tier each candidate
    // ─────────────────────────────────────────────────────────────────
    const tieredCandidates = candidates
      .map((c) => {
        const matched = [];
        const missing = [];
        let score = 0;

        // ── Location ──
        let locationScore = 0;
        let location_type = "pipeline";

        if (isRemote) {
          // Remote jobs — all candidates are location-eligible, full score
          locationScore = 10;
          location_type = "remote";
        } else {
          const candidateCity = Number(c.city);
          const preferredCityIds = (c.otherPreferredCities || []).map((city) =>
            typeof city === "object" ? Number(city.id) : Number(city)
          );
          const mainCityMatch = jobCityIds.includes(candidateCity);
          const preferredCityMatch = jobCityIds.some((id) => preferredCityIds.includes(id));
          locationScore = mainCityMatch ? 10 : preferredCityMatch ? 6 : 0;
          location_type = mainCityMatch
            ? "main_city"
            : preferredCityMatch
              ? "preferred_city"
              : "pipeline";
        }

        score += locationScore;

        // ── Skills (30pts) ──
        const candidateSkillIds = c.skills.map((s) => Number(s.id));
        let skillScore = 0;
        if (jobSkillIds.length === 0) {
          skillScore = 30;
          matched.push("Skills");
        } else {
          const matchedSkillCount = jobSkillIds.filter((id) => candidateSkillIds.includes(id)).length;
          skillScore = Math.round((matchedSkillCount / jobSkillIds.length) * 30);
          if (skillScore >= 20) matched.push(`Skills (${matchedSkillCount}/${jobSkillIds.length})`);
          else if (skillScore > 0) missing.push(`Skills (${matchedSkillCount}/${jobSkillIds.length} matched)`);
          else missing.push("Skills (none matched)");
        }
        score += skillScore;

        // ── Experience (25pts) ──
        const candExp = parseFloat(c.total_experience || 0);
        let expScore = 0;
        if (jobMinExp === 0 && jobMaxExp === 0) {
          expScore = 25;
        } else if (candExp >= jobMinExp && candExp <= jobMaxExp) {
          expScore = 25;
        } else if (candExp < jobMinExp) {
          expScore = Math.max(0, 25 - (jobMinExp - candExp) * 4);
        } else {
          expScore = 20;
        }
        score += expScore;
        if (expScore >= 20) matched.push("Experience");
        else missing.push(`Experience (${candExp} yrs, need ${jobMinExp}-${jobMaxExp})`);

        // ── Speciality (20pts) ──
        const candSpecialities = (c.experience || [])
          .map((e) => e.speciality?.id)
          .filter(Boolean)
          .map(Number);
        let specScore = 0;
        if (!job.speciality_id) {
          specScore = 20;
          matched.push("Speciality");
        } else if (candSpecialities.includes(Number(job.speciality_id))) {
          specScore = 20;
          matched.push("Speciality");
        } else {
          missing.push("Speciality");
        }
        score += specScore;

        // ── Degree (10pts) ──
        const candidateEducation = c.education || [];
        const hasDegree = candidateEducation.length > 0;
        let degreeScore = 0;
        if (!job.degree_id && !job.degreefields_id) {
          degreeScore = hasDegree ? 10 : 0;
          if (hasDegree) matched.push("Education");
          else missing.push("Education");
        } else {
          const jobDegreeTypeId = job.degree_id ? Number(job.degree_id) : null;
          const jobDegreeFieldId = job.degreefields_id ? Number(job.degreefields_id) : null;
          const degreeTypeMatch = candidateEducation.some((ed) => jobDegreeTypeId && ed.degreetype?.id === jobDegreeTypeId);
          const degreeFieldMatch = candidateEducation.some((ed) => jobDegreeFieldId && ed.degreefield?.id === jobDegreeFieldId);
          if (jobDegreeFieldId && jobDegreeTypeId) {
            if (degreeFieldMatch && degreeTypeMatch) { degreeScore = 10; matched.push("Education (degree & field match)"); }
            else if (degreeTypeMatch || degreeFieldMatch) { degreeScore = 5; matched.push(`Education (partial: ${degreeTypeMatch ? "type" : "field"} matched)`); }
            else if (hasDegree) { degreeScore = 2; missing.push("Education (wrong degree type & field)"); }
            else { degreeScore = 0; missing.push("Education (none)"); }
          } else if (jobDegreeFieldId) {
            if (degreeFieldMatch) { degreeScore = 10; matched.push("Education (field match)"); }
            else if (hasDegree) { degreeScore = 3; missing.push("Education (wrong field)"); }
            else { degreeScore = 0; missing.push("Education (none)"); }
          } else if (jobDegreeTypeId) {
            if (degreeTypeMatch) { degreeScore = 10; matched.push("Education (degree type match)"); }
            else if (hasDegree) { degreeScore = 3; missing.push("Education (wrong degree type)"); }
            else { degreeScore = 0; missing.push("Education (none)"); }
          }
        }
        score += degreeScore;
        const degreeMatched = degreeScore >= 5;

        // ── Salary (15pts) ──
        const candSalary = parseFloat(c.expected_salary || 0);
        let salaryScore = 15;
        let salaryOver = false;
        if (jobMinSalary || jobMaxSalary) {
          if (candSalary >= jobMinSalary && candSalary <= jobMaxSalary) {
            salaryScore = 15; matched.push("Salary");
          } else if (candSalary < jobMinSalary) {
            salaryScore = 10; matched.push("Salary (expects less)");
          } else {
            const overage = ((candSalary - jobMaxSalary) / jobMaxSalary) * 100;
            salaryScore = overage > 50 ? 0 : overage > 25 ? 5 : 8;
            salaryOver = true;
            missing.push("Salary (expects more than budget)");
          }
        } else {
          matched.push("Salary");
        }
        score += salaryScore;

        // ── Tier ──
        const skillsMatched = skillScore >= 20;
        const expMatched = expScore >= 20;
        const specMatched = specScore === 20;
        const coreCriteriaCount = [skillsMatched, expMatched, specMatched, degreeMatched].filter(Boolean).length;
        if (coreCriteriaCount === 0) return null;

        let tier, tier_label, tier_color;
        if (coreCriteriaCount === 4) { tier = "strong"; tier_label = "Strong Match"; tier_color = "green"; }
        else if (coreCriteriaCount >= 2) { tier = "good"; tier_label = "Good Match"; tier_color = "blue"; }
        else { tier = "weak"; tier_label = "Partial Match"; tier_color = "amber"; }

        if (salaryOver && tier === "strong") {
          tier = "good"; tier_label = "Good Match"; tier_color = "blue";
        }

        return {
          ...c,
          ai_score: Math.min(100, score),
          tier,
          tier_label,
          tier_color,
          location_type,
          matched,
          missing,
          billing_info: {
            model: job.billing_model,
            daily_budget: isDailyBudget ? parseFloat(job.daily_budget || 0) : null,
            spent_amount: isDailyBudget ? parseFloat(job.spent_amount || 0) : null,
            remaining_today: isDailyBudget
              ? Math.max(0, parseFloat(job.daily_budget || 0) - parseFloat(job.spent_amount || 0))
              : null,
          },
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        if (tierOrder[a.tier] !== tierOrder[b.tier]) return tierOrder[a.tier] - tierOrder[b.tier];
        // remote = same priority as main_city
        const locOrder = { remote: 0, main_city: 0, preferred_city: 1, pipeline: 2 };
        if (locOrder[a.location_type] !== locOrder[b.location_type]) return locOrder[a.location_type] - locOrder[b.location_type];
        if (b.is_boosted !== a.is_boosted) return b.is_boosted ? 1 : -1;
        return b.ai_score - a.ai_score;
      });

    // ─────────────────────────────────────────────────────────────────
    // STEP 13: Mask candidates for daily_budget jobs
    //          - Already unlocked → send full data
    //          - Not yet unlocked → strip PII, add locked: true
    // ─────────────────────────────────────────────────────────────────
    const finalCandidates = tieredCandidates.map((c) => {
      if (!isDailyBudget) return c;
      if (unlockedIds.has(c.candidate_id)) return { ...c, locked: false };

      return {
        candidate_id: c.candidate_id,
        locked: true,
        tier: c.tier,
        tier_label: c.tier_label,
        tier_color: c.tier_color,
        ai_score: c.ai_score,
        location_type: c.location_type,
        matched: c.matched,
        missing: c.missing,
        is_boosted: c.is_boosted,
        city_name: c.city_name,
        total_experience: c.total_experience,
        expected_salary: c.expected_salary,
        skills: c.skills,
        candidateStatus: c.candidateStatus,
        has_applied: c.has_applied,
        billing_info: c.billing_info,
        full_name: null,
        email: null,
        passport_photo: null,
      };
    });

    // ─────────────────────────────────────────────────────────────────
    // STEP 14: Summary + response
    // ─────────────────────────────────────────────────────────────────
    const summary = {
      total: finalCandidates.length,
      strong: finalCandidates.filter((c) => c.tier === "strong").length,
      good: finalCandidates.filter((c) => c.tier === "good").length,
      weak: finalCandidates.filter((c) => c.tier === "weak").length,
      is_remote: isRemote,
      from_main_city: finalCandidates.filter((c) => c.location_type === "main_city").length,
      from_preferred_city: finalCandidates.filter((c) => c.location_type === "preferred_city").length,
      from_remote: finalCandidates.filter((c) => c.location_type === "remote").length,
    };

    const budgetStatus = isDailyBudget
      ? {
        model: "daily_budget",
        daily_cap: dailyCap,
        spent_today: spentSoFar,
        remaining_today: Math.max(0, dailyCap - spentSoFar),
        is_exhausted: budgetExhausted,
        cost_per_click: parseFloat(job.cost_per_click || 0),
      }
      : job.billing_model === "cv_credits"
        ? { model: "cv_credits" }
        : { model: job.billing_model || "package" };

    return res.status(200).json({
      summary,
      page,
      limit,
      budget_status: budgetStatus,
      candidate: finalCandidates,
    });

  } catch (err) {
    console.error("getAllApplicants error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};


// ─────────────────────────────────────────────────────────────────
// unlockCandidate
// POST /applicant/unlock-candidate
// Body: { candidateId, jobId }
//
// Required table (run once):
//   CREATE TABLE candidate_unlocks (
//     id           INT AUTO_INCREMENT PRIMARY KEY,
//     company_id   INT NOT NULL,
//     candidate_id INT NOT NULL,
//     job_id       INT NOT NULL,
//     cost_charged DECIMAL(10,2) DEFAULT 0,
//     unlocked_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//     INDEX idx_lookup (company_id, candidate_id, job_id, unlocked_at)
//   );
// ─────────────────────────────────────────────────────────────────
const unlockCandidate = async (req, res) => {
  try {
    const { candidateId, jobId } = req.body;

    if (!candidateId || !jobId) {
      return res.status(400).json({ error: "candidateId and jobId are required" });
    }

    // 1. Fetch job billing info
    const job = await new Promise((resolve, reject) =>
      connection.query(
        `SELECT billing_model, daily_budget, spent_amount, cost_per_click, account_id, approval_status
          FROM job_posts WHERE id = ?`,
        [jobId],
        (err, rows) => (err ? reject(err) : resolve(rows[0]))
      )
    );

    if (!job) return res.status(404).json({ error: "Job not found" });
    if (job.approval_status !== "Approved") return res.status(403).json({ error: "Job is not approved" });
    if (job.billing_model !== "daily_budget") {
      return res.status(400).json({ error: "This job does not use daily budget billing" });
    }

    const companyId = job.account_id;
    const dailyCap = parseFloat(job.daily_budget || 0);
    const spent = parseFloat(job.spent_amount || 0);
    const cpc = parseFloat(job.cost_per_click || 0);
    const remaining = dailyCap - spent;

    // 2. Check if already unlocked today → no charge, just return data
    const alreadyUnlocked = await new Promise((resolve, reject) =>
      connection.query(
        `SELECT id FROM candidate_unlocks
     WHERE employer_account_id = ?
       AND candidate_id = ?
       AND unlock_scope = 'full'
       AND (
         job_id = ?
         OR DATE(unlocked_at) = CURDATE()
       )`,
        [companyId, candidateId, jobId],
        (err, rows) => (err ? reject(err) : resolve(rows.length > 0))
      )
    );

    if (!alreadyUnlocked) {
      // 3. Budget check before charging
      if (remaining <= 0) {
        return res.status(402).json({
          error: "Daily budget exhausted",
          message: "Your daily budget has been used up. Please increase it or wait until tomorrow.",
        });
      }

      // 4. Deduct cost_per_click (cap at remaining budget)
      const chargeAmount = Math.min(cpc, remaining);
      await new Promise((resolve, reject) =>
        connection.query(
          `UPDATE job_posts
            SET spent_amount = LEAST(spent_amount + ?, daily_budget)
            WHERE id = ?`,
          [chargeAmount, jobId],
          (err) => (err ? reject(err) : resolve())
        )
      );
      console.log(`✅ Charged PKR ${chargeAmount} for unlocking candidate ${candidateId} on job ${jobId}`);

      // 5. Log the unlock
      // 5. Log the unlock
      await new Promise((resolve, reject) =>
        connection.query(
          `INSERT IGNORE INTO candidate_unlocks 
      (employer_account_id, candidate_id, job_id, cost_charged, unlock_scope, company_package_id)
      VALUES (?, ?, ?, ?, 'full', NULL)`,
          [companyId, candidateId, jobId, chargeAmount],
          (err) => (err ? reject(err) : resolve())
        )
      );

      // 6. Auto-pause job if budget now exhausted
      const newSpent = spent + chargeAmount;
      if (newSpent >= dailyCap) {
        connection.query(
          `UPDATE job_posts SET status = 'Paused' WHERE id = ? AND spent_amount >= daily_budget`,
          [jobId],
          (err) => {
            if (err) console.error("Failed to auto-pause job:", err);
            else console.warn(`⚠️ Job ${jobId} auto-paused — daily budget reached`);
          }
        );
      }
    } else {
      console.log(`ℹ️ Candidate ${candidateId} already unlocked today for job ${jobId} — no charge`);
    }

    // 7. Fetch full candidate data
    const candidateRow = await new Promise((resolve, reject) =>
      connection.query(
        `SELECT c.*, a.email, a.username
          FROM candidate_info c
          INNER JOIN account a ON a.id = c.account_id
          WHERE c.id = ?`,
        [candidateId],
        (err, rows) => (err ? reject(err) : resolve(rows[0]))
      )
    );

    if (!candidateRow) return res.status(404).json({ error: "Candidate not found" });

    // 8. Parse JSON fields
    try {
      candidateRow.skills = Array.isArray(candidateRow.skills)
        ? candidateRow.skills
        : JSON.parse(candidateRow.skills || "[]");
    } catch { candidateRow.skills = []; }

    try {
      candidateRow.otherPreferredCities = Array.isArray(candidateRow.otherPreferredCities)
        ? candidateRow.otherPreferredCities
        : JSON.parse(candidateRow.otherPreferredCities || "[]");
    } catch { candidateRow.otherPreferredCities = []; }

    // 9. Fetch updated budget status to send back
    const updatedJob = await new Promise((resolve, reject) =>
      connection.query(
        `SELECT daily_budget, spent_amount, cost_per_click FROM job_posts WHERE id = ?`,
        [jobId],
        (err, rows) => (err ? reject(err) : resolve(rows[0]))
      )
    );

    const updatedCap = parseFloat(updatedJob.daily_budget || 0);
    const updatedSpent = parseFloat(updatedJob.spent_amount || 0);
    const updatedRemaining = Math.max(0, updatedCap - updatedSpent);

    return res.status(200).json({
      success: true,
      charged: !alreadyUnlocked,
      charge_amount: alreadyUnlocked ? 0 : Math.min(cpc, remaining),
      candidate: { ...candidateRow, locked: false },
      budget_status: {
        daily_cap: updatedCap,
        spent_today: updatedSpent,
        remaining_today: updatedRemaining,
        is_exhausted: updatedSpent >= updatedCap,
      },
    });

  } catch (err) {
    console.error("unlockCandidate error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

const updateApplcantStatus = (req, res) => {
  const {
    candidateId,
    jobId,
    status,
    interview_day,
    interview_time,
    message,
    candidate_response,
    requested_interview_day,
    requested_interview_time,
    candidate_response_message,
    company_status, // optional: confirmed/reschedule_offered
    company_offered_day,
    company_offered_time,
  } = req.body;

  if (!candidateId || !jobId) {
    return res
      .status(400)
      .json({ error: "Candidate ID and Job ID are required" });
  }

  const selectQuery = `SELECT * FROM applications WHERE candidate_id = ? AND job_id = ?`;
  connection.query(selectQuery, [candidateId, jobId], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });

    if (results.length > 0) {
      const appId = results[0].id;

      // Build dynamic update
      const fields = [];
      const values = [];

      if (status !== undefined) {
        fields.push("status = ?");
        values.push(status);
      }
      if (interview_day !== undefined) {
        fields.push("interview_day = ?");
        values.push(interview_day);
      }
      if (interview_time !== undefined) {
        fields.push("interview_time = ?");
        values.push(interview_time);
      }
      if (message !== undefined) {
        fields.push("message = ?");
        values.push(message);
      }
      if (candidate_response !== undefined) {
        fields.push("candidate_response = ?");
        values.push(candidate_response);
      }

      if (requested_interview_day !== undefined) {
        fields.push("requested_interview_day = ?");
        values.push(requested_interview_day);
      }

      if (requested_interview_time !== undefined) {
        fields.push("requested_interview_time = ?");
        values.push(requested_interview_time);
      }

      if (candidate_response_message !== undefined) {
        fields.push("candidate_response_message = ?");
        values.push(candidate_response_message);
      }
      // --- Company updates ---
      if (company_status !== undefined) {
        fields.push("company_status = ?");
        values.push(company_status);
      }
      if (company_offered_day !== undefined) {
        fields.push("company_offered_day = ?");
        values.push(company_offered_day);
      }
      if (company_offered_time !== undefined) {
        fields.push("company_offered_time = ?");
        values.push(company_offered_time);
      }
      if (
        candidate_response === "confirmed" &&
        (company_status === "confirmed" || company_status === undefined) &&
        interview_day &&
        interview_time
      ) {
        fields.push("final_interview_day = ?");
        fields.push("final_interview_time = ?");
        values.push(interview_day, interview_time);
      }

      // Candidate confirmed company offered time
      if (
        candidate_response === "confirmed" &&
        company_status === "reschedule_offered" &&
        company_offered_day &&
        company_offered_time
      ) {
        fields.push("final_interview_day = ?");
        fields.push("final_interview_time = ?");
        values.push(company_offered_day, company_offered_time);
      }
      if (fields.length === 0) {
        return res.status(400).json({ error: "No fields provided to update" });
      }

      const updateQuery = `UPDATE applications SET ${fields.join(", ")} WHERE id = ?`;
      values.push(appId);

      connection.query(updateQuery, values, (err2) => {
        if (err2) return res.status(500).json({ error: "Database error" });
        if (status === "Shortlisted" || status === "Approved" || status === "Rejected") {
          connection.query(
            "SELECT account_id FROM candidate_info WHERE id = ? LIMIT 1",
            [candidateId],
            (err3, rows) => {
              if (!err3 && rows.length > 0) {
                logAudit({
                  tableName: "history",
                  entityType: "candidate",
                  entityId: rows[0].account_id,
                  action: "UPDATED",
                  data: { event: `Status changed to ${status}`, job_id: jobId },
                  changedBy: rows[0].account_id,
                });
                logAudit({
                  tableName: "history",
                  entityType: "employer",
                  entityId: rows[0].account_id,
                  action: "UPDATED",
                  data: { event: `Candidate ${status}`, job_id: jobId, candidate_id: candidateId },
                  changedBy: rows[0].account_id,
                });
              }
            }
          );
        }
        res.json({ message: "Application updated successfully" });
      });
    } else {
      // Insert new row if none exists
      const insertQuery = `
          INSERT INTO applications
          (candidate_id, job_id, status, message, interview_day, interview_time)
          VALUES (?, ?, ?, ?, ?, ?)`;
      connection.query(
        insertQuery,
        [
          candidateId,
          jobId,
          status || "Pending",
          message || "",
          interview_day || null,
          interview_time || null,
        ],
        (err3) => {
          if (err3) return res.status(500).json({ error: "Database error" });
          res.json({ message: "Application created successfully" });
        },
      );
    }
  });
};

const applyJob = (req, res) => {
  const accountId = req.user.userId;
  const { job_id } = req.body;

  if (!job_id) {
    return res.status(400).json({ error: "job_id is required" });
  }

  connection.query(
    "SELECT id FROM candidate_info WHERE account_id = ? LIMIT 1",
    [accountId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "Database error" });
      if (!rows.length) return res.status(404).json({ error: "Candidate not found" });

      const candidateId = rows[0].id;

      connection.query(
        "SELECT id FROM applications WHERE job_id = ? AND candidate_id = ?",
        [job_id, candidateId],
        (err2, existing) => {
          if (err2) return res.status(500).json({ error: "Database error" });
          if (existing.length > 0) {
            return res.status(409).json({ error: "Already applied" });
          }

          connection.query(
            "INSERT INTO applications (job_id, candidate_id, status) VALUES (?, ?, 'Pending')",
            [job_id, candidateId],
            (err3) => {
              if (err3) return res.status(500).json({ error: "Database error", details: err3.message });
              logAudit({
                tableName: "history",
                entityType: "candidate",
                entityId: accountId,
                action: "UPDATED",
                data: { event: "Applied for job", job_id },
                changedBy: accountId,
              });
              res.json({ success: true, message: "Applied successfully" });
            }
          );
        }
      );
    }
  );
};

const getAppliedJobs = (req, res) => {
  console.log("USER DATA:", req.user);
  const accountId = req.user.userId;

  connection.query(
    "SELECT id FROM candidate_info WHERE account_id = ? LIMIT 1",
    [accountId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "Database error" });
      if (!rows.length) return res.status(404).json({ error: "Candidate not found" });

      const candidateId = rows[0].id;

      const query = `
        SELECT 
          ap.id AS application_id,
          ap.status,
          ap.created_at,
          jp.id AS job_id,
          jp.job_title,
          jp.min_salary,
          jp.max_salary,
          ccy.code AS currency,
          jt.name AS job_type,
          c.company_name AS company_name,
          ci.name AS city_name
        FROM applications ap
        INNER JOIN job_posts jp ON ap.job_id = jp.id
        LEFT JOIN company_info c ON jp.account_id = c.account_id
        LEFT JOIN cities ci ON jp.city_id = ci.id
        LEFT JOIN currencies ccy ON jp.currency_id = ccy.id
        LEFT JOIN jobtypes jt ON jp.job_type_id = jt.id
        WHERE ap.candidate_id = ?
        ORDER BY ap.created_at DESC
      `;

      connection.query(query, [candidateId], (err2, results) => {
        if (err2) return res.status(500).json({ error: "Database error" });

        res.json({
          success: true,
          data: results
        });
      });
    }
  );
};

const getApplicationStats = (req, res) => {
  const accountId = req.user.userId;
  const { period = '28days', type = 'shortlisted' } = req.query;

  const status = type === 'approved' ? 'Approved' : 'Shortlisted';

  connection.query(
    `SELECT id FROM candidate_info WHERE account_id = ? LIMIT 1`,
    [accountId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "Database error" });
      if (!rows.length) return res.json({ success: true, data: [], current_total: 0, previous_total: 0 });

      const candidateId = rows[0].id;

      let currentInterval, previousInterval, groupFormat;

      if (period === '28days') {
        currentInterval = 'INTERVAL 28 DAY';
        previousInterval = 'INTERVAL 56 DAY';
        groupFormat = '%Y-%m-%d';
      } else if (period === 'weekly') {
        currentInterval = 'INTERVAL 8 WEEK';
        previousInterval = 'INTERVAL 16 WEEK';
        groupFormat = '%x-%v';
      } else {
        currentInterval = 'INTERVAL 6 MONTH';
        previousInterval = 'INTERVAL 12 MONTH';
        groupFormat = '%Y-%m';
      }

      const currentSql = `
        SELECT DATE_FORMAT(created_at, ?) AS period_key, COUNT(*) AS count
        FROM applications
        WHERE candidate_id = ? AND status = ?
          AND created_at >= DATE_SUB(NOW(), ${currentInterval})
        GROUP BY period_key
        ORDER BY period_key ASC
      `;

      const previousSql = `
        SELECT COUNT(*) AS total
        FROM applications
        WHERE candidate_id = ? AND status = ?
          AND created_at >= DATE_SUB(NOW(), ${previousInterval})
          AND created_at <  DATE_SUB(NOW(), ${currentInterval})
      `;

      connection.query(currentSql, [groupFormat, candidateId, status], (err2, currentRows) => {
        if (err2) return res.status(500).json({ error: "Database error" });

        connection.query(previousSql, [candidateId, status], (err3, prevRows) => {
          if (err3) return res.status(500).json({ error: "Database error" });

          const previousTotal = prevRows[0]?.total || 0;
          const currentTotal = currentRows.reduce((sum, r) => sum + r.count, 0);

          let filledData = [];

          if (period === '28days') {
            for (let i = 27; i >= 0; i--) {
              const d = new Date();
              d.setDate(d.getDate() - i);
              const key = d.toISOString().slice(0, 10);
              const label = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
              const found = currentRows.find(r => r.period_key === key);
              filledData.push({ label, count: found ? found.count : 0 });
            }
          } else if (period === 'weekly') {
            filledData = currentRows.map(r => {
              const [year, week] = r.period_key.split('-').map(Number);
              const jan4 = new Date(year, 0, 4);
              const dow = jan4.getDay() || 7;
              const mon = new Date(jan4);
              mon.setDate(jan4.getDate() - (dow - 1) + (week - 1) * 7);
              const sun = new Date(mon);
              sun.setDate(mon.getDate() + 6);
              const fmt = d => d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
              return { label: `${fmt(mon)} – ${fmt(sun)}`, count: r.count };
            });
          } else {
            filledData = currentRows.map(r => {
              const [year, month] = r.period_key.split('-');
              const label = new Date(year, parseInt(month) - 1, 1)
                .toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
              return { label, count: r.count };
            });
          }

          return res.json({
            success: true,
            data: filledData,
            current_total: currentTotal,
            previous_total: previousTotal,
            period,
            type,
          });
        });
      });
    }
  );
};

module.exports = {
  createApplicantsTable,
  createCandidateSearchImpressionsTable, // add this
  getAllApplicants,
  updateApplcantStatus,
  applyJob,
  getAppliedJobs,
  unlockCandidate,
  getApplicationStats,
};
