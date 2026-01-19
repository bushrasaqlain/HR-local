const express = require("express");
const router = express.Router();
const connection = require("../connection");
const authMiddleware = require("../middleware/auth.js");
const logAudit = require("../utils/auditLogger");

// Create institute table
const createInstituteTable = () => {
    const createTableQuery = `
  CREATE TABLE IF NOT EXISTS institute (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status ENUM('Active', 'InActive') DEFAULT 'Active'
  )
`;

    connection.query(createTableQuery, (err) => {
        if (err) {
            return console.error("❌ Error creating institute table:", err.message);
        }
        console.log("✅ Institute Names Table created successfully");
    });
}


const getAllInstitute = ({ page, limit, name, search, status }, callback) => {
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 15;
    const offset = (page - 1) * limit;

    const allowedColumns = ["name", "created_at", "updated_at"];
    if (!allowedColumns.includes(name)) name = "name";

    let condition = "WHERE 1=1";
    let values = [];

    // ✅ STATUS FILTER
    if (status && status !== "all") {
        condition += " AND status = ?";
        values.push(status);
    }

    // ✅ SEARCH FILTER
    if (search) {
        if (name === "name") {
            condition += " AND name LIKE ?";
            values.push(`%${search}%`);
        } else {
            condition += ` AND DATE(${name}) = ?`;
            values.push(search);
        }
    }

    const query = `
    SELECT * FROM institute
    ${condition}
    ORDER BY id DESC
    LIMIT ? OFFSET ?
  `;

    values.push(limit, offset);

    connection.query(query, values, (err, results) => {
        if (err) return callback(err);

        connection.query(
            `SELECT COUNT(*) AS total FROM institute ${condition}`,
            values.slice(0, values.length - 2),
            (err2, countResult) => {
                if (err2) return callback(err2);

                callback(null, {
                    total: countResult[0].total,
                    page,
                    limit,
                    institutes: results,
                });
            }
        );
    });
};


const addInstitute = ({ name, type, data, userId }, callback) => {

    if (type === "csv") {
        if (!Array.isArray(data) || data.length === 0) {
            return callback({ status: 400, message: "CSV data is required" });
        }

        const values = [];
        data.forEach(row => {
            const instituteName = row.name?.trim();
            if (instituteName) values.push([instituteName]);
        });

        if (values.length === 0) {
            return callback({ status: 400, message: "No valid institute names found in CSV" });
        }

        const query = "INSERT INTO institute (name) VALUES ?";
        connection.query(query, [values], (err, dbRes) => {
            if (err) {
                if (err.code === "ER_DUP_ENTRY") {
                    return callback({ status: 409, message: "Some institute names already exist" });
                }
                return callback(err);
            }

            const startId = dbRes.insertId;
            values.forEach((row, idx) => {
                logAudit({
                    tableName: "dbadminhistory",
                    entityType: "institute",
                    entityId: startId + idx,
                    action: "ADDED",
                    data: { name: row[0], status: "active" },
                    changedBy: userId,
                });
            });

            callback(null, {
                success: true,
                inserted: dbRes.affectedRows,
                message: `${dbRes.affectedRows} institute names inserted successfully`,
            });
        });

    } else {
        if (!name) {
            return callback({ status: 400, message: "institute name is required" });
        }

        const checkQuery = "SELECT id FROM institute WHERE name = ?";
        connection.query(checkQuery, [name], (err, results) => {
            if (err) return callback(err);
            if (results.length > 0) {
                return callback({ status: 409, message: "institute name already exists" });
            }

            const insertQuery = "INSERT INTO institute (name) VALUES (?)";
            connection.query(insertQuery, [name], (err, insertResults) => {
                if (err) return callback(err);

                logAudit({
                    tableName: "dbadminhistory",
                    entityType: "institute",
                    entityId: insertResults.insertId,
                    action: "ADDED",
                    data: { name, status: "active" },
                    changedBy: userId,
                });

                callback(null, {
                    message: "institute name added successfully",
                    instituteId: insertResults.insertId,
                });
            });
        });
    }
};



const editInstitute = (req, res) => {
    const { id } = req.params;
    const { name, userId } = req.body;

    if (!name) return res.status(400).json({ error: "Name is required" });

    const updateQuery = "UPDATE institute SET name = ? WHERE id = ?";
    connection.query(updateQuery, [name, id], (err2) => {
        if (err2) return res.status(500).json({ error: "Database error" });

        logAudit({
            tableName: "dbadminhistory",
            entityType: "institute",
            entityId: id,
            action: "UPDATED",
            data: { name },
            changedBy: userId,
        });

        res.status(200).json({ message: "institute name updated successfully" });
    });
}

const updateStatus = (req, res) => {
  const { id,status } = req.params;
  const userId = req.user.userId;

  const checkQuery = "SELECT * FROM institute WHERE id = ?";
  connection.query(checkQuery, [id], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (results.length === 0)
      return res.status(404).json({ error: "institute not found" });

    const currentInstitute = results[0];
    const newStatus =
      currentInstitute.status === "active" ? "inactive" : "active";

    const updateQuery = "UPDATE institute SET status = ? WHERE id = ?";
    connection.query(updateQuery, [newStatus, id], (err2) => {
      if (err2) return res.status(500).json({ error: "Database error" });

      logAudit({
        tableName: "dbadminhistory",
        entityType: "institute",
        entityId: id,
        action: newStatus.toUpperCase(), // "ACTIVE" or "INACTIVE"
        data: { name: currentInstitute.name, status: newStatus },
        changedBy: userId,
      });

      res
        .status(200)
        .json({ message: `Country status updated to ${newStatus}` });
    });
  });
};



module.exports = {
    createInstituteTable,
    addInstitute,
    getAllInstitute,
    editInstitute,
    updateStatus
};