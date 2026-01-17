const express = require("express");
const router = express.Router();
const connection = require("../connection");
const authMiddleware = require("../middleware/auth");
const logAudit = require("../utils/auditLogger");

// Create table (optional, run once)
const createspecialityTable = () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS speciality (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      status ENUM('active','inactive') DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `;
  connection.query(createTableQuery, (err) => {
    if (err) return console.error(err);
    console.log("✅ speciality table created successfully");
  });
};

// Add speciality type
const addspeciality = (req, res) => {
  const userId = req.user.userId;

  let names = [];

  if (req.file) {
    // 🔹 parse file into array of names
    names = parseCsvOrExcel(req.file.path); // must return array of strings
  } else {
    const { name } = req.body;
    if (!name)
      return res.status(400).json({ error: "Speciality type name is required" });
    names = Array.isArray(name) ? name : [name];
  }

  let inserted = 0;

  const run = (index) => {
    if (index >= names.length) {
      return res.status(201).json({
        message: "Speciality type added successfully",
        inserted,
      });
    }

    const currentName = names[index];

    const checkQuery = "SELECT id FROM speciality WHERE name = ?";
    connection.query(checkQuery, [currentName], (err, results) => {
      if (err) return res.status(500).json({ error: "Database error" });
      if (results.length > 0) return run(index + 1);

      const insertQuery = "INSERT INTO speciality (name) VALUES (?)";
      connection.query(insertQuery, [currentName], (err2, insertResult) => {
        if (!err2) {
          inserted++;

          const SpecialityId = insertResult.insertId;
          logAudit({
            tableName: "dbadminhistory",
            entityType: "speciality",
            entityId: SpecialityId,
            action: "ADDED",
            data: { name: currentName, status: "active" },
            changedBy: userId,
          });
        }

        run(index + 1);
      });
    });
  };

  run(0);
};



// Edit speciality type
const editspeciality = (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  const userId = req.user.userId;

  if (!name) return res.status(400).json({ error: "Speciality type name is required" });

  const checkQuery = "SELECT * FROM speciality WHERE id = ?";
  connection.query(checkQuery, [id], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (results.length === 0) return res.status(404).json({ error: "Speciality type not found" });

    const updateQuery = "UPDATE speciality SET name = ? WHERE id = ?";
    connection.query(updateQuery, [name, id], (err2) => {
      if (err2) return res.status(500).json({ error: "Database error" });

      logAudit({
        tableName: "dbadminhistory",
        entityType: "speciality",
        entityId: id,
        action: "UPDATED",
        data: { name, status: results[0].status },
        changedBy: userId,
      });

      res.status(200).json({ message: "Speciality type updated successfully" });
    });
  });
};

// Get all speciality types
const getAllspeciality = (req, res) => {
  const query = "SELECT * FROM speciality ORDER BY id DESC";
  connection.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.status(200).json({ speciality: results });
  });
};

// Delete / toggle status
const deletespeciality = (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  const checkQuery = "SELECT * FROM speciality WHERE id = ?";
  connection.query(checkQuery, [id], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (results.length === 0) return res.status(404).json({ error: "Speciality type not found" });

    const newStatus = results[0].status === "active" ? "inactive" : "active";
    const updateQuery = "UPDATE speciality SET status = ? WHERE id = ?";
    connection.query(updateQuery, [newStatus, id], (err2) => {
      if (err2) return res.status(500).json({ error: "Database error" });

      logAudit({
        tableName: "dbadminhistory",
        entityType: "speciality",
        entityId: id,
        action: newStatus.toUpperCase(),
        data: { name: results[0].name, status: newStatus },
        changedBy: userId,
      });

      res.status(200).json({ message: `Speciality type status updated to ${newStatus}` });
    });
  });
};

module.exports = {
  createspecialityTable,
  addspeciality,
  editspeciality,
  getAllspeciality,
  deletespeciality,
};
