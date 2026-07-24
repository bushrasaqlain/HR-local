  const connection = require("../connection");
  const logAudit = require("../utils/auditLogger");
  const openai = require("../lib/openai");
const auditDebounceCache = new Map();
const AUDIT_DEBOUNCE_MS = 5 * 60 * 1000; // 5 minutes

const debouncedAudit = (key, auditPayload) => {
  const now = Date.now();
  const last = auditDebounceCache.get(key);
  if (last && now - last < AUDIT_DEBOUNCE_MS) return;
  auditDebounceCache.set(key, now);
  // fire-and-forget
  setImmediate(() => logAudit(auditPayload));
};
function calculateTotalExperience(experienceRows) {
  if (!experienceRows || !experienceRows.length) return 0;

  let totalMonths = 0;
  experienceRows.forEach((e) => {
    const start = e.start_date ? new Date(e.start_date) : null;
    const end = e.is_ongoing || !e.end_date ? new Date() : new Date(e.end_date);
    if (!start || isNaN(start)) return;
    const months =
      (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth());
    if (months > 0) totalMonths += months;
  });

  return Math.round((totalMonths / 12) * 10) / 10;
}
  // Add at top
const sendStatusNotification = async (candidateId, jobId, status, extraData = {}) => {
  try {
    const rows = await new Promise((resolve, reject) =>
      connection.query(
        `SELECT 
           a.email, ci.full_name, ci.id AS candidate_info_id,
           jp.job_title, comp.company_name
         FROM candidate_info ci
         JOIN account a ON a.id = ci.account_id
         JOIN job_posts jp ON jp.id = ?
         JOIN company_info comp ON comp.account_id = jp.account_id
         WHERE ci.id = ?
         LIMIT 1`,
        [jobId, candidateId],
        (err, rows) => (err ? reject(err) : resolve(rows))
      )
    );

    if (!rows.length) return;
    const { email, full_name, candidate_info_id, job_title, company_name } = rows[0];

    // ── Per-status config ──
    const statusConfig = {
      Rejected: {
        alert_type: "rejection",
        subject: `Application Update - ${job_title} at ${company_name}`,
        alert_message: `Your application for ${job_title} at ${company_name} was not selected.`,
        bodyHtml: `
          <p>Dear <strong>${full_name}</strong>,</p>
          <p>Thank you for your interest in the <strong>${job_title}</strong> position at <strong>${company_name}</strong>.</p>
          <p>After careful consideration, we have decided to move forward with other candidates whose qualifications more closely match our current needs.</p>
          <p>We appreciate the time you invested and encourage you to apply for future opportunities.</p>
          <div style="background:#fff3cd;border:1px solid #ffc107;border-radius:6px;padding:15px;margin:20px 0;">
            <p style="margin:0;color:#856404;font-size:14px;">💡 <strong>Tip:</strong> Keep your profile updated to get noticed by more employers on Hunar.</p>
          </div>
          <p>Best of luck in your job search!<br/><strong>The ${company_name} Team</strong></p>
        `,
      },
      Shortlisted: {
        alert_type: "shortlisted",
        subject: `Great News! You've been shortlisted - ${job_title} at ${company_name}`,
        alert_message: `You have been shortlisted for ${job_title} at ${company_name}.`,
        bodyHtml: `
          <p>Dear <strong>${full_name}</strong>,</p>
          <p>🎉 Congratulations! You have been <strong>shortlisted</strong> for the <strong>${job_title}</strong> position at <strong>${company_name}</strong>.</p>
          <p>The hiring team was impressed with your profile and would like to move forward with your application.</p>
          <p>Please keep an eye on your alerts for further updates regarding next steps.</p>
          <p>Best regards,<br/><strong>The ${company_name} Team</strong></p>
        `,
      },
      Interview_Scheduled: {
        alert_type: "interview",
        subject: `Interview Scheduled - for ${job_title} at ${company_name}`,
        alert_message: `Your interview for ${job_title} at ${company_name} has been scheduled${extraData.interview_day ? ` on ${extraData.interview_day} at ${extraData.interview_time || ""}` : ""}.`,
        bodyHtml: `
          <p>Dear <strong>${full_name}</strong>,</p>
          <p>Your interview for the <strong>${job_title}</strong> position at <strong>${company_name}</strong> has been scheduled.</p>
          ${extraData.interview_day ? `
          <div style="background:#e8f4fd;border:1px solid #b8daff;border-radius:6px;padding:15px;margin:20px 0;">
            <p style="margin:0;font-size:14px;">📅 <strong>Date:</strong> ${extraData.interview_day}</p>
            ${extraData.interview_time ? `<p style="margin:6px 0 0;font-size:14px;">⏰ <strong>Time:</strong> ${extraData.interview_time}</p>` : ""}
          </div>` : ""}
          <p>Please be prepared and join the interview on time.

If the scheduled time is convenient for you, please confirm your availability by logging in to your portal. If you are unable to attend at the scheduled time, kindly request a reschedule through your portal at your earliest convenience.

Best of luck!/p>
          <p>Best regards,<br/><strong>The ${company_name} Team</strong></p>
        `,
      },
      Offered: {
        alert_type: "offer",
        subject: `Job Offer - for ${job_title} at ${company_name}`,
        alert_message: `You have received a job offer for ${job_title} at ${company_name}!`,
        bodyHtml: `
          <p>Dear <strong>${full_name}</strong>,</p>
          <p>🎉 We are thrilled to extend a <strong>job offer</strong> to you for the <strong>${job_title}</strong> position at <strong>${company_name}</strong>!</p>
          ${extraData.offeredSalary ? `<p>💰 <strong>Offered Salary:</strong> ${extraData.offeredSalary}</p>` : ""}
          ${extraData.joiningDate ? `<p>📅 <strong>Expected Joining Date:</strong> ${extraData.joiningDate}</p>` : ""}
          <p>Please review the offer details and respond at your earliest convenience.</p>
          <p>We look forward to welcoming you to the team!<br/><strong>The ${company_name} Team</strong></p>
        `,
      },
      Selected: {
        alert_type: "selected",
        subject: `Congratulations! You've been Selected - ${job_title} at ${company_name}`,
        alert_message: `Congratulations! You have been selected for ${job_title} at ${company_name}.`,
        bodyHtml: `
          <p>Dear <strong>${full_name}</strong>,</p>
          <p>🎊 Congratulations! You have been <strong>selected</strong> for the <strong>${job_title}</strong> position at <strong>${company_name}</strong>!</p>
          <p>We are excited to have you join the team. Please await further onboarding instructions.</p>
          <p>Welcome aboard!<br/><strong>The ${company_name} Team</strong></p>
        `,
      },
    };

    const config = statusConfig[status];
    if (!config) return; // no email for other statuses

    // 1. Save in-app alert
    connection.query(
      `INSERT INTO job_alerts (candidate_id, job_id, is_read, alert_type, message)
       VALUES (?, ?, 0, ?, ?)`,
      [candidate_info_id, jobId, config.alert_type, config.alert_message],
      (err) => { if (err) console.error("Failed to save alert:", err); }
    );

    // 2. Send email
    const nodemailer = require("nodemailer");
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    await transporter.sendMail({
      from: `"${company_name} via Hunar" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: config.subject,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
          <div style="background:#36565f;padding:20px;border-radius:8px 8px 0 0;">
            <h2 style="color:white;margin:0;">${config.subject}</h2>
          </div>
          <div style="background:#f9f9f9;padding:30px;border-radius:0 0 8px 8px;border:1px solid #e0e0e0;">
            ${config.bodyHtml}
          </div>
          <p style="text-align:center;font-size:12px;color:#aaa;margin-top:15px;">Sent via Hunar Job Portal</p>
        </div>
      `,
    });

    console.log(`✅ ${status} notification sent to ${email}`);
  } catch (err) {
    console.error("sendStatusNotification error:", err);
  }
};
  // ─────────────────────────────────────────────────────────────────
  // CREATE TABLES
  // ─────────────────────────────────────────────────────────────────
  const createApplicantsTable = () => {
    const applicantsTable = `
      CREATE TABLE IF NOT EXISTS applications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        job_id INT,
        message VARCHAR(500),
        candidate_id INT,
        source ENUM('candidate','employer') NOT NULL DEFAULT 'candidate',
        status ENUM('Pending','Saved','Shortlisted','Considered', 'Applied','Offered','Selected','Joined','Rejected','Refused to Join','Cancelled') DEFAULT 'Pending',
  offer_date DATE NULL,
  offered_salary DECIMAL(10,2) NULL,
  joining_date DATE NULL,
        interview_day DATE NULL,
        interview_time TIME NULL,
        candidate_response VARCHAR(50) DEFAULT NULL,
        requested_interview_day DATE NULL,
        requested_interview_time TIME NULL,
        candidate_response_message TEXT NULL,
        company_status VARCHAR(50) DEFAULT 'pending',
        company_offered_day DATE NULL,
        company_offered_time TIME NULL,
        final_interview_day DATE NULL,
        final_interview_time TIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (job_id) REFERENCES job_posts(id),
        FOREIGN KEY (candidate_id) REFERENCES candidate_info(id)
      );`;

    connection.query(applicantsTable, (err) => {
      if (err) return console.error(err.message);
      console.log("applications table created successfully");
    });
  };

  const createCandidateSearchImpressionsTable = () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS candidate_search_impressions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT NOT NULL,
        candidate_id INT NOT NULL,
        job_id INT NULL,
        searched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_view (company_id, candidate_id, job_id),
        FOREIGN KEY (candidate_id) REFERENCES candidate_info(id),
        FOREIGN KEY (job_id) REFERENCES job_posts(id)
      );`;

    connection.query(sql, (err) => {
      if (err) return console.error(err.message);
      console.log("candidate_search_impressions table created successfully");
    });
  };

  // ─────────────────────────────────────────────────────────────────
  // getAllApplicants
  // ─────────────────────────────────────────────────────────────────
const getAllApplicants = async (req, res) => {
  try {
    const page  = parseInt(req.query.page,  10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const offset = (page - 1) * limit;

    const jobId = req.query.job_id ? Number(req.query.job_id) : null;
    if (!jobId) return res.status(400).json({ error: "job_id is required" });

    // ── STEP 1: Fetch job ──────────────────────────────────────────
    // INDEX HINT: job_posts(id) — primary key, already indexed
    const job = await new Promise((resolve, reject) =>
      connection.query(
        `SELECT jp.speciality_id, jp.skill_ids, jp.min_salary, jp.max_salary,
                jp.min_experience, jp.max_experience,
                jp.country_id, jp.district_id, jp.city_id,
                jp.account_id, jp.package_id, jp.company_package_id,
                jp.degree_id, jp.degreefields_id,
                jp.billing_model, jp.daily_budget, jp.spent_amount,
                jp.cost_per_click, jp.status, jp.approval_status,
                jp.job_location_type, jp.job_title,
                jp.time_from, jp.time_to
         FROM job_posts jp
         WHERE jp.id = ?`,
        [jobId],
        (err, result) => (err ? reject(err) : resolve(result[0]))
      )
    );

    if (!job) return res.status(404).json({ error: "Job not found" });
    if (job.approval_status !== "Approved") {
      return res.status(403).json({ error: "Job is pending approval", approval_status: job.approval_status });
    }

    const companyId = job.account_id;

    // ── STEP 2: Budget check ───────────────────────────────────────
    const isDailyBudget  = job.billing_model === "daily_budget";
    const dailyCap       = parseFloat(job.daily_budget  || 0);
    const spentSoFar     = parseFloat(job.spent_amount  || 0);
    const budgetExhausted = isDailyBudget && dailyCap > 0 && spentSoFar >= dailyCap;

    // ── STEP 3: Parse city IDs ─────────────────────────────────────
    let jobCityIds = [];
    try {
      const parsed = typeof job.city_id === "string" ? JSON.parse(job.city_id) : job.city_id;
      jobCityIds = Array.isArray(parsed) ? parsed.map(Number) : [];
    } catch { jobCityIds = []; }

    const isRemote = job.job_location_type === "remote" || jobCityIds.length === 0;

    // ── STEP 4: Build WHERE clause ─────────────────────────────────
    // INDEXES NEEDED:
    //   candidate_info(profile_completed, city)
    //   account(accountType, isActive)
    const whereConditions = [
      `a.accountType = 'candidate'`,
      `a.isActive = 'Active'`,
      `c.profile_completed = 1`,
    ];
    const values = [];

    if (!isRemote && jobCityIds.length > 0) {
      // NOTE: JSON_OVERLAPS on otherPreferredCities still full-scans that column.
      // To fully fix, normalize otherPreferredCities into a child table.
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

    const whereClause = `WHERE ${whereConditions.join(" AND ")}`;

    const candidateQuery = `
      SELECT
        a.id AS account_id, a.email, a.username, a.created_at, a.isActive,
        c.id AS candidate_id, c.full_name, c.phone, c.date_of_birth, c.gender,
        c.marital_status, c.expected_salary, c.profile_completed,
        c.address, c.passport_photo, c.resume, c.skills, c.city, c.district, c.country,
        c.otherPreferredCities, c.is_boosted, c.boost_expires_at,
        li.name AS license_type, c.license_number,

        /* ── FIX: single LEFT JOIN replaces 10 correlated subqueries ── */
        COALESCE(la.status,                   'Pending') AS candidateStatus,
        la.id AS application_id,
        la.interview_day,
        la.interview_time,
        la.message,
        la.candidate_response,
        la.requested_interview_day,
        la.requested_interview_time,
        COALESCE(la.company_status,           'pending') AS company_status,
        la.company_offered_day,
        la.company_offered_time,

        /* is_hired_elsewhere — kept as subquery (different job filter, rare) */
        CASE WHEN EXISTS (
          SELECT 1 FROM applications a2
          WHERE a2.candidate_id = c.id AND a2.status = 'Approved' AND a2.job_id != ?
        ) THEN 1 ELSE 0 END AS is_hired_elsewhere,

        /* has_applied — driven by same join, no extra subquery needed */
        CASE WHEN la.id IS NOT NULL AND la.status != 'Cancelled'
             THEN 1 ELSE 0 END AS has_applied

      FROM account a
      INNER JOIN candidate_info c ON a.id = c.account_id
      LEFT JOIN license_types li ON c.license_type = li.id

      /* Latest application row for this job — replaces 10 subqueries */
      LEFT JOIN applications la
        ON la.candidate_id = c.id
        AND la.job_id = ?
        AND la.id = (
          SELECT MAX(la2.id)
          FROM applications la2
          WHERE la2.candidate_id = c.id AND la2.job_id = ?
        )

      ${whereClause}

      ORDER BY
        CASE WHEN c.is_boosted = 1 AND c.boost_expires_at > NOW() THEN 0 ELSE 1 END ASC,
        a.id DESC
      LIMIT ? OFFSET ?
    `;

    // params: is_hired_elsewhere(jobId), JOIN(jobId, jobId), ...whereValues, limit, offset
    const candidatesRaw = await new Promise((resolve, reject) =>
      connection.query(
        candidateQuery,
        [jobId, jobId, jobId, ...values, limit, offset],
        (err, rows) => (err ? reject(err) : resolve(rows))
      )
    );

    const candidateIds = candidatesRaw.map((c) => c.candidate_id);

    // ── STEP 6: Fetch unlocked candidate IDs ──────────────────────
    // INDEX NEEDED: candidate_unlocks(employer_account_id, candidate_id, job_id, unlock_scope)
    const unlockedIds = new Set();
    if (isDailyBudget && candidateIds.length) {
      const unlockRows = await new Promise((resolve, reject) =>
        connection.query(
          `SELECT candidate_id FROM candidate_unlocks
           WHERE employer_account_id = ? AND candidate_id IN (?)
             AND unlock_scope = 'full'
             AND (job_id = ? OR DATE(unlocked_at) = CURDATE())`,
          [companyId, candidateIds, jobId],
          (err, rows) => (err ? reject(err) : resolve(rows))
        )
      );
      unlockRows.forEach((r) => unlockedIds.add(r.candidate_id));
    }

    // ── STEP 7: Side-effects — all fire-and-forget ─────────────────
    if (candidateIds.length > 0 && companyId) {

      // 7a — Log impressions (INSERT IGNORE — truly async, no await)
      // INDEX NEEDED: candidate_search_impressions UNIQUE(company_id, candidate_id, job_id)
      const impressionValues = candidateIds.map((cid) => [companyId, cid, jobId]);
      connection.query(
        `INSERT IGNORE INTO candidate_search_impressions (company_id, candidate_id, job_id) VALUES ?`,
        [impressionValues],
        (err) => { if (err) console.error("Failed to log search impressions:", err); }
      );

      // 7b — Audit log: debounced — max once per employer/job per 5 min
      debouncedAudit(`VIEWED_APPLICANTS:${companyId}:${jobId}`, {
        tableName: "history",
        entityType: "employer",
        entityId: companyId,
        action: "VIEWED_APPLICANTS",
        data: {
          event: `Employer viewed applicants for job: ${job.job_title}`,
          jobId, jobTitle: job.job_title,
          candidateCount: candidateIds.length, page,
        },
        changedBy: companyId,
      });

      // 7c — CV Credits deduction: fire-and-forget, no await
      //      Uses SELECT ... FOR UPDATE to avoid race conditions under load
      if (job.billing_model === "cv_credits" && job.company_package_id) {
        setImmediate(() => {
          connection.query(
            `SELECT used_credits, package_snapshot FROM company_packages WHERE id = ? FOR UPDATE`,
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
              const usedCredits  = pkgRow.used_credits || 0;
              const viewCount    = candidateIds.length;
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
        });
      }
    }

    // ── STEP 8: Batch fetch related data ──────────────────────────
    // INDEX NEEDED: candidate_experience(candidate_id), candidate_education(candidate_id), etc.
    const [experienceRows, educationRows, availabilityRows, certificatesRows, researchRows] =
      await Promise.all([
        candidateIds.length
          ? new Promise((resolve, reject) =>
              connection.query(
                `SELECT e.*, s.name AS speciality_name
                 FROM candidate_experience e
                 LEFT JOIN speciality s ON e.speciality_id = s.id
                 WHERE e.candidate_id IN (?)`,
                [candidateIds], (err, rows) => (err ? reject(err) : resolve(rows))
              ))
          : Promise.resolve([]),
        candidateIds.length
          ? new Promise((resolve, reject) =>
              connection.query(
                `SELECT ed.*, df.name AS degreefield_name, dt.name AS degreetype_name, ins.name AS institute_name
                 FROM candidate_education ed
                 LEFT JOIN degreefields df  ON ed.degree_id      = df.id
                 LEFT JOIN degreetypes dt   ON df.degree_type_id = dt.id
                 LEFT JOIN institute ins    ON ed.institute_id   = ins.id
                 WHERE ed.candidate_id IN (?)`,
                [candidateIds], (err, rows) => (err ? reject(err) : resolve(rows))
              ))
          : Promise.resolve([]),
        candidateIds.length
          ? new Promise((resolve, reject) =>
              connection.query(
                `SELECT * FROM candidate_availability WHERE candidate_id IN (?)`,
                [candidateIds], (err, rows) => (err ? reject(err) : resolve(rows))
              ))
          : Promise.resolve([]),
        candidateIds.length
          ? new Promise((resolve, reject) =>
              connection.query(
                `SELECT * FROM candidate_certificates WHERE candidate_id IN (?) ORDER BY created_at DESC`,
                [candidateIds], (err, rows) => (err ? reject(err) : resolve(rows))
              ))
          : Promise.resolve([]),
        candidateIds.length
          ? new Promise((resolve, reject) =>
              connection.query(
                `SELECT * FROM candidate_research WHERE candidate_id IN (?) ORDER BY created_at DESC`,
                [candidateIds], (err, rows) => (err ? reject(err) : resolve(rows))
              ))
          : Promise.resolve([]),
      ]);

    // ── STEP 9: Map skills & cities ────────────────────────────────
    const allSkillIds = [];
    const allCityIds  = [];

    candidatesRaw.forEach((c) => {
      try { c.skills = Array.isArray(c.skills) ? c.skills : JSON.parse(c.skills || "[]"); }
      catch { c.skills = []; }
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
          [[...new Set(allSkillIds)]], (err, rows) => (err ? reject(err) : resolve(rows))
        )
      );
      skillRows.forEach((s) => (skillsMap[s.id] = s.name));
    }

    const cityMapObj = {};
    if (allCityIds.length) {
      const cityRows = await new Promise((resolve, reject) =>
        connection.query(
          `SELECT id, name FROM cities WHERE id IN (?)`,
          [[...new Set(allCityIds)]], (err, rows) => (err ? reject(err) : resolve(rows))
        )
      );
      cityRows.forEach((c) => (cityMapObj[c.id] = c.name));
    }

    // ── STEP 10: Build full candidate objects ──────────────────────
    const candidates = candidatesRaw.map((c) => ({
      ...c,
      skills: c.skills.map((id) => ({ id, name: skillsMap[id] || "" })),
      city_name: cityMapObj[c.city] || "-",
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
          speciality: e.speciality_id ? { id: e.speciality_id, name: e.speciality_name } : null,
        })),
      education: educationRows
        .filter((ed) => ed.candidate_id === c.candidate_id)
        .map((ed) => ({
          id: ed.id,
          degreefield: { id: ed.degree_id, name: ed.degreefield_name },
          degreetype:  { id: ed.degree_type_id, name: ed.degreetype_name },
          institute:   { id: ed.institute_id, name: ed.institute_name },
          is_ongoing: ed.is_ongoing,
          start_date: ed.start_date,
          end_date: ed.end_date,
        })),
      availability: availabilityRows.filter((av) => av.candidate_id === c.candidate_id),
      certificates: certificatesRows.filter((cert) => cert.candidate_id === c.candidate_id),
      research:     researchRows.filter((r) => r.candidate_id === c.candidate_id),
    }));

    // ── STEP 11: Parse job requirements for scoring ────────────────
    let jobSkillIds = [];
    try {
      jobSkillIds = Array.isArray(job.skill_ids)
        ? job.skill_ids.map(Number)
        : JSON.parse(job.skill_ids || "[]").map(Number);
    } catch { jobSkillIds = []; }

    const jobMinSalary = parseFloat(job.min_salary  || 0);
    const jobMaxSalary = parseFloat(job.max_salary  || 0);
    const jobMinExp    = parseInt(job.min_experience) || 0;
    const jobMaxExp    = parseInt(job.max_experience) || 50;
    const tierOrder    = { strong: 0, good: 1, weak: 2 };

    // ── STEP 12: Score + tier each candidate ──────────────────────
    const tieredCandidates = candidates
      .map((c) => {
        const matched = [];
        const missing = [];
        let score = 0;

        // Location (10pts)
        let locationScore = 0;
        let location_type = "pipeline";
        if (isRemote) {
          locationScore = 10;
          location_type = "remote";
        } else {
          const candidateCity    = Number(c.city);
          const preferredCityIds = (c.otherPreferredCities || []).map((city) =>
            typeof city === "object" ? Number(city.id) : Number(city)
          );
          const mainCityMatch      = jobCityIds.includes(candidateCity);
          const preferredCityMatch = jobCityIds.some((id) => preferredCityIds.includes(id));
          locationScore = mainCityMatch ? 10 : preferredCityMatch ? 6 : 0;
          location_type = mainCityMatch ? "main_city" : preferredCityMatch ? "preferred_city" : "pipeline";
        }
        score += locationScore;

        // Skills (30pts)
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

        // Experience (25pts)
       const candExp = calculateTotalExperience(
  experienceRows.filter((e) => e.candidate_id === c.candidate_id)
);
        let expScore = 0;
        if (jobMinExp === 0 && jobMaxExp === 0)        { expScore = 25; }
        else if (candExp >= jobMinExp && candExp <= jobMaxExp) { expScore = 25; }
        else if (candExp < jobMinExp)                  { expScore = Math.max(0, 25 - (jobMinExp - candExp) * 4); }
        else                                           { expScore = 20; }
        score += expScore;
        if (expScore >= 20) matched.push("Experience");
        else missing.push(`Experience (${candExp} yrs, need ${jobMinExp}-${jobMaxExp})`);

        // Speciality (20pts)
        const candSpecialities = (c.experience || [])
          .map((e) => e.speciality?.id)
          .filter(Boolean)
          .map(Number);
        let specScore = 0;
        if (!job.speciality_id)                                          { specScore = 20; matched.push("Speciality"); }
        else if (candSpecialities.includes(Number(job.speciality_id))) { specScore = 20; matched.push("Speciality"); }
        else                                                             { missing.push("Speciality"); }
        score += specScore;

        // Degree (10pts)
        const candidateEducation = c.education || [];
        const hasDegree          = candidateEducation.length > 0;
        let degreeScore = 0;
        if (!job.degree_id && !job.degreefields_id) {
          degreeScore = hasDegree ? 10 : 0;
          if (hasDegree) matched.push("Education"); else missing.push("Education");
        } else {
          const jobDegreeTypeId  = job.degree_id       ? Number(job.degree_id)       : null;
          const jobDegreeFieldId = job.degreefields_id ? Number(job.degreefields_id) : null;
          const degreeTypeMatch  = candidateEducation.some((ed) => jobDegreeTypeId  && ed.degreetype?.id  === jobDegreeTypeId);
          const degreeFieldMatch = candidateEducation.some((ed) => jobDegreeFieldId && ed.degreefield?.id === jobDegreeFieldId);
          if (jobDegreeFieldId && jobDegreeTypeId) {
            if (degreeFieldMatch && degreeTypeMatch)   { degreeScore = 10; matched.push("Education (degree & field match)"); }
            else if (degreeTypeMatch || degreeFieldMatch) { degreeScore = 5; matched.push(`Education (partial: ${degreeTypeMatch ? "type" : "field"} matched)`); }
            else if (hasDegree)                        { degreeScore = 2; missing.push("Education (wrong degree type & field)"); }
            else                                       { degreeScore = 0; missing.push("Education (none)"); }
          } else if (jobDegreeFieldId) {
            if (degreeFieldMatch)   { degreeScore = 10; matched.push("Education (field match)"); }
            else if (hasDegree)     { degreeScore = 3;  missing.push("Education (wrong field)"); }
            else                    { degreeScore = 0;  missing.push("Education (none)"); }
          } else if (jobDegreeTypeId) {
            if (degreeTypeMatch)    { degreeScore = 10; matched.push("Education (degree type match)"); }
            else if (hasDegree)     { degreeScore = 3;  missing.push("Education (wrong degree type)"); }
            else                    { degreeScore = 0;  missing.push("Education (none)"); }
          }
        }
        score += degreeScore;
        const degreeMatched = degreeScore >= 5;

        // Salary (15pts)
        const candSalary = parseFloat(c.expected_salary || 0);
        let salaryScore  = 15;
        let salaryOver   = false;
        if (jobMinSalary || jobMaxSalary) {
          if (candSalary >= jobMinSalary && candSalary <= jobMaxSalary) {
            salaryScore = 15; matched.push("Salary");
          } else if (candSalary < jobMinSalary) {
            salaryScore = 10; matched.push("Salary (expects less)");
          } else {
            const overage = ((candSalary - jobMaxSalary) / jobMaxSalary) * 100;
            salaryScore   = overage > 50 ? 0 : overage > 25 ? 5 : 8;
            salaryOver    = true;
            missing.push("Salary (expects more than budget)");
          }
        } else {
          matched.push("Salary");
        }
        score += salaryScore;

        // Availability (10pts)
        const candAvailability = availabilityRows.filter((av) => av.candidate_id === c.candidate_id);
        let availScore = 0;
        if (!job.time_from || !job.time_to) {
          availScore = 10;
          matched.push("Availability");
        } else if (candAvailability.length === 0) {
          availScore = 5;
          missing.push("Availability (not specified by candidate)");
        } else {
          const hasOverlap = candAvailability.some(
            (slot) => slot.time_from <= job.time_to && slot.time_to >= job.time_from
          );
          if (hasOverlap) { availScore = 10; matched.push("Availability"); }
          else            { availScore = 0;  missing.push(`Availability (hours don't overlap with ${job.time_from}–${job.time_to})`); }
        }
        score += availScore;

        // Tier
        const skillsMatched    = skillScore >= 20;
        const expMatched       = expScore   >= 20;
        const specMatched      = specScore  === 20;
        const coreCriteriaCount = [skillsMatched, expMatched, specMatched, degreeMatched].filter(Boolean).length;
        if (coreCriteriaCount === 0) return null;

        let tier, tier_label, tier_color;
        if      (coreCriteriaCount === 4) { tier = "strong"; tier_label = "Strong Match"; tier_color = "green"; }
        else if (coreCriteriaCount >= 2)  { tier = "good";   tier_label = "Good Match";   tier_color = "blue"; }
        else                              { tier = "weak";   tier_label = "Partial Match"; tier_color = "amber"; }

        if (salaryOver && tier === "strong") { tier = "good"; tier_label = "Good Match"; tier_color = "blue"; }

        return {
          ...c,
          ai_score: Math.min(100, score),
          tier, tier_label, tier_color, location_type, matched, missing,
          billing_info: {
            model: job.billing_model,
            daily_budget:     isDailyBudget ? parseFloat(job.daily_budget  || 0) : null,
            spent_amount:     isDailyBudget ? parseFloat(job.spent_amount  || 0) : null,
            remaining_today:  isDailyBudget ? Math.max(0, parseFloat(job.daily_budget || 0) - parseFloat(job.spent_amount || 0)) : null,
          },
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        if (tierOrder[a.tier] !== tierOrder[b.tier]) return tierOrder[a.tier] - tierOrder[b.tier];
        const locOrder = { remote: 0, main_city: 0, preferred_city: 1, pipeline: 2 };
        if (locOrder[a.location_type] !== locOrder[b.location_type]) return locOrder[a.location_type] - locOrder[b.location_type];
        if (b.is_boosted !== a.is_boosted) return b.is_boosted ? 1 : -1;
        return b.ai_score - a.ai_score;
      });

    // ── STEP 13: Mask locked candidates ───────────────────────────
    const finalCandidates = tieredCandidates.map((c) => {
      if (!isDailyBudget) return c;

      const isShortlistedOrApproved = [
        "Interview_Scheduled","Interview_Conducted","Shortlisted",
        "Considered","Offered","Selected","Joined",
      ].includes(c.candidateStatus);

      if (isShortlistedOrApproved && !unlockedIds.has(c.candidate_id)) {
        connection.query(
          `INSERT IGNORE INTO candidate_unlocks
           (employer_account_id, candidate_id, job_id, cost_charged, unlock_scope, company_package_id)
           VALUES (?, ?, ?, 0, 'full', NULL)`,
          [companyId, c.candidate_id, jobId],
          (err) => {
            if (err) console.error("Failed to auto-unlock shortlisted candidate:", err);
            else console.log(`✅ Auto-unlocked shortlisted candidate ${c.candidate_id} for job ${jobId}`);
          }
        );
        unlockedIds.add(c.candidate_id);
        return { ...c, locked: false };
      }

      if (unlockedIds.has(c.candidate_id)) return { ...c, locked: false };

      return {
        candidate_id:     c.candidate_id,
        locked:           true,
        tier:             c.tier,
        tier_label:       c.tier_label,
        tier_color:       c.tier_color,
        ai_score:         c.ai_score,
        location_type:    c.location_type,
        matched:          c.matched,
        missing:          c.missing,
        is_boosted:       c.is_boosted,
        total_experience: c.total_experience,
        has_applied:      c.has_applied,
        billing_info:     c.billing_info,
        candidateStatus:  c.candidateStatus,
        full_name:        c.full_name,
        skills:           c.skills,
        experience:       c.experience,
        availability:     c.availability,
        email:            null,
        phone:            null,
        passport_photo:   c.passport_photo || null,
        resume:           null,
        address:          null,
        date_of_birth:    null,
        city_name:        c.city_name || null,
        expected_salary:  null,
      };
    });

    // ── STEP 14: Summary + response ───────────────────────────────
    const summary = {
      total:              finalCandidates.length,
      strong:             finalCandidates.filter((c) => c.tier === "strong").length,
      good:               finalCandidates.filter((c) => c.tier === "good").length,
      weak:               finalCandidates.filter((c) => c.tier === "weak").length,
      is_remote:          isRemote,
      from_main_city:     finalCandidates.filter((c) => c.location_type === "main_city").length,
      from_preferred_city:finalCandidates.filter((c) => c.location_type === "preferred_city").length,
      from_remote:        finalCandidates.filter((c) => c.location_type === "remote").length,
    };

    const budgetStatus = isDailyBudget
      ? {
          model:           "daily_budget",
          daily_cap:       dailyCap,
          spent_today:     spentSoFar,
          remaining_today: Math.max(0, dailyCap - spentSoFar),
          is_exhausted:    budgetExhausted,
          cost_per_click:  parseFloat(job.cost_per_click || 0),
        }
      : job.billing_model === "cv_credits"
        ? { model: "cv_credits" }
        : { model: job.billing_model || "package" };

    return res.status(200).json({ summary, page, limit, budget_status: budgetStatus, candidate: finalCandidates });

  } catch (err) {
    console.error("getAllApplicants error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};


  // ─────────────────────────────────────────────────────────────────
  // unlockCandidate
  // ─────────────────────────────────────────────────────────────────
const unlockCandidate = async (req, res) => {
  try {
    const { candidateId, jobId } = req.body;
    if (!candidateId || !jobId) 
      return res.status(400).json({ error: "candidateId and jobId are required" });

    // 1. Fetch job
    const job = await new Promise((resolve, reject) =>
      connection.query(
        `SELECT billing_model, daily_budget, spent_amount, cost_per_click, account_id, approval_status, job_title 
         FROM job_posts WHERE id = ?`,
        [jobId], (err, rows) => (err ? reject(err) : resolve(rows[0]))
      )
    );

    if (!job) return res.status(404).json({ error: "Job not found" });
    if (job.approval_status !== "Approved") return res.status(403).json({ error: "Job is not approved" });
    if (job.billing_model !== "daily_budget") return res.status(400).json({ error: "This job does not use daily budget billing" });

    const companyId = job.account_id;
    const dailyCap = parseFloat(job.daily_budget || 0);
    const spent = parseFloat(job.spent_amount || 0);
    const cpc = parseFloat(job.cost_per_click || 0);
    const remaining = dailyCap - spent;

    // 2a. Check if already unlocked via CV credits (global, permanent — never re-charge)
    const cvCreditUnlock = await new Promise((resolve, reject) =>
      connection.query(
        `SELECT id FROM candidate_unlocks
         WHERE employer_account_id = ? AND candidate_id = ?
           AND unlock_type = 'cv_credit' AND unlock_scope = 'full'`,
        [companyId, candidateId],
        (err, rows) => (err ? reject(err) : resolve(rows.length > 0))
      )
    );

    // 2b. Check if already unlocked via daily budget for THIS specific job
    const jobUnlock = await new Promise((resolve, reject) =>
      connection.query(
        `SELECT id FROM candidate_unlocks
         WHERE employer_account_id = ? AND candidate_id = ?
           AND job_id = ? AND unlock_type = 'daily_budget' AND unlock_scope = 'full'`,
        [companyId, candidateId, jobId],
        (err, rows) => (err ? reject(err) : resolve(rows.length > 0))
      )
    );

    const alreadyUnlocked = cvCreditUnlock || jobUnlock;

    if (!alreadyUnlocked) {
      // 3. Budget check
      if (remaining <= 0) {
        return res.status(402).json({
          error: "Daily budget exhausted",
          message: "Your daily budget has been used up. Please increase it or wait until tomorrow.",
        });
      }

      // 4. Deduct cost
      const chargeAmount = Math.min(cpc, remaining);
      await new Promise((resolve, reject) =>
        connection.query(
          `UPDATE job_posts SET spent_amount = LEAST(spent_amount + ?, daily_budget) WHERE id = ?`,
          [chargeAmount, jobId], (err) => (err ? reject(err) : resolve())
        )
      );

      // 5. Log unlock (daily_budget type, tied to this job)
      await new Promise((resolve, reject) =>
        connection.query(
          `INSERT IGNORE INTO candidate_unlocks 
           (employer_account_id, candidate_id, job_id, cost_charged, unlock_scope, unlock_type, company_package_id) 
           VALUES (?, ?, ?, ?, 'full', 'daily_budget', NULL)`,
          [companyId, candidateId, jobId, chargeAmount],
          (err) => (err ? reject(err) : resolve())
        )
      );

      // 6. Employer audit log
      logAudit({
        tableName: "history",
        entityType: "employer",
        entityId: companyId,
        action: "CANDIDATE_UNLOCKED",
        data: {
          event: `Employer unlocked candidate profile for job: ${job.job_title}`,
          candidateId, jobId, jobTitle: job.job_title,
          chargeAmount, already_unlocked: false,
          unlock_type: "daily_budget",
        },
        changedBy: companyId,
      });

      // 7. Candidate audit log
      logAudit({
        tableName: "history",
        entityType: "candidate",
        entityId: candidateId,
        action: "PROFILE_VIEWED",
        data: {
          event: `Your profile was viewed by an employer for job: ${job.job_title}`,
          jobId, jobTitle: job.job_title, employerId: companyId,
        },
        changedBy: companyId,
      });

      // 8. Auto-pause job if budget now exhausted
      const newSpent = spent + chargeAmount;
      if (newSpent >= dailyCap) {
        connection.query(
          `UPDATE job_posts SET status = 'Inactive' WHERE id = ? AND spent_amount >= daily_budget`,
          [jobId],
          (err) => {
            if (err) console.error("Failed to auto-pause job:", err);
            else console.warn(`⚠️ Job ${jobId} auto-paused — daily budget exhausted`);
          }
        );
      }

    } else {
      // Already unlocked — log revisit, no charge
      const revisitReason = cvCreditUnlock ? "cv_credit" : "daily_budget";
      console.log(`ℹ️ Candidate ${candidateId} already unlocked (${revisitReason}) — no charge`);

      logAudit({
        tableName: "history",
        entityType: "employer",
        entityId: companyId,
        action: "CANDIDATE_PROFILE_REVISITED",
        data: {
          event: `Employer re-viewed already unlocked candidate for job: ${job.job_title}`,
          candidateId, jobId, jobTitle: job.job_title,
          chargeAmount: 0, already_unlocked: true,
          unlock_type: revisitReason,
        },
        changedBy: companyId,
      });
    }

    // 9. Fetch updated budget (after potential deduction)
    const updatedJob = await new Promise((resolve, reject) =>
      connection.query(
        `SELECT daily_budget, spent_amount, cost_per_click FROM job_posts WHERE id = ?`,
        [jobId], (err, rows) => (err ? reject(err) : resolve(rows[0]))
      )
    );

    const updatedCap = parseFloat(updatedJob?.daily_budget || 0);
    const updatedSpent = parseFloat(updatedJob?.spent_amount || 0);
    const updatedRemaining = Math.max(0, updatedCap - updatedSpent);

    // 10. Fetch full candidate data
    const candidateRow = await new Promise((resolve, reject) =>
  connection.query(
    `SELECT c.*, a.email, a.username,
            (SELECT id FROM applications WHERE candidate_id = c.id AND job_id = ? ORDER BY id DESC LIMIT 1) AS application_id
     FROM candidate_info c 
     INNER JOIN account a ON a.id = c.account_id  
     WHERE c.id = ?`,
    [jobId, candidateId],
        (err, rows) => (err ? reject(err) : resolve(rows[0]))
      )
    );

    if (!candidateRow) return res.status(404).json({ error: "Candidate not found" });

    // Parse JSON fields
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

    // Fetch experience
const experienceRows = await new Promise((resolve, reject) =>
  connection.query(
    `SELECT e.speciality_id, e.start_date, e.end_date, e.is_ongoing
     FROM candidate_experience e WHERE e.candidate_id = ?`,
    [candidateId],
    (err, rows) => (err ? reject(err) : resolve(rows)),
  ),
);
    // Fetch education
    const educationRows = await new Promise((resolve, reject) =>
      connection.query(
        `SELECT ed.*, df.name AS degreefield_name, dt.name AS degreetype_name, ins.name AS institute_name
         FROM candidate_education ed
         LEFT JOIN degreefields df ON ed.degree_id = df.id
         LEFT JOIN degreetypes dt ON df.degree_type_id = dt.id
         LEFT JOIN institute ins ON ed.institute_id = ins.id
         WHERE ed.candidate_id = ?`,
        [candidateId], (err, rows) => (err ? reject(err) : resolve(rows))
      )
    );

    // Fetch availability
    const availabilityRows = await new Promise((resolve, reject) =>
      connection.query(
        `SELECT * FROM candidate_availability WHERE candidate_id = ?`,
        [candidateId], (err, rows) => (err ? reject(err) : resolve(rows))
      )
    );

    // Fetch certificates
    const certificatesRows = await new Promise((resolve, reject) =>
      connection.query(
        `SELECT * FROM candidate_certificates WHERE candidate_id = ? ORDER BY created_at DESC`,
        [candidateId], (err, rows) => (err ? reject(err) : resolve(rows))
      )
    );

    // Fetch research
    const researchRows = await new Promise((resolve, reject) =>
      connection.query(
        `SELECT * FROM candidate_research WHERE candidate_id = ? ORDER BY created_at DESC`,
        [candidateId], (err, rows) => (err ? reject(err) : resolve(rows))
      )
    );

    // Fetch skill names
    const skillIds = candidateRow.skills || [];
    let skillsWithNames = [];
    if (skillIds.length) {
      const skillRows = await new Promise((resolve, reject) =>
        connection.query(
          `SELECT id, name FROM skills WHERE id IN (?)`,
          [skillIds], (err, rows) => (err ? reject(err) : resolve(rows))
        )
      );
      skillsWithNames = skillRows;
    }

    // Construct full candidate object
    const fullCandidate = {
      ...candidateRow,
      skills: skillsWithNames,
      experience: experienceRows.map(e => ({
        id: e.id,
        company_name: e.company_name,
        designation: e.designation,
        total_experience: e.total_experience,
        start_date: e.start_date,
        end_date: e.end_date,
        speciality: e.speciality_id ? { id: e.speciality_id, name: e.speciality_name } : null,
      })),
      education: educationRows.map(ed => ({
        id: ed.id,
        degreefield: { id: ed.degree_id, name: ed.degreefield_name },
        degreetype: { id: ed.degree_type_id, name: ed.degreetype_name },
        institute: { id: ed.institute_id, name: ed.institute_name },
        is_ongoing: ed.is_ongoing,
        start_date: ed.start_date,
        end_date: ed.end_date,
      })),
      availability: availabilityRows,
      certificates: certificatesRows,
      research: researchRows,
    };

    // 11. Final response
    return res.status(200).json({
      success: true,
      charged: !alreadyUnlocked,
      charge_amount: alreadyUnlocked ? 0 : Math.min(cpc, remaining),
      unlock_type: cvCreditUnlock ? "cv_credit" : "daily_budget",
      candidate: { ...fullCandidate, locked: false },
      budget_status: {
        daily_cap: updatedCap,
        spent_today: updatedSpent,
        remaining_today: updatedRemaining,
        is_exhausted: updatedSpent >= updatedCap,
        cost_per_click: cpc,
      },
    });

  } catch (err) {
    console.error("unlockCandidate error:", err);
    return res.status(500).json({ error: "Server error", details: err.message });
  }
};
  // ─────────────────────────────────────────────────────────────────
  // updateApplicantStatus
  // ─────────────────────────────────────────────────────────────────
  const updateApplcantStatus = (req, res) => {
    const {
      candidateId, jobId, status, interview_day, interview_time, message,
      candidate_response, requested_interview_day, requested_interview_time,
      candidate_response_message, company_status, company_offered_day, company_offered_time,
      // ── new fields from ApplicantCard modals ──
      offerDate, offeredSalary, joiningDate,
    } = req.body;

    if (!candidateId || !jobId) return res.status(400).json({ error: "Candidate ID and Job ID are required" });

    const selectQuery = `SELECT * FROM applications WHERE candidate_id = ? AND job_id = ?`;
    const employerQuery = `
      SELECT jp.account_id, jp.job_title, a.company_name
      FROM job_posts jp
      JOIN company_info a ON a.account_id = jp.account_id
      WHERE jp.id = ? LIMIT 1
    `;

    const logStatusHistory = (employerId, jobTitle, companyName) => {
      const loggableStatuses = ["Saved","Interview_Scheduled","Interview_Conducted","Shortlisted","Considered","Offered","Selected","Joined","Rejected","Refused to Join"];
      if (loggableStatuses.includes(status)) {
        const actionMap = {
          Saved: "SAVED",
          Interview_Scheduled: "INTERVIEW_SCHEDULED",
          Interview_Conducted: "INTERVIEW_CONDUCTED",
          Shortlisted: "SHORTLISTED",
          Considered: "CONSIDERED",
          Offered: "OFFERED",
          Selected: "SELECTED",
          Joined: "JOINED",
          Rejected: "REJECTED",
          "Refused to Join": "REFUSED_TO_JOIN",
        };
        const action = actionMap[status];
        logAudit({ tableName: "history", entityType: "employer", entityId: employerId, action, data: { event: `Candidate ${status.toLowerCase()} for job: ${jobTitle}`, candidateId, jobId, status }, changedBy: employerId });
        logAudit({ tableName: "history", entityType: "candidate", entityId: candidateId, action, data: { event: `You were ${status.toLowerCase()} for job: ${jobTitle} at ${companyName}`, jobId, status }, changedBy: employerId });
      }
    };

    connection.query(selectQuery, [candidateId, jobId], (err, results) => {
      if (err) return res.status(500).json({ error: "Database error" });

      if (results.length > 0) {
        const appId = results[0].id;
        const fields = [];
        const values = [];

        if (status !== undefined)                    { fields.push("status = ?");                     values.push(status); }
        if (interview_day !== undefined)             { fields.push("interview_day = ?");              values.push(interview_day); }
        if (interview_time !== undefined)            { fields.push("interview_time = ?");             values.push(interview_time); }
        if (message !== undefined)                   { fields.push("message = ?");                    values.push(message); }
        if (candidate_response !== undefined)        { fields.push("candidate_response = ?");         values.push(candidate_response); }
        if (requested_interview_day !== undefined)   { fields.push("requested_interview_day = ?");    values.push(requested_interview_day); }
        if (requested_interview_time !== undefined)  { fields.push("requested_interview_time = ?");   values.push(requested_interview_time); }
        if (candidate_response_message !== undefined){ fields.push("candidate_response_message = ?"); values.push(candidate_response_message); }
        if (company_status !== undefined)            { fields.push("company_status = ?");             values.push(company_status); }
        if (company_offered_day !== undefined)       { fields.push("company_offered_day = ?");        values.push(company_offered_day); }
        if (company_offered_time !== undefined)      { fields.push("company_offered_time = ?");       values.push(company_offered_time); }
        // ── new fields ──
        if (offerDate !== undefined)                 { fields.push("offer_date = ?");                 values.push(offerDate); }
        if (offeredSalary !== undefined)             { fields.push("offered_salary = ?");             values.push(offeredSalary); }
        if (joiningDate !== undefined)               { fields.push("joining_date = ?");               values.push(joiningDate); }

        if (fields.length === 0) return res.status(400).json({ error: "No fields provided to update" });

        const updateQuery = `UPDATE applications SET ${fields.join(", ")} WHERE id = ?`;
        values.push(appId);

        connection.query(updateQuery, values, (err2) => {
          if (err2) return res.status(500).json({ error: "Database error" });
          connection.query(employerQuery, [jobId], (empErr, empRows) => {
            if (!empErr && empRows.length) logStatusHistory(empRows[0].account_id, empRows[0].job_title, empRows[0].company_name);
   const notifiableStatuses = ["Rejected", "Shortlisted", "Interview_Scheduled", "Offered", "Selected"];
if (notifiableStatuses.includes(status)) {
    sendStatusNotification(candidateId, jobId, status, {
        interview_day,
        interview_time,
        offeredSalary,
        joiningDate,
    });
}
            return res.json({ message: "Application updated successfully" });
          });
        });

      } else {
        const insertQuery = `INSERT INTO applications (candidate_id, job_id, status, message, interview_day, interview_time, source) VALUES (?, ?, ?, ?, ?, ?,'employer')`;
        connection.query(
          insertQuery,
          [candidateId, jobId, status || "Pending", message || "", interview_day || null, interview_time || null],
          (err3) => {
            if (err3) return res.status(500).json({ error: "Database error" });
            connection.query(employerQuery, [jobId], (empErr, empRows) => {
              if (!empErr && empRows.length) logStatusHistory(empRows[0].account_id, empRows[0].job_title, empRows[0].company_name);
              return res.json({ message: "Application created successfully" });
            });
          }
        );
      }
    });
  };

  // ─────────────────────────────────────────────────────────────────
  // applyJob
  // ─────────────────────────────────────────────────────────────────
 // ─────────────────────────────────────────────────────────────────
  // applyJob
  // ─────────────────────────────────────────────────────────────────
  const applyJob = (req, res) => {
    const accountId = req.user.userId;
    const { job_id, answers } = req.body; // ← answers: [{question_id, answer_text}]

    if (!job_id) {
      return res.status(400).json({ error: "job_id is required" });
    }

    connection.query(
      "SELECT id FROM candidate_info WHERE account_id = ? LIMIT 1",
      [accountId],
      (err, rows) => {
        if (err) {
          return res.status(500).json({ error: "Database error" });
        }

        if (!rows.length) {
          return res.status(404).json({ error: "Candidate not found" });
        }

        const candidateId = rows[0].id;

        connection.query(
          "SELECT id FROM applications WHERE job_id = ? AND candidate_id = ? AND status != 'Cancelled'",
          [job_id, candidateId],
          (err2, existing) => {
            if (err2) {
              return res.status(500).json({ error: "Database error" });
            }

            if (existing.length > 0) {
              return res.status(409).json({ error: "Already applied" });
            }

            // ── If job has required screening questions, verify all are answered ──
            connection.query(
              "SELECT id, is_required FROM job_screening_questions WHERE job_id = ?",
              [job_id],
              (sqErr, screeningQuestions) => {
                if (sqErr) {
                  return res.status(500).json({ error: "Database error" });
                }

                const requiredIds = screeningQuestions
                  .filter((q) => q.is_required)
                  .map((q) => q.id);

                const answeredIds = Array.isArray(answers)
                  ? answers.map((a) => a.question_id)
                  : [];

                const missingRequired = requiredIds.filter(
                  (id) => !answeredIds.includes(id)
                );

                if (missingRequired.length > 0) {
                  return res.status(400).json({
                    error: "Missing required screening answers",
                    missing_question_ids: missingRequired,
                  });
                }

                connection.query(
                  `SELECT jp.job_title, ci.company_name, jp.account_id
                  FROM job_posts jp
                  LEFT JOIN company_info ci ON ci.account_id = jp.account_id
                  WHERE jp.id = ?
                  LIMIT 1`,
                  [job_id],
                  (jobErr, jobRows) => {
                    if (jobErr) {
                      return res.status(500).json({ error: "Database error" });
                    }

                    const jobTitle = jobRows?.[0]?.job_title || "a job";
                    const companyName = jobRows?.[0]?.company_name || "a company";
                    const employerId = jobRows?.[0]?.account_id || null;

                    connection.query(
                      `INSERT INTO applications 
                      (job_id, candidate_id, status, message, source)
                      VALUES (?, ?, 'Applied', '', 'candidate')`,
                      [job_id, candidateId],
                      (err3, result3) => {
                        if (err3) {
                          return res.status(500).json({
                            error: "Database error",
                            details: err3.message,
                          });
                        }

                        const applicationId = result3.insertId;

                        // ── Insert screening answers, if any ──
                        const saveAnswers = (cb) => {
  if (!Array.isArray(answers) || !answers.length) {
    console.log("⚠️ No answers array or empty:", answers);
    return cb();
  }

  const values = answers
    .filter((a) => a.question_id && a.answer_text !== undefined)
    .map((a) => [applicationId, a.question_id, a.answer_text]);

  console.log("📝 applicationId:", applicationId);
  console.log("📝 values to insert:", values);

  if (!values.length) {
    console.log("⚠️ values array empty after filtering — nothing to insert");
    return cb();
  }

  connection.query(
    `INSERT INTO application_answers (application_id, question_id, answer_text) VALUES ?`,
    [values],
    (ansErr, result) => {
      if (ansErr) {
        console.error("❌ Failed to save screening answers:", ansErr);
      } else {
        console.log("✅ Answers saved, affectedRows:", result.affectedRows);
      }
      cb();
    }
  );
};

                        saveAnswers(() => {
                          logAudit({
                            tableName: "history",
                            entityType: "candidate",
                            entityId: accountId,
                            action: "JOB_APPLIED",
                            data: {
                              event: `You applied for job: ${jobTitle} at ${companyName}`,
                              job_id,
                              jobTitle,
                              companyName,
                              employerId,
                              had_screening_answers: Array.isArray(answers) && answers.length > 0,
                            },
                            changedBy: accountId,
                          });

                          if (employerId) {
                            logAudit({
                              tableName: "history",
                              entityType: "employer",
                              entityId: employerId,
                              action: "APPLICATION_RECEIVED",
                              data: {
                                event: `New application received for job: ${jobTitle}`,
                                job_id,
                                jobTitle,
                                candidateId,
                              },
                              changedBy: accountId,
                            });
                          }

                          return res.json({
                            success: true,
                            message: "Applied successfully",
                            application_id: applicationId,
                          });
                        });
                      }
                    );
                  }
                );
              }
            );
          }
        );
      }
    );
  };
  // ─────────────────────────────────────────────────────────────────
  // getAppliedJobs
  // ─────────────────────────────────────────────────────────────────
  const getAppliedJobs = (req, res) => {
    const accountId = req.user.userId;

    connection.query("SELECT id FROM candidate_info WHERE account_id = ? LIMIT 1", [accountId], (err, rows) => {
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
          jp.account_id,
          jp.min_salary,
          jp.max_salary,
          jp.job_type_id,
          ccy.code AS currency,
          jt.name AS job_type,
          c.company_name,
          city.name AS city_name,
          comp.logo AS company_logo
        FROM applications ap
        INNER JOIN job_posts jp ON ap.job_id = jp.id
        LEFT JOIN company_info c ON jp.account_id = c.account_id
        LEFT JOIN currencies ccy ON jp.currency_id = ccy.id
        LEFT JOIN jobtypes jt ON jp.job_type_id = jt.id
        LEFT JOIN company_info comp ON jp.account_id = comp.account_id
        LEFT JOIN cities city ON city.id = JSON_UNQUOTE(JSON_EXTRACT(jp.city_id, '$[0]'))
        WHERE ap.candidate_id = ?
        AND ap.status != 'Cancelled'
        ORDER BY ap.created_at DESC
      `;

      connection.query(query, [candidateId], (err2, results) => {
        if (err2) return res.status(500).json({ error: "Database error" });

        const formattedResults = results.map(job => ({
          ...job,
          company_logo: job.company_logo ? job.company_logo.toString('base64') : null
        }));

        res.json({ success: true, data: formattedResults });
      });
    });
  };
  // ─────────────────────────────────────────────────────────────────
  // getApplicationStats
  // ─────────────────────────────────────────────────────────────────
  const getApplicationStats = (req, res) => {
    const accountId = req.user.userId;
    const { period = "28days", type = "shortlisted" } = req.query;
    const status = type === "approved" ? "Approved" : "Shortlisted";

    connection.query(`SELECT id FROM candidate_info WHERE account_id = ? LIMIT 1`, [accountId], (err, rows) => {
      if (err) return res.status(500).json({ error: "Database error" });
      if (!rows.length) return res.json({ success: true, data: [], current_total: 0, previous_total: 0 });

      const candidateId = rows[0].id;
      let currentInterval, previousInterval, groupFormat;

      if (period === "28days") { currentInterval = "INTERVAL 28 DAY"; previousInterval = "INTERVAL 56 DAY"; groupFormat = "%Y-%m-%d"; }
      else if (period === "weekly") { currentInterval = "INTERVAL 8 WEEK"; previousInterval = "INTERVAL 16 WEEK"; groupFormat = "%x-%v"; }
      else { currentInterval = "INTERVAL 6 MONTH"; previousInterval = "INTERVAL 12 MONTH"; groupFormat = "%Y-%m"; }

      const currentSql = `SELECT DATE_FORMAT(created_at, ?) AS period_key, COUNT(*) AS count FROM applications WHERE candidate_id = ? AND status = ? AND created_at >= DATE_SUB(NOW(), ${currentInterval}) GROUP BY period_key ORDER BY period_key ASC`;
      const previousSql = `SELECT COUNT(*) AS total FROM applications WHERE candidate_id = ? AND status = ? AND created_at >= DATE_SUB(NOW(), ${previousInterval}) AND created_at < DATE_SUB(NOW(), ${currentInterval})`;

      connection.query(currentSql, [groupFormat, candidateId, status], (err2, currentRows) => {
        if (err2) return res.status(500).json({ error: "Database error" });

        connection.query(previousSql, [candidateId, status], (err3, prevRows) => {
          if (err3) return res.status(500).json({ error: "Database error" });

          const previousTotal = prevRows[0]?.total || 0;
          const currentTotal = currentRows.reduce((sum, r) => sum + r.count, 0);
          let filledData = [];

          if (period === "28days") {
            for (let i = 27; i >= 0; i--) {
              const d = new Date();
              d.setDate(d.getDate() - i);
              const key = d.toISOString().slice(0, 10);
              const label = d.toLocaleDateString("en-US", { day: "numeric", month: "short" });
              const found = currentRows.find((r) => r.period_key === key);
              filledData.push({ label, count: found ? found.count : 0 });
            }
          } else if (period === "weekly") {
            filledData = currentRows.map((r) => {
              const [year, week] = r.period_key.split("-").map(Number);
              const jan4 = new Date(year, 0, 4);
              const dow = jan4.getDay() || 7;
              const mon = new Date(jan4);
              mon.setDate(jan4.getDate() - (dow - 1) + (week - 1) * 7);
              const sun = new Date(mon);
              sun.setDate(mon.getDate() + 6);
              const fmt = (d) => d.toLocaleDateString("en-US", { day: "numeric", month: "short" });
              return { label: `${fmt(mon)} – ${fmt(sun)}`, count: r.count };
            });
          } else {
            filledData = currentRows.map((r) => {
              const [year, month] = r.period_key.split("-");
              const label = new Date(year, parseInt(month) - 1, 1).toLocaleDateString("en-US", { month: "short", year: "numeric" });
              return { label, count: r.count };
            });
          }

          return res.json({ success: true, data: filledData, current_total: currentTotal, previous_total: previousTotal, period, type });
        });
      });
    });
  };

  const cancelApplication = (req, res) => {
    const accountId = req.user.userId;
    const { job_id } = req.body;

    if (!job_id) {
      return res.status(400).json({ error: "job_id is required" });
    }

    // First get candidate_id from account_id
    connection.query(
      "SELECT id FROM candidate_info WHERE account_id = ? LIMIT 1",
      [accountId],
      (err, rows) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({ error: "Database error" });
        }

        if (!rows.length) {
          return res.status(404).json({ error: "Candidate not found" });
        }

        const candidateId = rows[0].id;

        // Check if application exists and status is not already rejected/cancelled
        connection.query(
  `SELECT id, status FROM applications 
    WHERE candidate_id = ? AND job_id = ? 
    AND status = 'Applied'
    ORDER BY id DESC
    LIMIT 1`,
  [candidateId, job_id],
          (err2, apps) => {
            if (err2) {
              console.error("Database error:", err2);
              return res.status(500).json({ error: "Database error" });
            }

            if (!apps.length) {
              return res.status(404).json({ error: "Application not found" });
            }

            const application = apps[0];

            // Only allow cancellation if status is 'Pending'
            // if (application.status !== "Pending") {
            //   return res.status(400).json({
            //     error: "Cannot cancel application",
            //     message: `Application is already ${application.status}. Only pending applications can be cancelled.`
            //   });
            // }

            // Update status to 'Cancelled'
            connection.query(
              `UPDATE applications SET status = 'Cancelled' WHERE id = ?`,
              [application.id],
              (err3, result) => {
                if (err3) {
                  console.error("Update error:", err3);
                  return res.status(500).json({ error: "Failed to cancel application" });
                }

                // Get job details for audit log
                connection.query(
                  `SELECT job_title FROM job_posts WHERE id = ?`,
                  [job_id],
                  (err4, jobRows) => {
                    const jobTitle = jobRows[0]?.job_title || "Unknown job";

                    // Audit log for candidate
                    logAudit({
                      tableName: "history",
                      entityType: "candidate",
                      entityId: accountId,
                      action: "APPLICATION_CANCELLED",
                      data: {
                        event: `You cancelled your application for job: ${jobTitle}`,
                        job_id,
                        job_title: jobTitle
                      },
                      changedBy: accountId,
                    });

                    res.json({
                      success: true,
                      message: "Application cancelled successfully"
                    });
                  }
                );
              }
            );
          }
        );
      }
    );
  };

const getDashboardData = async (req, res) => {
  const userId = req.params.userId;
  const month = parseInt(req.query.month) || new Date().getMonth() + 1;
  const year = parseInt(req.query.year) || new Date().getFullYear();
  console.log("Dashboard userId:", userId);

  try {
    // 1. Pipeline counts with correct status mapping
    const pipelineQuery = `
      SELECT 
        COUNT(*) AS applied,
        SUM(CASE 
          WHEN a.status IN ('Shortlisted', 'Interview_Scheduled') THEN 1 
          ELSE 0 
        END) AS shortlisted,
        SUM(CASE 
          WHEN a.status IN ('Interview_Conducted') THEN 1 
          ELSE 0 
        END) AS interview,
        SUM(CASE 
          WHEN a.status IN ('Offered') THEN 1 
          ELSE 0 
        END) AS offered,
        SUM(CASE 
          WHEN a.status IN ('Selected', 'Joined') OR a.candidate_response = 'Confirmed' OR a.candidate_response = 'Accepted' THEN 1 
          ELSE 0 
        END) AS hired
      FROM applications a
      JOIN job_posts jp ON jp.id = a.job_id
      WHERE jp.account_id = ?
        AND a.status != 'Cancelled'
        AND a.status != 'Rejected'
        AND MONTH(a.created_at) = ?
        AND YEAR(a.created_at) = ?
    `;

    // 2. Recent activity (from history table)
    const activityQuery = `
      SELECT action, data, changed_at
      FROM history
      WHERE entity_type = 'employer' AND entity_id = ?
      ORDER BY changed_at DESC
      LIMIT 10
    `;

    // 3. Upcoming interviews
    const interviewQuery = `
      SELECT 
        ci.full_name AS name,
        jp.job_title AS role,
        a.interview_day,
        a.interview_time,
        a.status,
        a.candidate_id,
        a.job_id
      FROM applications a
      JOIN candidate_info ci ON ci.id = a.candidate_id
      JOIN job_posts jp ON jp.id = a.job_id
      WHERE jp.account_id = ?
        AND a.status = 'Interview_Scheduled'
        AND a.interview_day >= CURDATE()
      ORDER BY a.interview_day ASC, a.interview_time ASC
      LIMIT 5
    `;

    // 4. Current openings
    const openingsQuery = `
      SELECT 
        jp.id,
        jp.job_title AS title,
        jp.status,
        jp.job_location_type AS type,
        (SELECT COUNT(*) FROM applications ap WHERE ap.job_id = jp.id AND ap.status != 'Cancelled' AND ap.status != 'Rejected') AS applicants,
        jp.application_deadline
      FROM job_posts jp
      WHERE jp.account_id = ?
        AND jp.approval_status = 'Approved'
        AND jp.status = 'Active'
      ORDER BY jp.created_at DESC
      LIMIT 6
    `;

    const [pipeline, activity, interviews, openings] = await Promise.all([
      new Promise((resolve, reject) =>
        connection.query(pipelineQuery, [userId, month, year], (err, rows) => {
          console.log("Pipeline result:", rows, "err:", err);
          err ? reject(err) : resolve(rows[0])
        })
      ),
      new Promise((resolve, reject) =>
        connection.query(activityQuery, [userId], (err, rows) =>
          err ? reject(err) : resolve(rows)
        )
      ),
      new Promise((resolve, reject) =>
        connection.query(interviewQuery, [userId], (err, rows) =>
          err ? reject(err) : resolve(rows)
        )
      ),
      new Promise((resolve, reject) =>
        connection.query(openingsQuery, [userId], (err, rows) =>
          err ? reject(err) : resolve(rows)
        )
      ),
    ]);

    // Format recent activity
    const recentActivity = activity.map((item) => {
      let data = {};
      try {
        data = typeof item.data === "string" ? JSON.parse(item.data) : item.data || {};
      } catch { }

      const timeAgo = (date) => {
        const diff = Math.floor((Date.now() - new Date(date)) / 1000);
        if (diff < 60) return `${diff}s ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
      };

      return {
        text: data.event || item.action,
        sub: timeAgo(item.changed_at),
      };
    });

    // Format upcoming interviews
    const upcomingInterviews = interviews.map((i) => {
      const interviewDate = new Date(i.interview_day);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      let dayLabel;
      if (interviewDate.toDateString() === today.toDateString()) {
        dayLabel = "Today";
      } else if (interviewDate.toDateString() === tomorrow.toDateString()) {
        dayLabel = "Tomorrow";
      } else {
        dayLabel = interviewDate.toLocaleDateString("en-US", { day: "numeric", month: "short" });
      }

      let time12 = "";
      if (i.interview_time) {
        const [h, m] = i.interview_time.slice(0, 5).split(":");
        const hr = parseInt(h);
        const ampm = hr >= 12 ? "PM" : "AM";
        const hr12 = hr % 12 || 12;
        time12 = `${hr12}:${m} ${ampm}`;
      }

      return {
        name: i.name,
        role: i.role,
        type: "Technical",
        time: time12 ? `${dayLabel}, ${time12}` : dayLabel,
        status: "Scheduled",
      };
    });

    // Format current openings - add city
    const openingIds = openings.map((o) => o.id);
    let cityMap = {};
    if (openingIds.length) {
      const cityRows = await new Promise((resolve, reject) =>
        connection.query(
          `SELECT jp.id, c.name AS city_name
           FROM job_posts jp
           LEFT JOIN cities c ON c.id = JSON_UNQUOTE(JSON_EXTRACT(jp.city_id, '$[0]'))
           WHERE jp.id IN (?)`,
          [openingIds],
          (err, rows) => (err ? reject(err) : resolve(rows))
        )
      );
      cityRows.forEach((r) => (cityMap[r.id] = r.city_name));
    }

    const currentOpenings = openings.map((o) => ({
      id: o.id,
      title: o.title,
      status: o.application_deadline && new Date(o.application_deadline) < new Date(Date.now() + 7 * 86400000)
        ? "Closing soon"
        : "Active",
      type: o.type || "On-site",
      city: cityMap[o.id] || "-",
      applicants: o.applicants,
    }));

    return res.json({
      pipeline: {
        applied: pipeline.applied || 0,
        shortlisted: pipeline.shortlisted || 0,
        interview: pipeline.interview || 0,
        offered: pipeline.offered || 0,
        hired: pipeline.hired || 0,
      },
      recentActivity,
      upcomingInterviews,
      currentOpenings,
    });

  } catch (err) {
    console.error("getDashboardData error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

// ─────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────
module.exports = {
  createApplicantsTable,
  createCandidateSearchImpressionsTable, // add this
  getAllApplicants,
  updateApplcantStatus,
  applyJob,
  getAppliedJobs,
  unlockCandidate,
  getApplicationStats,
  cancelApplication,
  getDashboardData,
};
