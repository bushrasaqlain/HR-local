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
}

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
}
const editDegreeType = (req, res) => {
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
}

const getAllDegreeTypes = ({ page, limit, name, search, status }, callback) => {
    // ✅ convert strings to integers
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 15;
    const offset = (pageNum - 1) * limitNum;

    const query = `
    SELECT * FROM degreetypes 
    WHERE status = ? AND ${name} LIKE ? 
    ORDER BY id DESC
    LIMIT ? OFFSET ?
  `;

    const values = [status, `%${search}%`, limitNum, offset];

    connection.query(query, values, (err, results) => {
        if (err) return callback(err);

        const countQuery = `
      SELECT COUNT(*) AS total 
      FROM degreetypes 
      WHERE status = ? AND ${name} LIKE ?
    `;

        connection.query(countQuery, [status, `%${search}%`], (err2, countResult) => {
            if (err2) return callback(err2);

            callback(null, {
                total: countResult[0].total,
                page: pageNum,
                limit: limitNum,
                degreetypes: results,
            });
        });
    });
};


const deleteDegreeType = (req, res) => {
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
}
module.exports = {
    createDegreeTypesTable,
    addDegreeType,
    editDegreeType,
    getAllDegreeTypes,
    deleteDegreeType
};