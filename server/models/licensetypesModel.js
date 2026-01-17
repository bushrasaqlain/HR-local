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
  const { name } = req.body;
  const userId = req.user.userId;

  if (!name) return res.status(400).json({ error: "License type name is required" });

  const checkQuery = "SELECT id FROM license_types WHERE name = ?";
  connection.query(checkQuery, [name], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (results.length > 0) return res.status(409).json({ error: "License type already exists" });

    const insertQuery = "INSERT INTO license_types (name) VALUES (?)";
    connection.query(insertQuery, [name], (err2, insertResult) => {
      if (err2) return res.status(500).json({ error: "Database error" });

      const licenseTypeId = insertResult.insertId;
      logAudit({
        tableName: "dbadminhistory",
        entityType: "license_types",
        entityId: licenseTypeId,
        action: "ADDED",
        data: { name, status: "active" },
        changedBy: userId,
      });

      res.status(201).json({ message: "License type added successfully", licenseTypeId });
    });
  });
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
  const query = "SELECT * FROM license_types ORDER BY id DESC";
  connection.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.status(200).json({ licenseTypes: results });
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
