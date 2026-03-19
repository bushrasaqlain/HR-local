const express = require("express");
const router = express.Router();
const connection = require("../connection");

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
const getAllApplicants = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const offset = (page - 1) * limit;

    const jobId = req.query.job_id ? Number(req.query.job_id) : null;
    if (!jobId) return res.status(400).json({ error: "job_id is required" });

    // Get job details for filtering
    const job = await new Promise((resolve, reject) => {
      connection.query(
        `SELECT speciality_id, skill_ids, min_salary, max_salary,
                min_experience, max_experience,
                country_id, district_id, city_id
         FROM job_posts WHERE id = ?`,
        [jobId],
        (err, result) => (err ? reject(err) : resolve(result[0])),
      );
    });

    if (!job) return res.status(404).json({ error: "Job not found" });

    // --- Build WHERE conditions dynamically ---
    const whereConditions = [
      `a.accountType = 'candidate'`,
      `a.isActive = 'Active'`,
      `c.profile_completed = 1`,
    ];
    const values = [];

    if (job.min_salary && job.max_salary) {
      whereConditions.push(`c.expected_salary BETWEEN ? AND ?`);
      values.push(job.min_salary, job.max_salary);
    }

    const minExp = parseInt(job.min_experience) || 0;
    const maxExp = parseInt(job.max_experience) || 50;
    whereConditions.push(
      `CAST(c.total_experience AS UNSIGNED) BETWEEN ? AND ?`,
    );
    values.push(minExp, maxExp);

    if (job.speciality_id) {
      whereConditions.push(`EXISTS (
        SELECT 1 FROM candidate_experience ce
        WHERE ce.candidate_id = c.id AND ce.speciality_id = ?
      )`);
      values.push(job.speciality_id);
    }

    if (job.skill_ids) {
      let skillArray = Array.isArray(job.skill_ids)
        ? job.skill_ids
        : JSON.parse(job.skill_ids || "[]");
      whereConditions.push(`JSON_OVERLAPS(c.skills, CAST(? AS JSON))`);
      values.push(JSON.stringify(skillArray));
    }

    if (job.country_id) {
      whereConditions.push(`c.country = ?`);
      values.push(job.country_id);
    }
    if (job.district_id) {
      whereConditions.push(`c.district = ?`);
      values.push(job.district_id);
    }
    // if (job.city_id) {
    //   whereConditions.push(
    //     `(c.city = ? OR JSON_CONTAINS(COALESCE(c.otherPreferredCities,'[]'), CAST(? AS JSON)))`,
    //   );
    //   values.push(job.city_id, JSON.stringify(job.city_id));
    // }

    const whereClause = `WHERE ${whereConditions.join(" AND ")}`;

    // --- Fetch candidate base info ---
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
        c.otherPreferredCities,
        li.name AS license_type,
        c.license_number,
        COALESCE(
          (SELECT a1.status FROM applications a1 WHERE a1.candidate_id = c.id AND a1.job_id = ? ORDER BY a1.id DESC LIMIT 1),
          'Pending'
        ) AS candidateStatus,
        COALESCE(
          (SELECT a1.interview_day FROM applications a1 WHERE a1.candidate_id = c.id AND a1.job_id = ? ORDER BY a1.id DESC LIMIT 1),
          NULL
        ) AS interview_day,
        COALESCE(
          (SELECT a1.interview_time FROM applications a1 WHERE a1.candidate_id = c.id AND a1.job_id = ? ORDER BY a1.id DESC LIMIT 1),
          NULL
        ) AS interview_time,
        COALESCE(
          (SELECT a1.message FROM applications a1 WHERE a1.candidate_id = c.id AND a1.job_id = ? ORDER BY a1.created_at DESC LIMIT 1),
          NULL
        ) AS message,
         COALESCE(
 (SELECT a1.candidate_response 
  FROM applications a1 
  WHERE a1.candidate_id = c.id AND a1.job_id = ? 
  ORDER BY a1.id DESC LIMIT 1),
 NULL
) AS candidate_response,

