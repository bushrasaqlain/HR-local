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

  const allowedColumns = ["name", "price", "duration_value", "duration_unit", "currency", "created_at", "updated_at"];
  
  if (!allowedColumns.includes(name)) {
    name = "name"; // default column
  }

  // Handle special fields
  if (name === "amount") {
    name = "price"; // fallback to price; we can concatenate later if needed
  } else if (name === "duration") {
    name = "duration_value"; // fallback to duration_value
  }

  // Build query dynamically
  let query = `SELECT * FROM packages WHERE status = ?`;
  let values = [status];

  if (search) {
    query += ` AND ${name} LIKE ?`;
    values.push(`%${search}%`);
  }

  query += ` ORDER BY id DESC LIMIT ? OFFSET ?`;
  values.push(limit, offset);

  connection.query(query, values, (err, results) => {
    if (err) return callback(err);

    let countQuery = `SELECT COUNT(*) AS total FROM packages WHERE status = ?`;
    let countValues = [status];

    if (search) {
      countQuery += ` AND ${name} LIKE ?`;
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
    const { duration_unit, price, duration_value, currency } = req.body;

    if (!duration_unit || !price || !duration_value || !currency) {
        return res.status(400).json({ error: "All fields are required" });
    }

    const insertSql = `INSERT INTO packages 
                     (duration_unit, price, duration_value, currency) 
                     VALUES (?, ?, ?, ?)`;

    connection.query(insertSql, [duration_unit, price, duration_value, currency], (err, results) => {
        if (err) {
            console.error("❌ Error inserting package:", err);
            return res.status(500).json({ error: "Database error" });
        }

        logAudit({
            tableName: "dbadminhistory",
            entityType: "package",
            entityId: results.insertId,
            action: "ADDED",
            data: { duration_unit, price, duration_value, currency, status: "active" },
            changedBy: userId,
        });

        res.status(201).json({ message: "Package added successfully", packageId: results.insertId });
    });
}
const editPackage = (req, res) => {
    const { id } = req.params;
    const { duration_unit, price, duration_value, currency } = req.body;
    const userId = req.user.userId;

    if (!duration_unit || !price || !duration_value || !currency) {
        return res.status(400).json({ error: "All fields are required" });
    }

    const checkSql = "SELECT * FROM packages WHERE id = ?";
    connection.query(checkSql, [id], (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        if (results.length === 0) return res.status(404).json({ error: "Package not found" });

        const updateSql = `UPDATE packages 
                           SET duration_unit = ?, price = ?, duration_value = ?, currency = ? 
                           WHERE id = ?`;

        connection.query(updateSql, [duration_unit, price, duration_value, currency, id], (err2) => {
            if (err2) return res.status(500).json({ error: "Database error" });

            logAudit({
                tableName: "dbadminhistory",
                entityType: "package",
                entityId: id,
                action: "UPDATED",
                data: { duration_unit, price, duration_value, currency, status: results[0].status },
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

module.exports = {
    createPackagesTable,
    getAllPackages,
    addPackage,
    editPackage,
    deletePackage,
}

