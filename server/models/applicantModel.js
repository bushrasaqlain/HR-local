
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
    account_id INT,
    status VARCHAR(50) DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES job_posts(id),
    FOREIGN KEY (Account_ID) REFERENCES account(id)
);`;

  // Execute the query to create the table
  connection.query(applicantsTable, function (err, results, fields) {
    if (err) {
      return console.error(err.message);
    }
    console.log("applications table created successfully");
  });
}

const getAllApplicants = (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 100;
  const offset = (page - 1) * limit;

  const search = (req.query.search || "").trim();
  const name = (req.query.name || "").trim();
  const status = (req.query.status || "").trim();

  const specialityId = req.query.speciality_id
    ? Number(req.query.speciality_id)
    : null;

  const day = req.query.day ? req.query.day.trim() : null;
  const shift = req.query.shift ? req.query.shift.trim() : null;

  const minSalary = req.query.min_salary
    ? Number(req.query.min_salary)
    : null;

  const maxSalary = req.query.max_salary
    ? Number(req.query.max_salary)
    : null;

  const countryId = req.query.country_id
    ? Number(req.query.country_id)
    : null;

  const districtId = req.query.district_id
    ? Number(req.query.district_id)
    : null;

  const cityIds = req.query.city_id
    ? req.query.city_id.split(",").map(Number)
    : [];

  const columnMap = {
    username: "a.username",
    email: "a.email",
    phone: "c.phone",
    created_at: "a.created_at",
    isActive: "a.isActive",
  };

  let whereConditions = [];
  let values = [];



  whereConditions.push(`a.accountType = 'candidate'`);
  whereConditions.push(`a.isActive = 'Active'`);
  whereConditions.push(`c.profile_completed = 1`);

  // if (status && status.toLowerCase() !== "all") {
  //   whereConditions.push(`LOWER(a.isActive) = ?`);
  //   values.push(status.toLowerCase());
  // }


  if (specialityId) {
    whereConditions.push(`c.speciality = ?`);
    values.push(specialityId);
  }


  if (minSalary !== null) {
    whereConditions.push(`c.expected_salary >= ?`);
    values.push(minSalary);
  }

  if (maxSalary !== null) {
    whereConditions.push(`c.expected_salary <= ?`);
    values.push(maxSalary);
  }

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

  /* ================= LOCATION FILTER ================= */

  if (countryId) {
    whereConditions.push(`c.country = ?`);
    values.push(countryId);
  }

  if (districtId) {
    whereConditions.push(`c.district = ?`);
    values.push(districtId);
  }

  if (cityIds.length > 0) {
    const cityPlaceholders = cityIds.map(() => "?").join(",");

    whereConditions.push(`
      (
        c.city IN (${cityPlaceholders})
        OR JSON_OVERLAPS(
            c.otherPreferredCities,
            CAST(? AS JSON)
        )
      )
    `);

    values.push(...cityIds, JSON.stringify(cityIds));
  }

  if (search) {
    const searchColumn = columnMap[name] || "a.email";

    if (name === "isActive") {
      whereConditions.push(`LOWER(a.isActive) LIKE ?`);
      values.push(`${search.toLowerCase()}%`);
    } else {
      whereConditions.push(`${searchColumn} LIKE ?`);
      values.push(`%${search}%`);
    }
  }

  const whereClause =
    whereConditions.length > 0
      ? `WHERE ${whereConditions.join(" AND ")}`
      : "";

  const query = `
    SELECT DISTINCT
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
      c.speciality AS speciality_id,
      c.address,
      c.passport_photo,

      li.name AS license_type,
      sp.name AS speciality,
      ctry.name AS country_name,
      d.name AS district_name,
      city.name AS city_name,

      av.day,
      av.shift,
      av.startTime,
      av.EndTime

    FROM account a
    INNER JOIN candidate_info c ON a.id = c.account_id
    LEFT JOIN license_types li ON c.license_type = li.id
    LEFT JOIN speciality sp ON c.speciality = sp.id
    LEFT JOIN candidate_availability av ON av.candidate_id = c.id
    LEFT JOIN countries ctry ON c.country = ctry.id
    LEFT JOIN districts d ON c.district = d.id
    LEFT JOIN cities city ON c.city = city.id

    ${whereClause}
    ORDER BY a.id DESC
    LIMIT ? OFFSET ?
  `;

  const queryParams = [...values, limit, offset];

  connection.query(query, queryParams, (err, results) => {
    if (err) {
      console.error("❌ Error fetching candidates:", err.sqlMessage);
      return res.status(500).json({ error: "Database error" });
    }

    /* ================= COUNT QUERY ================= */

    const countQuery = `
      SELECT COUNT(DISTINCT a.id) AS total
      FROM account a
      INNER JOIN candidate_info c ON a.id = c.account_id
      ${whereClause}
    `;

    connection.query(countQuery, values, (err2, countResult) => {
      if (err2) {
        console.error("❌ Error fetching count:", err2.sqlMessage);
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
  try {
    const { applicationId, status } = req.params; // Get the application ID from the request parameters

    // Update the status of the application to 'shortlisted' in the database
    const updateQuery = `
      UPDATE applications
      SET status = ?
      WHERE id = ?;
    `;
    connection.query(updateQuery, [status, applicationId]);

    // Send a success response
    res
      .status(200)
      .json({
        message: `Application status updated to ${status} successfully`,
      });
  } catch (error) {
    console.error("Error updating application status:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }

}

module.exports = {
  createApplicantsTable,
  getAllApplicants,
  updateApplcantStatus,

}