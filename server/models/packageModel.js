const express = require("express");
const router = express.Router();
const connection = require("../connection");
const authMiddleware = require("../middleware/auth");
const checkRole = require("../middleware/checkRole");
const logAudit = require("../utils/auditLogger");

const createPackagesTable = () => {
  const packagetable = `
  CREATE TABLE IF NOT EXISTS packages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  price VARCHAR(255) NOT NULL,
  duration_unit VARCHAR(20) NOT NULL,
  duration_value VARCHAR(255) NOT NULL,
  currency VARCHAR(50) NOT NULL,
  status ENUM('active','inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
`;

  // Create table
  connection.query(packagetable, (err) => {
    if (err) return console.error(err.message);
    console.log("✅ packages table created successfully");
  });
}

const getAllPackages = (
  { page = 1, limit = 10, name = "price", search = "", status = "active" },
  callback
) => {
  page = parseInt(page, 10);
  limit = parseInt(limit, 10);
  const offset = (page - 1) * limit;

  const allowedColumns = [
    "name",
    "price",
    "duration_value",
    "duration_unit",
    "currency",
    "created_at",
    "updated_at",
    "status",
  ];

  if (!allowedColumns.includes(name)) {
    name = "price";
  }

  if (name === "amount") name = "price";
  if (name === "duration") name = "duration_value";

  let query = `
    SELECT 
      p.*,
      c.id AS currency_code,
      c.code AS currency
    FROM packages p
    LEFT JOIN currencies c ON c.id = p.currency
    WHERE 1=1
  `;

  let values = [];

  if (status !== "all") {
    query += ` AND p.status = ?`;
    values.push(status);
  }

  if (search) {
    query += ` AND p.${name} LIKE ?`;
    values.push(`%${search}%`);
  }

  query += ` ORDER BY p.id DESC LIMIT ? OFFSET ?`;
  values.push(limit, offset);

  connection.query(query, values, (err, results) => {
    if (err) return callback(err);

    let countQuery = `
      SELECT COUNT(*) AS total
      FROM packages p
      WHERE 1=1
    `;
    let countValues = [];

    if (status !== "all") {
      countQuery += ` AND p.status = ?`;
      countValues.push(status);
    }

    if (search) {
      countQuery += ` AND p.${name} LIKE ?`;
      countValues.push(`%${search}%`);
    }

    connection.query(countQuery, countValues, (err2, countResult) => {
      if (err2) return callback(err2);

      callback(null, {
        total: countResult[0].total,
        page,
        limit,
        packages: results,
      });
    });
  });
};

const addPackage = (req, res) => {
  const userId = req.user.userId;
  const { duration_unit, price, duration_value, currency_id } = req.body;

  if (!duration_unit || !price || !duration_value || !currency_id) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const insertSql = `INSERT INTO packages 
                     (duration_unit, price, duration_value, currency) 
                     VALUES (?, ?, ?, ?)`;

  connection.query(insertSql, [duration_unit, price, duration_value, currency_id], (err, results) => {
    if (err) {
      console.error("❌ Error inserting package:", err);
      return res.status(500).json({ error: "Database error" });
    }

    logAudit({
      tableName: "dbadminhistory",
      entityType: "package",
      entityId: results.insertId,
      action: "ADDED",
      data: { duration_unit, price, duration_value, currency_id, status: "active" },
      changedBy: userId,
    });

    res.status(201).json({ message: "Package added successfully", id: results.insertId });
  });
}

const editPackage = (req, res) => {
  const { id } = req.params;
  const { duration_unit, price, duration_value, currency_id } = req.body;
  const userId = req.user.userId;

  if (!duration_unit || !price || !duration_value || !currency_id) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const checkSql = "SELECT * FROM packages WHERE id = ?";
  connection.query(checkSql, [id], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (results.length === 0) return res.status(404).json({ error: "Package not found" });

    const updateSql = `UPDATE packages 
                           SET duration_unit = ?, price = ?, duration_value = ?, currency = ? 
                           WHERE id = ?`;

    connection.query(updateSql, [duration_unit, price, duration_value, currency_id, id], (err2) => {
      if (err2) return res.status(500).json({ error: "Database error" });

      logAudit({
        tableName: "dbadminhistory",
        entityType: "package",
        entityId: id,
        action: "UPDATED",
        data: { duration_unit, price, duration_value, currency_id, status: results[0].status },
        changedBy: userId,
      });

      res.status(200).json({ message: "Package updated successfully" });
    });
  });
}