COALESCE(
 (SELECT a1.requested_interview_day 
  FROM applications a1 
  WHERE a1.candidate_id = c.id AND a1.job_id = ? 
  ORDER BY a1.id DESC LIMIT 1),
 NULL
) AS requested_interview_day,

COALESCE(
 (SELECT a1.requested_interview_time 
  FROM applications a1 
  WHERE a1.candidate_id = c.id AND a1.job_id = ? 
  ORDER BY a1.id DESC LIMIT 1),
 NULL
) AS requested_interview_time,

COALESCE(
 (SELECT a1.company_status 
  FROM applications a1 
  WHERE a1.candidate_id = c.id AND a1.job_id = ? 
  ORDER BY a1.id DESC LIMIT 1),
 'pending'
) AS company_status,

COALESCE(
 (SELECT a1.company_offered_day 
  FROM applications a1 
  WHERE a1.candidate_id = c.id AND a1.job_id = ? 
  ORDER BY a1.id DESC LIMIT 1),
 NULL
) AS company_offered_day,

COALESCE(
 (SELECT a1.company_offered_time 
  FROM applications a1 
  WHERE a1.candidate_id = c.id AND a1.job_id = ? 
  ORDER BY a1.id DESC LIMIT 1),
 NULL
) AS company_offered_time
      FROM account a
      INNER JOIN candidate_info c ON a.id = c.account_id
      LEFT JOIN license_types li ON c.license_type = li.id
      ${whereClause}
      ORDER BY a.id DESC
      LIMIT ? OFFSET ?;
    `;
    const candidatesRaw = await new Promise((resolve, reject) => {
      connection.query(
        candidateQuery,
        [
 jobId, 
 jobId,
 jobId, 
 jobId, 
 jobId, 
 jobId, 
 jobId, 
 jobId, 
 jobId, 
 jobId, 
 ...values,
 limit,
 offset
],
        (err, res) => (err ? reject(err) : resolve(res)),
      );
    });

    const candidateIds = candidatesRaw.map((c) => c.candidate_id);

    // --- Fetch related tables in batch ---
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
              `SELECT e.*, s.name AS speciality_name FROM candidate_experience e LEFT JOIN speciality s ON e.speciality_id = s.id WHERE e.candidate_id IN (?)`,
              [candidateIds],
              (err, res) => (err ? reject(err) : resolve(res)),
            ),
          )
        : [],
      candidateIds.length
        ? new Promise((resolve, reject) =>
            connection.query(
              `SELECT ed.*, df.name AS degreefield_name, dt.name AS degreetype_name, ins.name AS institute_name
               FROM candidate_education ed
               LEFT JOIN degreefields df ON ed.degree_id = df.id
               LEFT JOIN degreetypes dt ON df.degree_type_id = dt.id
               LEFT JOIN institute ins ON ed.institute_id = ins.id
               WHERE ed.candidate_id IN (?)`,
              [candidateIds],
              (err, res) => (err ? reject(err) : resolve(res)),
            ),
          )
        : [],
      candidateIds.length
        ? new Promise((resolve, reject) =>
            connection.query(
              `SELECT * FROM candidate_availability WHERE candidate_id IN (?)`,
              [candidateIds],
              (err, res) => (err ? reject(err) : resolve(res)),
            ),
          )
        : [],
      candidateIds.length
        ? new Promise((resolve, reject) =>
            connection.query(
              `SELECT * FROM candidate_certificates WHERE candidate_id IN (?) ORDER BY created_at DESC`,
              [candidateIds],
              (err, res) => (err ? reject(err) : resolve(res)),
            ),
          )
        : [],
      candidateIds.length
        ? new Promise((resolve, reject) =>
            connection.query(
              `SELECT * FROM candidate_research WHERE candidate_id IN (?) ORDER BY created_at DESC`,
              [candidateIds],
              (err, res) => (err ? reject(err) : resolve(res)),
            ),
          )
        : [],
    ]);

    // --- Map skills & cities ---
    const allSkillIds = [];
    const allCityIds = [];

    candidatesRaw.forEach((c) => {
      // ---------- SKILLS ----------
      if (c.skills) {
        try {
          c.skills = Array.isArray(c.skills) ? c.skills : JSON.parse(c.skills);
          allSkillIds.push(...c.skills);
        } catch (err) {
          console.warn(
            "Invalid skills JSON for candidate",
            c.candidate_id,
            ":",
            c.skills,
          );
          c.skills = [];
        }
      } else {
        c.skills = [];
      }

      // ---------- OTHER PREFERRED CITIES NORMALIZATION ----------
      if (c.otherPreferredCities) {
        try {
          c.otherPreferredCities = Array.isArray(c.otherPreferredCities)
            ? c.otherPreferredCities
            : JSON.parse(c.otherPreferredCities);
        } catch {
          c.otherPreferredCities = [];
        }
      } else {
        c.otherPreferredCities = [];
      }

      // ---------- COLLECT CITY IDS ----------
      if (c.city) {
        allCityIds.push(c.city);
      }

      c.otherPreferredCities.forEach((city) => {
        const cityId = typeof city === "object" ? city.id : city;
        if (cityId) allCityIds.push(cityId);
      });
    });

    const skillsMap = {};
    if (allSkillIds.length) {
      const skillRows = await new Promise((resolve, reject) => {
        connection.query(
          `SELECT id, name FROM skills WHERE id IN (?)`,
          [[...new Set(allSkillIds)]], // unique IDs
          (err, res) => (err ? reject(err) : resolve(res)),
        );
      });

      skillRows.forEach((s) => {
        skillsMap[s.id] = s.name;
      });
    }

    const cityMapObj = {};
    if (allCityIds.length) {
      const citiesMap = await new Promise((resolve, reject) => {
        connection.query(
          `SELECT id, name FROM cities WHERE id IN (?)`,
          [[...new Set(allCityIds)]],
          (err, res) => (err ? reject(err) : resolve(res)),
        );
      });
      citiesMap.forEach((c) => (cityMapObj[c.id] = c.name));
    }

    // --- Construct final objects ---
    // --- Construct final objects ---
    const candidates = candidatesRaw.map((c) => {
      // Normalize candidate cities: main city + other preferred cities
      const candidateCityIds = [];

      if (c.city) candidateCityIds.push(Number(c.city));

      (c.otherPreferredCities || []).forEach((city) => {
        const cityId =
          typeof city === "object" ? Number(city.id) : Number(city);
        candidateCityIds.push(cityId);
      });

      // Determine city_name based on job city match
      const city_name = candidateCityIds.includes(Number(job.city_id))
        ? cityMapObj[job.city_id] || "-"
        : "-";
      return {
        ...c,
        skills: c.skills.map((id) => ({ id, name: skillsMap[id] || "" })),
        city_name,
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
        availability: availabilityRows.filter(
          (a) => a.candidate_id === c.candidate_id,
        ),
        certificates: certificatesRows.filter(
          (cert) => cert.candidate_id === c.candidate_id,
        ),
        research: researchRows.filter((r) => r.candidate_id === c.candidate_id),
      };
    });

    res
      .status(200)
      .json({ total: candidates.length, page, limit, candidate: candidates });
  } catch (err) {
    console.error("getAllApplicants error:", err);
    res.status(500).json({ error: "Server error" });
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
      company_status,               // optional: confirmed/reschedule_offered
    company_offered_day,
    company_offered_time
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
        interview_day && interview_time
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

module.exports = {
  createApplicantsTable,
  createCandidateSearchImpressionsTable, // add this
  getAllApplicants,
  updateApplcantStatus,
};
