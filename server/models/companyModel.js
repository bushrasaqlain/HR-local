
const express = require("express");
const router = express.Router();
const connection = require("../connection");
const logAudit = require("../utils/auditLogger");
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

  const search = (req.query.search || "").trim();
  const name = (req.query.name || "").trim();
  const status = (req.query.status || "").trim(); // "Active", "InActive", "all"

  // Map client column → DB column (SAFE: only from this map)
  const columnMap = {
    username: "a.username",
    email: "a.email",
    phone: "c.phone",
    password: "a.password",
    company_name: "c.company_name",
    created_at: "a.created_at",
    isActive: "a.isActive",
  };

  let whereConditions = [];
  let values = [];

  // base condition
  whereConditions.push(`a.accountType = 'employer'`);

  // ✅ Status filter (dropdown)
  if (status && status.toLowerCase() !== "all") {
    whereConditions.push(`LOWER(a.isActive) = ?`);
    values.push(status.toLowerCase()); // compares case-insensitively
  }

  // ✅ Search filter
  if (search) {
    const searchColumn = columnMap[name] || "a.email";

    if (name === "isActive") {
      // IMPORTANT: prevent "Active" matching "InActive"
      // Use prefix match so "Active" matches only "Active", not "InActive"
      whereConditions.push(`LOWER(a.isActive) LIKE ?`);
      values.push(`${search.toLowerCase()}%`);   // "active%" ✅, won't match "inactive"
      // If you want EXACT only, use:
      // whereConditions.push(`LOWER(a.isActive) = ?`);
      // values.push(search.toLowerCase());
    } else {
      whereConditions.push(`${searchColumn} LIKE ?`);
      values.push(`%${search}%`);
    }
  }

  const whereClause =
    whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

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
    ${whereClause}
    ORDER BY a.id DESC
    LIMIT ? OFFSET ?
  `;

  const queryValues = [...values, limit, offset];

  connection.query(query, queryValues, (err, results) => {
    if (err) {
      console.error("❌ Error fetching employers:", err.sqlMessage);
      return res.status(500).json({ error: "Database error" });
    }

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM account a
      LEFT JOIN company_info c ON a.id = c.account_id
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
        employers: results,
      });
    });
  });
};


const getIdFromName = async (tableName, name) => {
  return new Promise((resolve, reject) => {
    connection.query(
      `SELECT id FROM ${tableName} WHERE name = ? LIMIT 1`,
      [name],
      (err, result) => {
        if (err) return reject(err);
        resolve(result.length > 0 ? result[0].id : null);
      }
    );
  });
};

const updateCompanyinfo = async (req, res) => {
  console.log(req);
  try {
    const accountId = parseInt(req.body.userId);
    const {
      username,
      email,
      company_name,
      business_type,
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
    const country_id = await getIdFromName("countries", country);
    const district_id = await getIdFromName("districts", district);
    const city_id = await getIdFromName("cities", city);

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
      business_type,
      phone,
      country,
      district,
      city,
      company_address,
      company_website,
      NTN,
      size_of_company,
      established_date
    ];

    if (req.file) params.push(req.file.buffer);

    connection.query(sql, params, (err, result) => {
      if (err) return res.status(500).json({ error: err });

      // update account table if needed
      if (username || email) {
        let updatedFields = [];
        let updatedParams = [];
        if (username) {
          updatedFields.push("username = ?");
          updatedParams.push(username);
        }
        if (email) {
          updatedFields.push("email = ?");
          updatedParams.push(email);
        }
        const accountSql = `UPDATE account SET ${updatedFields.join(", ")} WHERE id = ?`;
        updatedParams.push(accountId);
        connection.query(accountSql, updatedParams, (accErr) => {
          if (accErr) return res.status(500).json({ error: accErr });
        });
      }

      logAudit({
        tableName: "history",
        entityType: "employer",
        entityId: accountId,
        action: "UPDATED",
        data: { ...req.body },
        changedBy: accountId,
      });

      res.status(200).json({ message: "Profile saved/updated successfully" });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error });
  }
};

const getcompanybyid = (req, res) => {
  const accountId = Number(req.params.userId);
  if (!Number.isInteger(accountId)) {
    return res.status(400).json({ error: "Invalid account_id" });
  }

  const sql = `
    SELECT
      a.id as account_id,
      a.username,
      a.email,
      a.isActive,
      ci.*,
      c.name  AS country_name,
      d.name  AS district_name,
      ct.name AS city_name,
      bet.name AS business_type_name
    FROM account a
    LEFT JOIN company_info ci ON ci.account_id = a.id
    LEFT JOIN countries c ON ci.country_id = c.id
    LEFT JOIN districts d ON ci.district_id = d.id
    LEFT JOIN cities ct ON ci.city_id = ct.id
    LEFT JOIN business_entity_type bet ON ci.Business_entity_type_id = bet.id
    WHERE a.id = ? AND a.accountType = 'employer'
    LIMIT 1
  `;

  connection.query(sql, [accountId], (err, results) => {
    if (err) return res.status(500).json({ error: "Internal Server Error" });
    if (results.length === 0) return res.status(404).json({ error: "Employer not found" });

    const row = results[0];
    res.json({
      ...row,
      logo: row.logo ? row.logo.toString("base64") : null,
    });
  });
};


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
    logAudit({
      tableName: "history",
      entityType: "employer",
      entityId: id,
      action: "UPDATED",
      data: { status },
      changedBy: id,
    });

    return res.status(200).json({ success: true, message: `Company status updated to ${status}` });
  });
};

const getCount = (req, res) => {
  const userId = req.params.userId;

  // 1️⃣ Count total job posts by the user
  const sqlJobCount = "SELECT COUNT(*) AS jobCount FROM job_posts WHERE account_id = ?";

  // Count total active job posts
  const sqlActiveCount = "SELECT COUNT(*) AS activeJob FROM job_posts WHERE account_id = ? AND status = 'Active'";

  // 2️⃣ Count total packages used by the user's jobs
  const sqlPackageJobCount = `
    SELECT COUNT(p.id) AS packageCount
    FROM payment pay
    INNER JOIN job_posts j ON j.id = pay.job_id
    INNER JOIN packages p ON p.id = j.package_id
    WHERE pay.account_id = ?
  `;

  // 3️⃣ Count total applicants for the user's jobs
  const sqlApplicantsCount = `
    SELECT COUNT(a.id) AS applicantCount
    FROM job_posts j
    LEFT JOIN applications a ON a.job_id = j.id
    WHERE j.account_id = ?
  `;

  // First query: total job posts
  connection.query(sqlJobCount, [userId], (err, jobResults) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    const jobCount = jobResults[0].jobCount || 0;

    // Second query: total packages
    connection.query(sqlPackageJobCount, [userId], (err2, packageResults) => {
      if (err2) {
        console.error(err2);
        return res.status(500).json({ error: "Internal Server Error" });
      }

      const packageCount = packageResults[0].packageCount || 0;

      // Third query: total applicants
      connection.query(sqlApplicantsCount, [userId], (err3, applicantResults) => {
        if (err3) {
          console.error(err3);
          return res.status(500).json({ error: "Internal Server Error" });
        }

        const applicantCount = applicantResults[0].applicantCount || 0;

        // Fourth query: active jobs
        connection.query(sqlActiveCount, [userId], (err4, activeJobResults) => {
          if (err4) {
            console.error(err4);
            return res.status(500).json({ error: "Internal Server Error" });
          }

          const activeJobCount = activeJobResults[0].activeJob || 0;

          // Return all counts
          return res.json({
            userId,
            jobPostsCount: jobCount,
            packageCount,
            applicantCount,
            activeJobCount,
          });
        });
      });
    });
  });
};



module.exports = {
  createCompanyInfoTable,
  getAllCompanies,
  updateCompanyinfo,
  getcompanybyid,
  updateCompanySatus,
  getCount
};