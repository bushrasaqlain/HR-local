
const express = require("express");
const router = express.Router();
const connection = require("../connection");

const createCompanyInfoTable = () => {
  const createCompanyInfoTableQuery = `
CREATE TABLE IF NOT EXISTS company_info (
  id INT AUTO_INCREMENT PRIMARY KEY,
  account_id INT UNIQUE,
  company_name VARCHAR(50) NOT NULL,
  logo LONGBLOB,
  Business_entity_type_id INT,
  phone VARCHAR(20),
  country_id INT,
  district_id INT,
  city_id INT,
  company_address VARCHAR(255),
  company_website VARCHAR(255),
  NTN VARCHAR(20),
  size_of_company INT,
  established_date VARCHAR(100),
  FOREIGN KEY (account_id) REFERENCES account(id),
  FOREIGN KEY (Business_entity_type_id) REFERENCES business_entity_type(id),
  FOREIGN KEY (country_id) REFERENCES countries(id),
  FOREIGN KEY (district_id) REFERENCES districts(id),
  FOREIGN KEY (city_id) REFERENCES cities(id)
);
`;

  // Execute the queries to create the tables
  connection.query(createCompanyInfoTableQuery, function (err, results, fields) {
    if (err) {
      return console.error(err.message);
    }
    else {
      console.log("Company Info table created successfully");
    }
  });
}

