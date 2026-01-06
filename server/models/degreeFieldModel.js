const express = require("express");
const router = express.Router();
const connection = require("../connection");
const authMiddleware = require("../middleware/auth");
const logAudit = require("../utils/auditLogger");

const createDegreeFieldsTable = () => {
    const createTableQuery = `
  CREATE TABLE IF NOT EXISTS degreefields (
    id INT AUTO_INCREMENT PRIMARY KEY,
    degree_type_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (degree_type_id) REFERENCES degreetypes(id) ON DELETE CASCADE
  )
`;

    connection.query(createTableQuery, function (err) {
        if (err) return console.error(err.message);
        console.log("✅ Degreefields Table created successfully");
    });
}

const addDegreeField = (req, res) => {
    const userId = req.user.userId;
    const { name, type, data, t_id } = req.body;

    if (type === "csv") {
        if (!t_id) return res.status(400).json({ error: "Degree type ID is required" });
        if (!data || !Array.isArray(data) || data.length === 0) {
            return res.status(400).json({ error: "CSV data is required" });
        }

        const results = [];
        data.forEach((row) => {
            const fieldName = row.name?.trim();
            if (fieldName) results.push([fieldName, t_id]);
        });

        if (results.length === 0) {
            return res.status(400).json({ error: "No valid degree fields found in CSV." });
        }

        const query = "INSERT INTO degreefields (name, degree_type_id) VALUES ?";
        connection.query(query, [results], (err, dbRes) => {
            if (err) {
                console.error("❌ Error inserting CSV degreefields:", err);
                return res.status(500).json({ error: "Database error" });
            }

            // 🔥 Log each added degreefield
            const startId = dbRes.insertId;
            results.forEach((row, idx) => {
                logAudit({
                    tableName: "dbadminhistory",
                    entityType: "degreefield",
                    entityId: startId + idx,
                    action: "ADDED",
                    data: { name: row[0], degree_type_id: t_id, status: "active" },
                    changedBy: userId,
                });
            });

            res.json({
                success: true,
                inserted: dbRes.affectedRows,
                message: `${dbRes.affectedRows} degree fields inserted successfully`,
            });
        });
    } else {
        if (!name) return res.status(400).json({ error: "Name is required" });
        if (!t_id) return res.status(400).json({ error: "Degree type ID is required" });

        const checkQuery =
            "SELECT id FROM degreefields WHERE name = ? AND degree_type_id = ?";
        connection.query(checkQuery, [name, t_id], (err, results) => {
            if (err) return res.status(500).json({ error: "Database error" });
            if (results.length > 0) {
                return res.status(409).json({ message: "Degree field already exists" });
            }

            const insertQuery =
                "INSERT INTO degreefields (name, degree_type_id) VALUES (?, ?)";
            connection.query(insertQuery, [name, t_id], (err, insertResults) => {
                if (err) return res.status(500).json({ error: "Database error" });

                logAudit({
                    tableName: "dbadminhistory",
                    entityType: "degreefield",
                    entityId: insertResults.insertId,
                    action: "ADDED",
                    data: { name, degree_type_id: t_id, status: "active" },
                    changedBy: userId,
                });

                res.status(201).json({
                    message: "Degree field added successfully",
                    id: insertResults.insertId,
                });
            });
        });
    }
}
const getAllDegreeFields = ({ page = 1, limit = 15, name = "name", search = "", status = "active" }, callback) => {
  page = parseInt(page);
  limit = parseInt(limit);
  const offset = (page - 1) * limit;

  let searchColumn;
  if (name === "degree_field") {
    searchColumn = "dt.name";
  } else if (name === "created_at" || name === "updated_at") {
    searchColumn = `DATE(d.${name})`;  // convert datetime → date
  } else {
    searchColumn = `d.${name}`;
  }

  const query = `
    SELECT d.*, dt.name AS degree_type 
    FROM degreefields d
    JOIN degreetypes dt ON d.degree_type_id = dt.id
    WHERE d.status = ? AND ${searchColumn} LIKE ? 
    ORDER BY d.id DESC
    LIMIT ? OFFSET ?
  `;

  connection.query(query, [status, `%${search}%`, limit, offset], (err, results) => {
    if (err) return callback(err);

    const countQuery = `
      SELECT COUNT(*) AS total 
      FROM degreefields d
      JOIN degreetypes dt ON d.degree_type_id = dt.id
      WHERE d.status = ? AND ${searchColumn} LIKE ?
    `;

    connection.query(countQuery, [status, `%${search}%`], (err2, countResult) => {
      if (err2) return callback(err2);

      callback(null, {
        total: countResult[0].total,
        page,
        limit,
        degreefields: results,
      });
    });
  });
};

const editDegreeField = (id, data, userId, callback) => {
    const { name } = data;

    const checkQuery = "SELECT * FROM degreefields WHERE id = ?";

    connection.query(checkQuery, [id], (err, results) => {
        if (err) {
            return callback({ status: 500, message: "Database error" });
        }

        if (results.length === 0) {
            return callback({ status: 404, message: "Degree field not found" });
        }

        const updateQuery =
            "UPDATE degreefields SET name = ? WHERE id = ?";

        connection.query(updateQuery, [name, id], (err2) => {
            if (err2) {
                return callback({ status: 500, message: "Database error" });
            }

            logAudit({
                tableName: "dbadminhistory",
                entityType: "degreefield",
                entityId: id,
                action: "UPDATED",
                data: {
                    name,
                    status: results[0].status,
                },
                changedBy: userId,
            });

            return callback(null, {
                message: "Degree field updated successfully",
            });
        });
    });
};

module.exports = { editDegreeField };

const deleteDegreeField = (id, userId, callback) => {
    const checkQuery = "SELECT * FROM degreefields WHERE id = ?";
    connection.query(checkQuery, [id], (err, results) => {
        if (err) return callback({ status: 500, message: "Database error" });

        if (results.length === 0) return callback({ status: 404, message: "Degree field not found" });

        const current = results[0];
        const newStatus = current.status === "active" ? "inactive" : "active";

        const updateQuery = "UPDATE degreefields SET status = ? WHERE id = ?";
        connection.query(updateQuery, [newStatus, id], (err2) => {
            if (err2) return callback({ status: 500, message: "Database error" });

            logAudit({
                tableName: "dbadminhistory",
                entityType: "degreefield",
                entityId: id,
                action: newStatus.toUpperCase(),
                data: { name: current.name, degree_type_id: current.degree_type_id, status: newStatus },
                changedBy: userId,
            });

            callback(null, {
    status: newStatus,
    message: `Degree field ${newStatus} successfully`,
});
        });
    });
};


module.exports = {
    createDegreeFieldsTable,
    addDegreeField,
    getAllDegreeFields,
    editDegreeField,
    deleteDegreeField
};  