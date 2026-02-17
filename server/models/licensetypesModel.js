const express = require("express");
const router = express.Router();
const connection = require("../connection");
const authMiddleware = require("../middleware/auth");
const logAudit = require("../utils/auditLogger");

// Create table (optional, run once)
const createLicenseTypesTable = () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS license_types (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      status ENUM('active','inactive') DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `;
  connection.query(createTableQuery, (err) => {
    if (err) return console.error(err);
    console.log("✅ license_types table created successfully");
  });
};

// Add license type
const addLicenseType = (req, res) => {
  const userId = req.user.userId;
  const { name, type, data } = req.body;

  if (type === "csv") {
    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: "CSV data is required" });
    }

    const values = [];
    data.forEach((row) => {
      const licenseName = row.name?.trim();
      if (licenseName) values.push([licenseName]);
    });

    if (values.length === 0) {
      return res.status(400).json({ error: "No valid license Name found in CSV." });
    }

    const query = "INSERT INTO license_types (name) VALUES ?";
    connection.query(query, [values], (err, dbRes) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({ error: "Some license Name already exist" });
        }
        return res.status(500).json({ error: "Database error" });
      }

      const startId = dbRes.insertId;
      values.forEach((row, idx) => {
        logAudit({
          tableName: "dbadminhistory",
          entityType: "license_types",
          entityId: startId + idx,
          action: "ADDED",
          data: { name: row[0], status: "active" },
          changedBy: userId,
        });
      });

      res.json({
        success: true,
        inserted: dbRes.affectedRows,
        message: `${dbRes.affectedRows} licenseName inserted successfully`,
      });
    });
  } else {
    if (!name) return res.status(400).json({ error: "licenseName name is required" });

    const checkQuery = "SELECT id FROM license_types WHERE name = ?";
    connection.query(checkQuery, [name], (err, results) => {
      if (err) return res.status(500).json({ error: "Database error" });
      if (results.length > 0)
        return res.status(409).json({ message: "license Name already exists" });

      const insertQuery = "INSERT INTO license_types (name) VALUES (?)";
      connection.query(insertQuery, [name], (err, insertResults) => {
        if (err) return res.status(500).json({ error: "Database error" });

        logAudit({
          tableName: "dbadminhistory",
          entityType: "license_types",
          entityId: insertResults.insertId,
          action: "ADDED",
          data: { name, status: "active" },
          changedBy: userId,
        });

        res.status(201).json({
          message: "licenseName added successfully",
          licenseId: insertResults.insertId,
        });
      });
    });
  }
};

// Edit license type
const editLicenseType = (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  const userId = req.user.userId;

  if (!name) return res.status(400).json({ error: "License type name is required" });

  const checkQuery = "SELECT * FROM license_types WHERE id = ?";
  connection.query(checkQuery, [id], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (results.length === 0) return res.status(404).json({ error: "License type not found" });

    const updateQuery = "UPDATE license_types SET name = ? WHERE id = ?";
    connection.query(updateQuery, [name, id], (err2) => {
      if (err2) return res.status(500).json({ error: "Database error" });

      logAudit({
        tableName: "dbadminhistory",
        entityType: "license_types",
        entityId: id,
        action: "UPDATED",
        data: { name, status: results[0].status },
        changedBy: userId,
      });

      res.status(200).json({ message: "License type updated successfully" });
    });
  });
};

// Get all license types
const getAllLicenseTypes = (req, res) => {
  const { page = 1, limit = 15, name = "name", search = "", status = "all" } = req.query;

  const currentPage = parseInt(page);
  const itemsPerPage = parseInt(limit);
  const offset = (currentPage - 1) * itemsPerPage;

  const allowedColumns = ["name", "created_at", "updated_at", "status"];
  let column = allowedColumns.includes(name) ? name : "name";

  const whereConditions = [];
  const values = [];

  // Status filter
  if (status && status !== "all") {
    whereConditions.push("status = ?");
    values.push(status);
  }

  // Search filter
  if (search && search.trim() !== "") {
    if (column === "created_at" || column === "updated_at") {
      whereConditions.push(`DATE(${column}) = ?`);
      values.push(search);
    } else if (column === "status") {
      whereConditions.push("LOWER(status) LIKE ?");
      values.push(`%${search.toLowerCase()}%`);
    } else {
      whereConditions.push(`${column} LIKE ?`);
      values.push(`%${search}%`);
    }
  }

  const whereClause =
    whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

  // Main query with pagination
  const query = `
    SELECT * 
    FROM license_types
    ${whereClause}
    ORDER BY id DESC
    LIMIT ? OFFSET ?
  `;

  connection.query(query, [...values, itemsPerPage, offset], (err, results) => {
    if (err) {
      console.error("Query Error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    // Count query
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM license_types
      ${whereClause}
    `;

    connection.query(countQuery, values, (err2, count) => {
      if (err2) {
        console.error("Count Query Error:", err2);
        return res.status(500).json({ error: "Database error" });
      }

      res.status(200).json({
        total: count[0].total,
        page: currentPage,
        limit: itemsPerPage,
        licenseTypes: results,
      });
    });
  });
};

// Delete / toggle status
const deleteLicenseType = (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  const checkQuery = "SELECT * FROM license_types WHERE id = ?";
  connection.query(checkQuery, [id], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (results.length === 0) return res.status(404).json({ error: "License type not found" });

    const newStatus = results[0].status === "active" ? "inactive" : "active";
    const updateQuery = "UPDATE license_types SET status = ? WHERE id = ?";
    connection.query(updateQuery, [newStatus, id], (err2) => {
      if (err2) return res.status(500).json({ error: "Database error" });

      logAudit({
        tableName: "dbadminhistory",
        entityType: "license_types",
        entityId: id,
        action: newStatus.toUpperCase(),
        data: { name: results[0].name, status: newStatus },
        changedBy: userId,
      });

      res.status(200).json({ message: `License type status updated to ${newStatus}` });
    });
  });
};

module.exports = {
  createLicenseTypesTable,
  addLicenseType,
  editLicenseType,
  getAllLicenseTypes,
  deleteLicenseType,
};
