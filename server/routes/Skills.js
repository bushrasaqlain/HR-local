const express = require("express");
const router = express.Router();
const connection = require("../connection");
const authMiddleware = require("../middleware/auth.js");
const logAudit = require("../utils/auditLogger");

// ============================
// Create Skills table
// ============================
const createSkillsTable = () => {
const createTableQuery = `
  CREATE TABLE IF NOT EXISTS skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status ENUM('active', 'inactive') DEFAULT 'active'
  )
`;

connection.query(createTableQuery, (err) => {
  if (err) {
    return console.error("❌ Error creating skills table:", err.message);
  }
  console.log("✅ Skills Table created successfully");
});
}

// ============================
// Add Skill (CSV or Single)
// ============================
router.post("/addskill", authMiddleware, (req, res) => {
  const userId = req.user.userId;
  const { name, type, data } = req.body;

  if (type === "csv") {
    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: "CSV data is required" });
    }

    const values = [];
    data.forEach((row) => {
      const skillName = row.name?.trim();
      if (skillName) values.push([skillName]);
    });

    if (values.length === 0) {
      return res.status(400).json({ error: "No valid skills found in CSV." });
    }

    const query = "INSERT INTO skills (name) VALUES ?";
    connection.query(query, [values], (err, dbRes) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({ error: "Some skills already exist" });
        }
        return res.status(500).json({ error: "Database error" });
      }

      const startId = dbRes.insertId;
      values.forEach((row, idx) => {
        logAudit({
          tableName: "dbadminhistory",
          entityType: "skill",
          entityId: startId + idx,
          action: "ADDED",
          data: { name: row[0], status: "active" },
          changedBy: userId,
        });
      });

      res.json({
        success: true,
        inserted: dbRes.affectedRows,
        message: `${dbRes.affectedRows} skills inserted successfully`,
      });
    });
  } else {
    if (!name) return res.status(400).json({ error: "Skill name is required" });

    const checkQuery = "SELECT id FROM skills WHERE name = ?";
    connection.query(checkQuery, [name], (err, results) => {
      if (err) return res.status(500).json({ error: "Database error" });
      if (results.length > 0) return res.status(409).json({ message: "Skill already exists" });

      const insertQuery = "INSERT INTO skills (name) VALUES (?)";
      connection.query(insertQuery, [name], (err, insertResults) => {
        if (err) return res.status(500).json({ error: "Database error" });

        logAudit({
          tableName: "dbadminhistory",
          entityType: "skill",
          entityId: insertResults.insertId,
          action: "ADDED",
          data: { name, status: "active" },
          changedBy: userId,
        });

        res.status(201).json({
          message: "Skill added successfully",
          skillId: insertResults.insertId,
        });
      });
    });
  }
});

// ============================
// Get All Skills (pagination + search + status)
// ============================
router.get("/getallskills", (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 15;
  const offset = (page - 1) * limit;
  const name = req.query.name || "name";
  const search = req.query.search || "";
  const status = req.query.status || "active";

  const condition = name === "name" ? "name LIKE ?" : `DATE(${name}) = ?`;
  const searchValue = name === "name" ? `%${search}%` : search;
  const query = `
    SELECT * FROM skills
    WHERE status = ? AND ${condition}
    ORDER BY id DESC
    LIMIT ? OFFSET ?
  `;
  const values = [status, searchValue, limit, offset];

  connection.query(query, values, (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });

    connection.query(
      `SELECT COUNT(*) AS total FROM skills WHERE status = ? AND ${condition}`,
      [status, searchValue],
      (err2, countResult) => {
        if (err2) return res.status(500).json({ error: "Database error" });

        res.status(200).json({
          total: countResult[0].total,
          page,
          limit,
          skills: results,
        });
      }
    );
  });
});

// ============================
// Toggle Skill (active/inactive)
// ============================
router.delete("/deleteskill/:id", authMiddleware, (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  const checkQuery = "SELECT * FROM skills WHERE id = ?";
  connection.query(checkQuery, [id], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (results.length === 0) return res.status(404).json({ error: "Skill not found" });

    const currentSkill = results[0];
    const newStatus = currentSkill.status === "active" ? "inactive" : "active";

    const updateQuery = "UPDATE skills SET status = ? WHERE id = ?";
    connection.query(updateQuery, [newStatus, id], (err2) => {
      if (err2) return res.status(500).json({ error: "Database error" });

      logAudit({
        tableName: "dbadminhistory",
        entityType: "skill",
        entityId: id,
        action: newStatus.toUpperCase(),
        data: { name: currentSkill.name, status: newStatus },
        changedBy: userId,
      });

      res.status(200).json({ message: `Skill status updated to ${newStatus}` });
    });
  });
});

// ============================
// Edit Skill
// ============================
router.put("/editskill/:id", authMiddleware, (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  const userId = req.user.userId;

  if (!name) return res.status(400).json({ error: "Name is required" });

  const checkQuery = "SELECT * FROM skills WHERE id = ?";
  connection.query(checkQuery, [id], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (results.length === 0) return res.status(404).json({ error: "Skill not found" });

    const updateQuery = "UPDATE skills SET name = ? WHERE id = ?";
    connection.query(updateQuery, [name, id], (err2) => {
      if (err2) return res.status(500).json({ error: "Database error" });

      logAudit({
        tableName: "dbadminhistory",
        entityType: "skill",
        entityId: id,
        action: "UPDATED",
        data: { name, status: results[0].status },
        changedBy: userId,
      });

      res.status(200).json({ message: "Skill updated successfully" });
    });
  });
});

module.exports = router;