const getAllCompanies = (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 15;
  const offset = (page - 1) * limit;
  const search = req.query.search || "";

  let status = req.query.status || null;
  if (status !== "Active" && status !== "InActive") {
    status = null;
  }

  // Map client column → DB column
  const columnMap = {
    name: "a.username",
    email: "a.email",
    phone: "c.phone",
    company_name: "c.company_name",
    created_at: "a.created_at",
    isActive: "a.isActive",
  };

  const searchColumn = columnMap[req.query.name] || "a.email";

  const query = `
    SELECT a.*,
           c.account_id,
           c.company_name,
           c.Business_entity_type_id,
           c.phone,
           c.country_id,
           c.district_id,
           c.city_id,
           c.company_address,
           c.company_website,
           c.NTN,
           c.size_of_company,
           c.established_date,
           ctry.name AS country_name,
           d.name AS district_name,
           city.name AS city_name,
           bus.name AS business_entity_type
    FROM account a
    LEFT JOIN company_info c ON a.id = c.account_id
    LEFT JOIN countries ctry ON c.country_id = ctry.id
    LEFT JOIN districts d ON c.district_id = d.id
    LEFT JOIN cities city ON c.city_id = city.id
    LEFT JOIN business_entity_type bus ON c.Business_entity_type_id = bus.id
    WHERE a.accountType = 'employer'
      ${status ? "AND a.isActive = ?" : ""}
      AND ${searchColumn} LIKE ?
    ORDER BY a.id DESC
    LIMIT ? OFFSET ?
  `;

  const queryParams = [];
  if (status) queryParams.push(status);
  queryParams.push(`%${search}%`, limit, offset);

  connection.query(query, queryParams, (err, results) => {
    if (err) {
      console.error("❌ Error fetching employers:", err.sqlMessage);
      return res.status(500).json({ error: "Database error" });
    }

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM account a
      LEFT JOIN company_info c ON a.id = c.account_id
      WHERE a.accountType = 'employer'
        ${status ? "AND a.isActive = ?" : ""}
        AND ${searchColumn} LIKE ?
    `;

    const countParams = [];
    if (status) countParams.push(status);
    countParams.push(`%${search}%`);

    connection.query(countQuery, countParams, (err2, countResult) => {
      if (err2) {
        console.error("❌ Error fetching count:", err2.sqlMessage);
        return res.status(500).json({ error: "Database error" });
      }

      res.status(200).json({
        total: countResult[0].total,
        page,
        limit,
        employers: results,
      });
    });
  });
};


const updateCompanyinfo = (req, res) => {
  let accountId = parseInt(req.body.userId);

  const {
    username,
    email,
    company_name,
    Business_entity_type,
    phone,
    country,
    district,
    city,
    company_address,
    company_website,
    NTN,
    size_of_company,
    established_date
  } = req.body;

  const logo = req.file ? req.file.buffer : null;

  let sql = `
    INSERT INTO company_info
      (account_id, company_name, Business_entity_type_id, phone, country_id, district_id, city_id, 
       company_address, company_website, NTN, size_of_company, established_date ${req.file ? ", logo" : ""})
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? ${req.file ? ", ?" : ""})
    ON DUPLICATE KEY UPDATE
      company_name=VALUES(company_name),
      Business_entity_type_id=VALUES(Business_entity_type_id),
      phone=VALUES(phone),
      country_id=VALUES(country_id),
      district_id=VALUES(district_id),
      city_id=VALUES(city_id),
      company_address=VALUES(company_address),
      company_website=VALUES(company_website),
      NTN=VALUES(NTN),
      size_of_company=VALUES(size_of_company),
      established_date=VALUES(established_date)
      ${req.file ? ", logo=VALUES(logo)" : ""}
  `;

  const params = [
    accountId,
    company_name,
    Business_entity_type,
    phone,
    country,
    district,
    city,
    company_address,
    company_website,
    NTN,
    size_of_company,
    established_date,
  ];

  if (req.file) params.push(req.file.buffer);

  connection.query(sql, params, (err, result) => {
    if (err) {

      return res.status(500).json({ error: err });
    }

    if (username || email) {
      let updatedFields = [];
      let updatedParams = [];

      if (username) {
        updatedFields.push("username = ?")
        updatedParams.push(username);
      }

      if (email) {
        updatedFields.push("email = ?");
        updatedParams.push(email);
      }

      const accountSql = `UPDATE account SET ${updatedFields.join(", ")} WHERE id = ?`;
      updatedParams.push(accountId);
      connection.query(accountSql, updatedParams, (accErr) => {
        if (accErr) {

          return res.status(500).json({ error: accErr });
        }


      })
    }

    logAudit({
      tableName: "history",
      entityType: "employer",
      entityId: accountId,
      action: "UPDATED",
      data: { ...req.body },
      changedBy: accountId, // or req.user.userId
    });
    res.status(200).json({ message: "Profile saved/updated successfully" });
  });
}
const getcompanybyid = (req, res) => {
  const accountId = parseInt(req.params.userId);

  if (isNaN(accountId)) {
    return res.status(400).json({ error: "Invalid account_id" });
  }

  const sql = `
      SELECT
      ci.*,
      c.name AS country_name,
      d.name AS district_name,
      ct.name AS city_name,
      bet.name AS business_type_name,
      a.username, a.email
      FROM company_info ci 
      LEFT JOIN countries c ON ci.country_id = c.id
      LEFT JOIN districts d ON ci.district_id = d.id
      LEFT JOIN cities ct ON ci.city_id = ct.id
      LEFT JOIN business_entity_type bet ON ci.Business_entity_type_id = bet.id
      LEFT JOIN account a ON ci.account_id = a.id
      WHERE ci.account_id = ?
    `;

  connection.query(sql, [accountId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Employer not found" });
    }
    const employer = {
      ...results[0],
      logo: results[0].logo ? results[0].logo.toString("base64") : null
    };

    res.json(employer);
  });
}


const updateCompanySatus = (id, status, res) => {
  if (!id || !status) {
    return res.status(400).json({ success: false, message: "Missing id or status" });
  }

  const query = `UPDATE account SET isActive = ? WHERE id = ?`;

  connection.query(query, [status, id], (err, result) => {
    if (err) {
      console.error("Update company status error:", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Company not found" });
    }

    return res.status(200).json({ success: true, message: `Company status updated to ${status}` });
  });
};

const getAllJobs = (req, res) => {
  const userId = req.params.userId;

  // Fetch job posts for the given userId
  const jobPostsQuery = `
    SELECT 
      id,
      account_id,
      job_title,
      job_description,
      skill_ids,
      time_from,
      time_to,
      job_type_id,
      min_salary,
      max_salary,
      currency_id,
      min_experience,
      max_experience,
      profession_id,
      degree_id,
      no_of_positions,
      industry,
      package_id,
      country_id,
      district_id,
      city_id,
      application_deadline,
      created_at,
      updated_at,
      status
    FROM job_posts
    WHERE account_id = ?
  `;

  connection.query(jobPostsQuery, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching job posts:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    // Optionally, you can transform skill_ids from string to array
    const transformedResults = results.map(job => ({
      ...job,
      skill_ids: job.skill_ids ? JSON.parse(job.skill_ids) : [],
    }));

    res.status(200).json(transformedResults);
  });
};

module.exports = {
  createCompanyInfoTable,
  getAllCompanies,
  updateCompanyinfo,
  getcompanybyid,
  updateCompanySatus,
  getAllJobs
 
};