const deletePackage = (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  const checkSql = "SELECT * FROM packages WHERE id = ?";
  connection.query(checkSql, [id], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (results.length === 0) return res.status(404).json({ error: "Package not found" });

    const currentPackage = results[0];
    const newStatus = currentPackage.status === "active" ? "inactive" : "active";

    const updateSql = "UPDATE packages SET status = ? WHERE id = ?";
    connection.query(updateSql, [newStatus, id], (err2) => {
      if (err2) return res.status(500).json({ error: "Database error" });

      logAudit({
        tableName: "dbadminhistory",
        entityType: "package",
        entityId: id,
        action: newStatus.toUpperCase(), // ACTIVE / INACTIVE
        data: { ...currentPackage, status: newStatus },
        changedBy: userId,
      });

      res.status(200).json({ message: `Package status updated to ${newStatus}` });
    });
  });
}

const getPackagebyCompany = (
  { page = 1, limit = 10, name = "price", search = "", status = "all" },
  callback
) => {
  page = parseInt(page);
  limit = parseInt(limit);
  const offset = (page - 1) * limit;

  const allowedSortFields = ["price", "package_type", "status", "id"];
  if (!allowedSortFields.includes(name)) {
    name = "price";
  }

  // ✅ Include company_info table
  let sql = `
  SELECT 
    c.id, 
    c.package_type, 
    c.price, 
    c.status, 
    a.id AS account_id,
    a.username,
    ci.company_name,
    bet.name AS business_entity_type, 
    co.name AS country_name,          
    ci_town.name AS city_name,        
    d.name AS district_name,      
    ci.company_address,
    ci.phone,
    ci.company_website,
    ci.NTN,
    ci.size_of_company,
    ci.established_date
  FROM cart c
  JOIN account a ON c.account_id = a.id
  LEFT JOIN company_info ci ON ci.account_id = a.id
  LEFT JOIN business_entity_type bet ON bet.id = ci.Business_entity_type_id  
  LEFT JOIN countries co ON co.id = ci.country_id
  LEFT JOIN cities ci_town ON ci_town.id = ci.city_id
  LEFT JOIN districts d ON d.id = ci.district_id
  WHERE 1=1
`;



  const params = [];

  if (status !== "all") {
    sql += ` AND c.status = ?`;
    params.push(status);
  }

  if (search) {
    sql += ` AND (c.package_type LIKE ? OR a.username LIKE ? OR ci.company_name LIKE ? )`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  sql += ` ORDER BY ${name} ASC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  connection.query(sql, params, (err, results) => {
    if (err) {
      console.error("SQL ERROR:", err);
      return callback(err, null);
    }

    // ✅ Get total count for pagination
    let countSql = `
      SELECT COUNT(*) AS totalRecords
      FROM cart c
      JOIN account a ON c.account_id = a.id
      LEFT JOIN company_info ci ON ci.account_id = a.id
      WHERE 1=1
    `;
    const countParams = [];
    if (status !== "all") countParams.push(status);
    if (search) countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);

    connection.query(countSql, countParams, (countErr, countRes) => {
      if (countErr) {

        return callback(countErr, null);
      }
      const totalRecords = countRes[0].totalRecords || 0;
      callback(null, { data: results, totalRecords });
    });
  });
};


const getCompanyPackgestatus = (req, res) => {
  try {
    const userId = req.params.userId;

    // Perform a database query to check the user's package status
    const query =
      'SELECT status FROM cart WHERE account_id = ? AND status = "active"';

    connection.query(query, [userId], (err, results) => {
      if (err) {
        console.error("Error fetching package status:", err);
        return res.status(500).json({ error: "Internal Server Error" });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: "Package status not found" });
      }

      // Assuming results[0] contains the package status data
      const packageStatus = results[0].status;

      // You can modify this part based on what exactly you want to return
      res.status(200).json({ userId, packageStatus });
    });
  } catch (error) {
    console.error("Error in checkUserPackageStatus route:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

const getPackageDetail = (req, res) => {
  const companyId = req.params.userId;

  const query = `
    SELECT 
      pay.account_id AS company_id,

      jp.id AS job_id,
      jp.job_title,
      jp.status AS job_status,
      jp.created_at AS job_date,

      p.id AS package_id,
      p.price AS package_price,
      cur.code AS package_currency,
      p.duration_unit,
      p.duration_value,

      pay.payment_status AS payment_status

    FROM payment pay

    LEFT JOIN job_posts jp 
      ON jp.id = pay.job_id

    LEFT JOIN packages p 
      ON p.id = jp.package_id

    LEFT JOIN currencies cur
      ON cur.id = p.currency

    WHERE pay.account_id = ?
  `;

  connection.query(query, [companyId], (err, results) => {
    if (err) {
      console.error("SQL Error:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
    res.json(results);
  });
};


module.exports = {
  createPackagesTable,
  getAllPackages,
  addPackage,
  editPackage,
  deletePackage,
  getPackagebyCompany,
  getCompanyPackgestatus,
  getPackageDetail
}

