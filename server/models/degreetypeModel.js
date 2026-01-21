const express = require("express");
const router = express.Router();
const connection = require("../connection");
const authMiddleware = require("../middleware/auth.js");
const logAudit = require("../utils/auditLogger");

// Create table if not exists
const createDegreeTypesTable = () => {
  const createTableQuery = `
  CREATE TABLE IF NOT EXISTS degreetypes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status ENUM('active', 'inactive') DEFAULT 'active'
  )
`;

  connection.query(createTableQuery, (err) => {
    if (err) {
      console.error("❌ Error creating degreetypes table:", err.message);
    } else {
      console.log("✅ degree types Table created successfully");
    }
  });
};

const addDegreeType = (req, res) => {
  const userId = req.user.userId;
  const { name, type, data } = req.body;

  if (type === "csv") {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: "CSV data is required" });
    }

    const results = [];
    data.forEach((row) => {
      const degreeName = row.name?.trim();
      if (degreeName) results.push([degreeName]);
    });

    if (results.length === 0) {
      return res
        .status(400)
        .json({ error: "No valid degree names found in CSV" });
    }

    const query = "INSERT INTO degreetypes (name) VALUES ?";
    connection.query(query, [results], (err, dbRes) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res
            .status(409)
            .json({ error: "Some degree types already exist" });
        }
        return res.status(500).json({ error: "Database error" });
      }

      // Audit log for each insert
      const startId = dbRes.insertId;
      results.forEach((row, idx) => {
        const degreeName = row[0];
        const degreeId = startId + idx;
        logAudit({
          tableName: "dbadminhistory",
          entityType: "degree",
          entityId: degreeId,
          action: "ADDED",
          data: { name: degreeName, status: "active" },
          changedBy: userId,
        });
      });

      res.json({
        success: true,
        inserted: dbRes.affectedRows,
        message: `${dbRes.affectedRows} degree types inserted successfully`,
      });
    });
  } else {
    // Single insert
    if (!name) return res.status(400).json({ error: "Name is required" });

    const checkQuery = "SELECT id FROM degreetypes WHERE name = ?";
    connection.query(checkQuery, [name], (err, results) => {
      if (err) return res.status(500).json({ error: "Database error" });
      if (results.length > 0)
        return res.status(409).json({ message: "Degree type already exists" });

      const insertQuery = "INSERT INTO degreetypes (name) VALUES (?)";
      connection.query(insertQuery, [name], (err, insertResults) => {
        if (err) return res.status(500).json({ error: "Database error" });

        const degreeId = insertResults.insertId;
        logAudit({
          tableName: "dbadminhistory",
          entityType: "degree",
          entityId: degreeId,
          action: "ADDED",
          data: { name, status: "active" },
          changedBy: userId,
        });

        res.status(201).json({
          message: "Degree type added successfully",
          degreeId,
        });
      });
    });
  }
};
const editDegreeType = (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  const userId = req.user.userId;

  if (!name) return res.status(400).json({ error: "Name is required" });

  const checkQuery = "SELECT * FROM degreetypes WHERE id = ?";
  connection.query(checkQuery, [id], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (results.length === 0)
      return res.status(404).json({ error: "Degree type not found" });

    const updateQuery = "UPDATE degreetypes SET name = ? WHERE id = ?";
    connection.query(updateQuery, [name, id], (err2) => {
      if (err2) return res.status(500).json({ error: "Database error" });

      logAudit({
        tableName: "dbadminhistory",
        entityType: "degree",
        entityId: id,
        action: "UPDATED",
        data: { status: results[0].status, name },
        changedBy: userId,
      });

      res.status(200).json({ message: "Degree type updated successfully" });
    });
  });
};

const getAllDegreeTypes = (
  { page = 1, limit = 0, name = "name", search = "", status = "active" },
  callback
) => {
  // Page and limit are ignored when returning all results
  const allowedColumns = ["name", "status", "created_at", "updated_at"];
  if (!allowedColumns.includes(name)) name = "name";

  const whereConditions = [];
  const values = [];

  // Status filter
  if (status && status !== "all") {
    whereConditions.push("status = ?");
    values.push(status);
  }

  // Search filter
  if (search) {
    if (name === "created_at" || name === "updated_at") {
      whereConditions.push(`DATE(${name}) = ?`);
      values.push(search);
    } else if (name === "status") {
      whereConditions.push("LOWER(status) LIKE ?");
      values.push(`%${search.toLowerCase()}%`);
    } else {
      whereConditions.push(`${name} LIKE ?`);
      values.push(`%${search}%`);
    }
  }

  const whereClause =
    whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

  // ✅ Main query without LIMIT/OFFSET
  const query = `
    SELECT *
    FROM degreetypes
    ${whereClause}
    ORDER BY id DESC
  `;

  connection.query(query, values, (err, results) => {
    if (err) return callback(err);

    // Count is now just results.length
    callback(null, {
      total: results.length,
      degreetypes: results,
    });
  });
};


const deleteDegreeType = (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  const checkQuery = "SELECT * FROM degreetypes WHERE id = ?";
  connection.query(checkQuery, [id], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (results.length === 0)
      return res.status(404).json({ error: "Degree type not found" });

    const current = results[0];
    const newStatus = current.status === "active" ? "inactive" : "active";

    const updateQuery = "UPDATE degreetypes SET status = ? WHERE id = ?";
    connection.query(updateQuery, [newStatus, id], (err2) => {
      if (err2) return res.status(500).json({ error: "Database error" });

      logAudit({
        tableName: "dbadminhistory",
        entityType: "degree",
        entityId: id,
        action: newStatus.toUpperCase(),
        data: { name: current.name, status: newStatus },
        changedBy: userId,
      });

      res.json({ message: `Degree type status updated to ${newStatus}` });
    });
  });
};
module.exports = {
  createDegreeTypesTable,
  addDegreeType,
  editDegreeType,
  getAllDegreeTypes,
  deleteDegreeType,
};
