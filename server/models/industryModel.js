const express = require("express");
const router = express.Router();
const connection = require("../connection.js");
const authMiddleware = require("../middleware/auth.js");
const logAudit = require("../utils/auditLogger.js");

const createIndustryTable = () => {
  const createTableQuery = `
  CREATE TABLE IF NOT EXISTS industry (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status ENUM('Active', 'Inactive') DEFAULT 'Active'
  )
`;

  connection.query(createTableQuery, (err) => {
    if (err) {
      return console.error("❌ Error creating industry table:", err.message);
    }
    console.log("✅ Industry Table created successfully");
  });
};

const addindustry = (req, res) => {
  const userId = req.user.userId;
  const { name, type, data } = req.body;

  if (type === "csv") {
    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: "CSV data is required" });
    }

    const results = [];
    data.forEach((row) => {
      const industryName = row.name?.trim();
      if (industryName) {
        results.push([industryName]);
      }
    });

    if (results.length === 0) {
      return res
        .status(400)
        .json({ error: "No valid industry found in CSV." });
    }

    const query = "INSERT INTO industry (name) VALUES ?";
    connection.query(query, [results], (err, dbRes) => {
      if (err) {
        console.error("❌ Error inserting CSV industry:", err);
        if (err.code === "ER_DUP_ENTRY") {
          return res
            .status(409)
            .json({ error: "Some industry already exist" });
        }
        return res.status(500).json({ error: "Database error" });
      }

      // Audit log for each inserted industry
      const startId = dbRes.insertId;
      results.forEach((row, idx) => {
        logAudit({
          tableName: "dbadminhistory",
          entityType: "industry",
          entityId: startId + idx,
          action: "ADDED",
          data: { name: row[0], status: "Active" },
          changedBy: userId,
        });
      });

      res.json({
        success: true,
        inserted: dbRes.affectedRows,
        message: `${dbRes.affectedRows} Industrys inserted successfully`,
      });
    });
  } else {
    if (!name) return res.status(400).json({ error: "Name is required" });

    const checkQuery = "SELECT id FROM industry WHERE name = ?";
    connection.query(checkQuery, [name], (err, results) => {
      if (err) return res.status(500).json({ error: "Database error" });
      if (results.length > 0)
        return res.status(409).json({ message: "Industry already exists" });

      const insertQuery = "INSERT INTO industry (name) VALUES (?)";
      connection.query(insertQuery, [name], (err, insertResults) => {
        if (err) return res.status(500).json({ error: "Database error" });

        logAudit({
          tableName: "dbadminhistory",
          entityType: "industry",
          entityId: insertResults.insertId,
          action: "ADDED",
          data: { name, status: "Active" },
          changedBy: userId,
        });

        res.status(201).json({
          message: "Industry added successfully",
          industryId: insertResults.insertId,
        });
      });
    });
  }
};

const getallindustry = (
  { page = 1, limit = 15, name = "name", search = "", status = "Active" },
  callback
) => {
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 15;
  const offset = (pageNum - 1) * limitNum;

  // ✅ Whitelist columns for search
  const allowedColumns = ["name", "status", "created_at", "updated_at"];
  if (!allowedColumns.includes(name)) name = "name";

  const whereConditions = [];
  const values = [];

  // ✅ Status filter (only if not "all")
  if (status && status !== "all") {
    whereConditions.push("status = ?");
    values.push(status);
  }

  // ✅ Search filter
  if (search) {
    if (name === "created_at" || name === "updated_at") {
      whereConditions.push(`DATE(${name}) = ?`);
      values.push(search);
    } else if (name === "status") {
      // Case-insensitive search on status
      whereConditions.push("LOWER(status) LIKE ?");
      values.push(`%${search.toLowerCase()}%`);
    } else {
      // name column
      whereConditions.push(`${name} LIKE ?`);
      values.push(`%${search}%`);
    }
  }

  const whereClause =
    whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

  // ✅ Main query
  const query = `
    SELECT *
    FROM industry
    ${whereClause}
    ORDER BY id DESC
    LIMIT ? OFFSET ?
  `;
  const queryValues = [...values, limitNum, offset];

  // ✅ Count query for pagination
  const countQuery = `
    SELECT COUNT(*) AS total
    FROM industry
    ${whereClause}
  `;

  connection.query(query, queryValues, (err, results) => {
    if (err) return callback(err);

    connection.query(countQuery, values, (err2, countResult) => {
      if (err2) return callback(err2);
      callback(null, {
        total: countResult[0].total,
        page: pageNum,
        limit: limitNum,
        industry: results,
      });
    });
  });
};

const deleteindustry = (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  const checkQuery = "SELECT * FROM industry WHERE id = ?";
  connection.query(checkQuery, [id], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (results.length === 0)
      return res.status(404).json({ error: "Industry not found" });

    const currentIndustry = results[0];
    const newStatus =
      currentIndustry.status === "Active" ? "Inactive" : "Active";

    const updateQuery = "UPDATE industry SET status = ? WHERE id = ?";
    connection.query(updateQuery, [newStatus, id], (err2) => {
      if (err2) return res.status(500).json({ error: "Database error" });

      logAudit({
        tableName: "dbadminhistory",
        entityType: "industry",
        entityId: id,
        action: newStatus.toUpperCase(),
        data: { name: currentIndustry.name, status: newStatus },
        changedBy: userId,
      });

      res
        .status(200)
        .json({ message: `Industry status updated to ${newStatus}` });
    });
  });
};
const editindustry = (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  const userId = req.user.userId;

  if (!name) return res.status(400).json({ error: "Name is required" });

  const checkQuery = "SELECT * FROM industry WHERE id = ?";
  connection.query(checkQuery, [id], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (results.length === 0)
      return res.status(404).json({ error: "Industry not found" });

    const updateQuery = "UPDATE industry SET name = ? WHERE id = ?";
    connection.query(updateQuery, [name, id], (err2) => {
      if (err2) return res.status(500).json({ error: "Database error" });

      logAudit({
        tableName: "dbadminhistory",
        entityType: "industry",
        entityId: id,
        action: "UPDATED",
        data: { status: results[0].status, name },
        changedBy: userId,
      });

      res.status(200).json({ message: "Industry updated successfully" });
    });
  });
};

module.exports = {
  createIndustryTable,
  addindustry,
  getallindustry,
  deleteindustry,
  editindustry,
};
