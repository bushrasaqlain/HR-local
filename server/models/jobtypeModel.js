const express = require("express");
const router = express.Router();
const connection = require("../connection.js");
const authMiddleware = require("../middleware/auth.js");
const logAudit = require("../utils/auditLogger.js");



const createJobTypeTable = () => {
    const createTableQuery = `
  CREATE TABLE IF NOT EXISTS jobtypes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status ENUM('active', 'inactive') DEFAULT 'active'
  )
`;

    connection.query(createTableQuery, (err) => {
        if (err) {
            return console.error("❌ Error creating jobtypes table:", err.message);
        }
        console.log("✅ Jobtypes Table created successfully");
    });
}

const addJobType = (req, res) => {
    const userId = req.user.userId;
    const { name, type, data } = req.body;

    if (type === "csv") {
        if (!Array.isArray(data) || data.length === 0) {
            return res.status(400).json({ error: "CSV data is required" });
        }

        const results = [];
        data.forEach((row) => {
            const jobTypeName = row.name?.trim();
            if (jobTypeName) {
                results.push([jobTypeName]);
            }
        });

        if (results.length === 0) {
            return res.status(400).json({ error: "No valid job types found in CSV." });
        }

        const query = "INSERT INTO jobtypes (name) VALUES ?";
        connection.query(query, [results], (err, dbRes) => {
            if (err) {
                console.error("❌ Error inserting CSV job types:", err);
                if (err.code === "ER_DUP_ENTRY") {
                    return res.status(409).json({ error: "Some job types already exist" });
                }
                return res.status(500).json({ error: "Database error" });
            }

            // Audit log for each inserted jobtype
            const startId = dbRes.insertId;
            results.forEach((row, idx) => {
                logAudit({
                    tableName: "dbadminhistory",
                    entityType: "jobtype",
                    entityId: startId + idx,
                    action: "ADDED",
                    data: { name: row[0], status: "active" },
                    changedBy: userId,
                });
            });

            res.json({
                success: true,
                inserted: dbRes.affectedRows,
                message: `${dbRes.affectedRows} job types inserted successfully`,
            });
        });
    } else {
        if (!name) return res.status(400).json({ error: "Name is required" });

        const checkQuery = "SELECT id FROM jobtypes WHERE name = ?";
        connection.query(checkQuery, [name], (err, results) => {
            if (err) return res.status(500).json({ error: "Database error" });
            if (results.length > 0) return res.status(409).json({ message: "Job type already exists" });

            const insertQuery = "INSERT INTO jobtypes (name) VALUES (?)";
            connection.query(insertQuery, [name], (err, insertResults) => {
                if (err) return res.status(500).json({ error: "Database error" });

                logAudit({
                    tableName: "dbadminhistory",
                    entityType: "jobtype",
                    entityId: insertResults.insertId,
                    action: "ADDED",
                    data: { name, status: "active" },
                    changedBy: userId,
                });

                res.status(201).json({
                    message: "Job type added successfully",
                    jobTypeId: insertResults.insertId,
                });
            });
        });
    }
}

const getAllJobTypes = (
  { page = 1, limit = 15, name = "name", search = "", status = "active" },
  callback
) => {
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 15;
  const offset = (pageNum - 1) * limitNum;

  // Validate column for filtering
  const validColumns = ["name", "created_at", "updated_at"];
  if (!validColumns.includes(name)) name = "name";

  let condition = "";
  const values = [];

  // Status filter
  if (status !== "all") {
    condition += " AND status = ?";
    values.push(status);
  }

  // Search / Date filter
  if (name === "name" && search) {
    condition += " AND name LIKE ?";
    values.push(`%${search}%`);
  } else if ((name === "created_at" || name === "updated_at") && search) {
    condition += ` AND DATE(${name}) = ?`;
    values.push(search);
  }

  const query = `
    SELECT * FROM jobtypes
    WHERE 1=1 ${condition}
    ORDER BY id DESC
    LIMIT ? OFFSET ?
  `;
  values.push(limitNum, offset);

  const countQuery = `SELECT COUNT(*) AS total FROM jobtypes WHERE 1=1 ${condition}`;

  connection.query(query, values, (err, results) => {
    if (err) return callback(err);

    connection.query(countQuery, values.slice(0, -2), (err2, countResult) => {
      if (err2) return callback(err2);

      callback(null, {
        total: countResult[0].total,
        page: pageNum,
        limit: limitNum,
        jobtypes: results,
      });
    });
  });
};





const deleteJobType = (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;

    const checkQuery = "SELECT * FROM jobtypes WHERE id = ?";
    connection.query(checkQuery, [id], (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        if (results.length === 0) return res.status(404).json({ error: "Job type not found" });

        const currentJobType = results[0];
        const newStatus = currentJobType.status === "active" ? "inactive" : "active";

        const updateQuery = "UPDATE jobtypes SET status = ? WHERE id = ?";
        connection.query(updateQuery, [newStatus, id], (err2) => {
            if (err2) return res.status(500).json({ error: "Database error" });

            logAudit({
                tableName: "dbadminhistory",
                entityType: "jobtype",
                entityId: id,
                action: newStatus.toUpperCase(),
                data: { name: currentJobType.name, status: newStatus },
                changedBy: userId,
            });

            res.status(200).json({ message: `Job type status updated to ${newStatus}` });
        });
    });
}
const editJobType = (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    const userId = req.user.userId;

    if (!name) return res.status(400).json({ error: "Name is required" });

    const checkQuery = "SELECT * FROM jobtypes WHERE id = ?";
    connection.query(checkQuery, [id], (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        if (results.length === 0) return res.status(404).json({ error: "Job type not found" });

        const updateQuery = "UPDATE jobtypes SET name = ? WHERE id = ?";
        connection.query(updateQuery, [name, id], (err2) => {
            if (err2) return res.status(500).json({ error: "Database error" });

            logAudit({
                tableName: "dbadminhistory",
                entityType: "jobtype",
                entityId: id,
                action: "UPDATED",
                data: { status: results[0].status, name },
                changedBy: userId,
            });

            res.status(200).json({ message: "Job type updated successfully" });
        });
    });
}

module.exports = {
 createJobTypeTable,
 addJobType,
 getAllJobTypes,
 deleteJobType,
 editJobType
};