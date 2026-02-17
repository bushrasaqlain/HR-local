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
    cv_filename VARCHAR(255) NOT NULL,
    candidate_id INT,
    status VARCHAR(50) DEFAULT 'Pending',
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

const getAllApplicants = (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 100;
  const offset = (page - 1) * limit;

  const specialityId = req.query.speciality_id
    ? Number(req.query.speciality_id)
    : null;
  const day = req.query.day ? req.query.day.trim() : null;
  const shift = req.query.shift ? req.query.shift.trim() : null;
  const minSalary = req.query.min_salary ? Number(req.query.min_salary) : 0;
  const maxSalary = req.query.max_salary
    ? Number(req.query.max_salary)
    : 200000;
  const countryId = req.query.country_id ? Number(req.query.country_id) : null;
  const districtId = req.query.district_id
    ? Number(req.query.district_id)
    : null;
  const cityIds = req.query.city_id
    ? req.query.city_id.split(",").map(Number)
    : [];
  const jobId = req.query.job_id ? Number(req.query.job_id) : null;

  // Base WHERE conditions
  let whereConditions = [
    `a.accountType = 'candidate'`,
    `a.isActive = 'Active'`,
    `c.profile_completed = 1`,
    `c.expected_salary BETWEEN ? AND ?`,
  ];
  let values = [minSalary, maxSalary];

  // Speciality filter
  if (specialityId) {
    whereConditions.push(`
      EXISTS (
        SELECT 1
        FROM candidate_experience ce
        WHERE ce.candidate_id = c.id
        AND ce.speciality_id = ?
      )
    `);
    values.push(specialityId);
  }

  // Availability filter
  if (day || shift) {
    whereConditions.push(`
      EXISTS (
        SELECT 1
        FROM candidate_availability av2
        WHERE av2.candidate_id = c.id
        ${day ? "AND av2.day = ?" : ""}
        ${shift ? "AND av2.shift = ?" : ""}
      )
    `);
    if (day) values.push(day);
    if (shift) values.push(shift);
  }

  // Country filter
  if (countryId) {
    whereConditions.push(`c.country = ?`);
    values.push(countryId);
  }

  // City or district filter
  if (cityIds.length > 0) {
    const cityPlaceholders = cityIds.map(() => "?").join(",");
    whereConditions.push(`
      (c.city IN (${cityPlaceholders}) 
       OR JSON_OVERLAPS(COALESCE(c.otherPreferredCities, '[]'), CAST(? AS JSON)))
    `);
    values.push(...cityIds, JSON.stringify(cityIds));
  } else if (districtId) {
    whereConditions.push(`c.district = ?`);
    values.push(districtId);
  }

  const whereClause = whereConditions.length
    ? `WHERE ${whereConditions.join(" AND ")}`
    : "";

  // Main query with subquery to get latest application per candidate
  const query = `
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
      li.name AS license_type,
      ctry.name AS country_name,
      d.name AS district_name,
      city.id AS city_id,
      city.name AS city_name,
      GROUP_CONCAT(DISTINCT ce.speciality_id) AS speciality_ids,
      GROUP_CONCAT(DISTINCT sp.name) AS specialities,
      GROUP_CONCAT(DISTINCT CONCAT(av.day, ' ', av.startTime, '-', av.EndTime) SEPARATOR '|') AS availability_times,
      c.otherPreferredCities,
      COALESCE(
  (
    SELECT a1.status
    FROM applications a1
    WHERE a1.candidate_id = c.id
      AND a1.job_id = ?
    ORDER BY a1.id DESC
    LIMIT 1
  ),
  'Pending'
) AS candidateStatus

    FROM account a
    INNER JOIN candidate_info c ON a.id = c.account_id
    LEFT JOIN license_types li ON c.license_type = li.id
    LEFT JOIN countries ctry ON c.country = ctry.id
    LEFT JOIN districts d ON c.district = d.id
    LEFT JOIN cities city ON c.city = city.id
    LEFT JOIN candidate_experience ce ON ce.candidate_id = c.id
    LEFT JOIN speciality sp ON ce.speciality_id = sp.id
    LEFT JOIN candidate_availability av ON av.candidate_id = c.id
  
    ${whereClause}
    GROUP BY c.id
    ORDER BY a.id DESC
    LIMIT ? OFFSET ?;
  `;

  const queryParams = [jobId, ...values, limit, offset];

  console.log("📝 Fetch All Applicants Query:", query);
  console.log("📝 Query Params:", queryParams);

  connection.query(query, queryParams, (err, results) => {
    if (err) {
      console.error("❌ Error fetching candidates:", err);
      return res.status(500).json({ error: "Database error" });
    }

    const countQuery = `
      SELECT COUNT(DISTINCT c.id) AS total
      FROM account a
      INNER JOIN candidate_info c ON a.id = c.account_id
      ${whereClause}
    `;

    connection.query(countQuery, values, (err2, countResult) => {
      if (err2) {
        console.error("❌ Error fetching count:", err2);
        return res.status(500).json({ error: "Database error" });
      }

      res.status(200).json({
        total: countResult[0].total,
        page,
        limit,
        candidate: results,
      });
    });
  });
};

const updateApplcantStatus = (req, res) => {
  const { candidateId, jobId, status } = req.body;

  if (!candidateId || !jobId || !status) {
    return res
      .status(400)
      .json({ error: "Candidate ID, Job ID, and Status are required" });
  }

  const selectQuery = `SELECT id FROM applications WHERE candidate_id = ? AND job_id = ?`;
  connection.query(selectQuery, [candidateId, jobId], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });

    if (results.length > 0) {
      // Update existing application
      const updateQuery = `UPDATE applications SET status = ? WHERE id = ?`;
      connection.query(updateQuery, [status, results[0].id], (err2) => {
        if (err2) return res.status(500).json({ error: "Database error" });
        res.json({ message: `Application status updated to ${status}` });
      });
    } else {
      // Create new application
      const insertQuery = `
        INSERT INTO applications (candidate_id, job_id, status, message, cv_data, cv_filename)
        VALUES (?, ?, ?, '', '', '')
      `;
      connection.query(insertQuery, [candidateId, jobId, status], (err3) => {
        if (err3) return res.status(500).json({ error: "Database error" });
        res.json({ message: `Candidate shortlisted successfully` });
      });
    }
  });
};

module.exports = {
  createApplicantsTable,
  getAllApplicants,
  updateApplcantStatus,
};
