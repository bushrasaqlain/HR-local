const express = require("express");
const router = express.Router();
const connection = require("../connection");

const createApplicantsTable = () => {
  const applicantsTable = `
    CREATE TABLE IF NOT EXISTS applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_id INT,
    message TEXT NOT NULL,
    cv_data LONGBLOB NOT NULL,
     message TEXT DEFAULT '', 
    cv_filename VARCHAR(255) NOT NULL,
    candidate_id INT,
    status VARCHAR(50) DEFAULT 'Pending',
    interview_day DATE NULL,
  interview_time TIME NULL,
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

    const {
      speciality_id,
      day,
      shift,
      min_salary,
      max_salary,
      country_id,
      district_id,
      city_id,
      job_id,
      query: searchQuery,
       min_experience,          // ✅ ADDED
      max_experience 
    } = req.query;

const skillId = req.query.skill_id ? Number(req.query.skill_id) : null;

    const specialityId = speciality_id ? Number(speciality_id) : null;
    const minSalary = min_salary ? Number(min_salary) : 0;
    const maxSalary = max_salary ? Number(max_salary) : 200000;
    const countryId = country_id ? Number(country_id) : null;
    const districtId = district_id ? Number(district_id) : null;
    const cityIds = city_id ? city_id.split(",").map(Number) : [];
    const jobId = job_id ? Number(job_id) : null;
    const minExperience = min_experience ? Number(min_experience) : null;   // ✅ ADDED
    const maxExperience = max_experience ? Number(max_experience) : null;   // ✅ ADDED
    const { status } = req.query;

    // --- Build WHERE conditions ---
    let whereConditions = [
      `a.accountType = 'candidate'`,
      `a.isActive = 'Active'`,
      `c.profile_completed = 1`,
      `c.expected_salary BETWEEN ? AND ?`,
    ];
    let values = [minSalary, maxSalary];
//  // ✅ EXPERIENCE FILTER ADDED HERE
// if (minExperience !== null && maxExperience !== null) {
//   whereConditions.push(`
//     c.total_experience BETWEEN ? AND ?
//   `);
//   values.push(minExperience, maxExperience);
// }

    if (specialityId) {
      whereConditions.push(`
          EXISTS (
            SELECT 1 FROM candidate_experience ce
            WHERE ce.candidate_id = c.id AND ce.speciality_id = ?
          )
        `);
      values.push(specialityId);
    }

// Skills filter (JSON stored in candidate_info.skills)
if (skillId) {
  whereConditions.push(`JSON_CONTAINS(c.skills, CAST(? AS JSON))`);
  values.push(JSON.stringify(skillId)); // convert number to JSON format
}
    if (day || shift) {
      whereConditions.push(`
          EXISTS (
            SELECT 1 FROM candidate_availability av2
            WHERE av2.candidate_id = c.id
            ${day ? "AND av2.day = ?" : ""}
            ${shift ? "AND av2.shift = ?" : ""}
          )
        `);
      if (day) values.push(day);
      if (shift) values.push(shift);
    }

    if (countryId) {
      whereConditions.push(`c.country = ?`);
      values.push(countryId);
    }
    if (cityIds.length > 0) {
      const placeholders = cityIds.map(() => "?").join(",");
      whereConditions.push(
        `(c.city IN (${placeholders}) OR JSON_OVERLAPS(COALESCE(c.otherPreferredCities,'[]'), CAST(? AS JSON)))`,
      );
      values.push(...cityIds, JSON.stringify(cityIds));
    } else if (districtId) {
      whereConditions.push(`c.district = ?`);
      values.push(districtId);
    }
 // --- total_experience filter (candidate_info) ---
    if (minExperience !== null && maxExperience !== null) {
      whereConditions.push(`c.total_experience BETWEEN ? AND ?`);
      values.push(minExperience, maxExperience);
    }
// --- status filter (applications) ---
if (status && jobId) {
  whereConditions.push(`
    EXISTS (
      SELECT 1
      FROM applications a1
      WHERE a1.candidate_id = c.id
        AND a1.job_id = ?
        AND a1.status = ?
    )
  `);
  values.push(jobId, status);
}
    const whereClause = whereConditions.length
      ? `WHERE ${whereConditions.join(" AND ")}`
      : "";

    // --- Fetch basic candidate info ---
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
          c.otherPreferredCities,
          li.name AS license_type,
          COALESCE(
        (SELECT a1.status 
        FROM applications a1 
        WHERE a1.candidate_id = c.id 
          AND a1.job_id = ? 
        ORDER BY a1.id DESC 
        LIMIT 1),
        'Pending'
      ) AS candidateStatus,
       COALESCE(
  (SELECT a1.interview_day
   FROM applications a1
   WHERE a1.candidate_id = c.id
     AND a1.job_id = ?
   ORDER BY a1.id DESC
   LIMIT 1),
  NULL
) AS interview_day,

COALESCE(
  (SELECT a1.interview_time
   FROM applications a1
   WHERE a1.candidate_id = c.id
     AND a1.job_id = ?
   ORDER BY a1.id DESC
   LIMIT 1),
  NULL
) AS interview_time,
 COALESCE(
  (SELECT a1.message 
   FROM applications a1 
   WHERE a1.candidate_id = c.id AND a1.job_id = ?
   ORDER BY a1.created_at DESC
   LIMIT 1),
  NULL
) AS message,
          c.license_number
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
        [jobId, jobId, jobId, jobId, ...values, limit, offset],
        (err, res) => (err ? reject(err) : resolve(res)),
      );
    });

    const candidateIds = candidatesRaw.map((c) => c.candidate_id);

    // --- Fetch all related data in batches ---
    const experienceRows = candidateIds.length
      ? await new Promise((resolve, reject) => {
          connection.query(
            `
          SELECT e.*, s.name AS speciality_name
          FROM candidate_experience e
          LEFT JOIN speciality s ON e.speciality_id = s.id
          WHERE e.candidate_id IN (?)
        `,
            [candidateIds],
            (err, res) => (err ? reject(err) : resolve(res)),
          );
        })
      : [];

    const educationRows = candidateIds.length
      ? await new Promise((resolve, reject) => {
          connection.query(
            `
      SELECT 
        ed.*, 
        df.name AS degreefield_name, 
        dt.name AS degreetype_name,
        ins.name AS institute_name
      FROM candidate_education ed
      LEFT JOIN degreefields df ON ed.degree_id = df.id
      LEFT JOIN degreetypes dt ON df.degree_type_id = dt.id
      LEFT JOIN institute ins ON ed.institute_id = ins.id
      WHERE ed.candidate_id IN (?)
    `,
            [candidateIds],
            (err, res) => (err ? reject(err) : resolve(res)),
          );
        })
      : [];

    const availabilityRows = candidateIds.length
      ? await new Promise((resolve, reject) => {
          connection.query(
            `
          SELECT * FROM candidate_availability
          WHERE candidate_id IN (?)
        `,
            [candidateIds],
            (err, res) => (err ? reject(err) : resolve(res)),
          );
        })
      : [];

    const certificatesRows = candidateIds.length
      ? await new Promise((resolve, reject) => {
          connection.query(
            `
          SELECT * FROM candidate_certificates
          WHERE candidate_id IN (?)
          ORDER BY created_at DESC
        `,
            [candidateIds],
            (err, res) => (err ? reject(err) : resolve(res)),
          );
        })
      : [];

    const researchRows = candidateIds.length
      ? await new Promise((resolve, reject) => {
          connection.query(
            `
          SELECT * FROM candidate_research
          WHERE candidate_id IN (?)
          ORDER BY created_at DESC
        `,
            [candidateIds],
            (err, res) => (err ? reject(err) : resolve(res)),
          );
        })
      : [];

    // --- Map Skills & Other Preferred Cities ---
    const allSkillIds = [];
    const allCityIds = [];
    candidatesRaw.forEach((c) => {
      if (c.skills) {
        c.skills = Array.isArray(c.skills) ? c.skills : JSON.parse(c.skills);
        allSkillIds.push(...c.skills);
      } else c.skills = [];

      if (c.otherPreferredCities) {
        c.otherPreferredCities = Array.isArray(c.otherPreferredCities)
          ? c.otherPreferredCities
          : JSON.parse(c.otherPreferredCities);
        allCityIds.push(...c.otherPreferredCities);
      } else c.otherPreferredCities = [];
    });

    // Fetch skill names
    const skillsMap = {};
    if (allSkillIds.length) {
      const skillRows = await new Promise((resolve, reject) => {
        connection.query(
          `SELECT id, name FROM skills WHERE id IN (?)`,
          [[...new Set(allSkillIds)]],
          (err, res) => (err ? reject(err) : resolve(res)),
        );
      });
      skillRows.forEach((s) => (skillsMap[s.id] = s.name));
    }

    // Fetch city names
    const citiesMap = {};
    if (allCityIds.length) {
      const cityRows = await new Promise((resolve, reject) => {
        connection.query(
          `SELECT id, name FROM cities WHERE id IN (?)`,
          [[...new Set(allCityIds)]],
          (err, res) => (err ? reject(err) : resolve(res)),
        );
      });
      cityRows.forEach((c) => (citiesMap[c.id] = c.name));
    }

    // --- Construct final candidate objects ---
    const candidates = candidatesRaw.map((c) => ({
      ...c,
      skills: c.skills.map((id) => ({ id, name: skillsMap[id] || "" })),
      otherPreferredCities: c.otherPreferredCities.map((id) => ({
        id,
        name: citiesMap[id] || "",
      })),
      experience: experienceRows
        .filter((e) => e.candidate_id === c.candidate_id)
        .map((e) => ({
          id: e.id,
          company_name: e.company_name || "-",
          designation: e.designation || "-", // add designation
          total_experience: e.total_experience || "-", // add total_experience
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
    }));

    res.status(200).json({
      total: candidates.length,
      page,
      limit,
      candidate: candidates,
    });
  } catch (err) {
    console.error("❌ getAllApplicants error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
const updateApplcantStatus = (req, res) => {
  const { candidateId, jobId, status, interview_day, interview_time, message } =
    req.body;

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
        (candidate_id, job_id, status, message, cv_data, cv_filename, interview_day, interview_time)
        VALUES (?, ?, ?, ?, '', '', ?, ?)`;
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
