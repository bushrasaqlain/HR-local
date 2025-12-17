const express = require("express");
const router = express.Router();
const connection = require("../connection.js");
const authMiddleware = require("../middleware/auth.js");
const logAudit = require("../utils/auditLogger.js");


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
      console.log("✅ degreetypes Table ready");
    }
  });
}

// ===============================
// Add Degree (Single / CSV)
// ===============================
router.post("/adddegree", authMiddleware, (req, res) => {
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
      return res.status(400).json({ error: "No valid degree names found in CSV" });
    }

    const query = "INSERT INTO degreetypes (name) VALUES ?";
    connection.query(query, [results], (err, dbRes) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({ error: "Some degree types already exist" });
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
      if (results.length > 0) return res.status(409).json({ message: "Degree type already exists" });

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
});

// ===============================
// Get All Degrees (Paginated + Search)
// ===============================
router.get("/getalldegrees", (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 15;
  const offset = (page - 1) * limit;
  const name = req.query.name || "name";
  const search = req.query.search || "";
  const status = req.query.status || "active";

  const query = `
    SELECT * FROM degreetypes 
    WHERE status = ? AND ${name} LIKE ? 
    ORDER BY id DESC
    LIMIT ? OFFSET ?
  `;
  const values = [status, `%${search}%`, limit, offset];

  connection.query(query, values, (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });

    connection.query(
      `SELECT COUNT(*) AS total FROM degreetypes WHERE status = ? AND ${name} LIKE ?`,
      [status, `%${search}%`],
      (err2, countResult) => {
        if (err2) return res.status(500).json({ error: "Database error" });

        res.status(200).json({
          total: countResult[0].total,
          page,
          limit,
          degreetypes: results,
        });
      }
    );
  });
});

// ===============================
// Dropdown (Active Only)
// ===============================
// router.get("/getdegreefordropdown", (req, res) => {
//   connection.query(
//     "SELECT id, name FROM degreetypes WHERE status = 'active'",
//     (err, results) => {
//       if (err) return res.status(500).json({ error: "Database error" });
//       res.status(200).json(results);
//     }
//   );
// });

// ===============================
// Edit Degree
// ===============================
router.put("/editdegree/:id", authMiddleware, (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  const userId = req.user.userId;

  if (!name) return res.status(400).json({ error: "Name is required" });

  const checkQuery = "SELECT * FROM degreetypes WHERE id = ?";
  connection.query(checkQuery, [id], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (results.length === 0) return res.status(404).json({ error: "Degree type not found" });

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
});

// ===============================
// Toggle Active/Inactive
// ===============================
router.delete("/deletedegree/:id", authMiddleware, (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  const checkQuery = "SELECT * FROM degreetypes WHERE id = ?";
  connection.query(checkQuery, [id], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (results.length === 0) return res.status(404).json({ error: "Degree type not found" });

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
});

module.exports = router;
