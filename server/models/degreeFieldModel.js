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
    status ENUM('Active', 'InActive') DEFAULT 'Active',
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
const addDegreeField = (req, callback) => {
  const userId = req.user.userId;
  const { name, t_id, type, data } = req.body;

  if (type === "csv") {
    if (!t_id) return callback(new Error("degree type is required for CSV import"));
    if (!Array.isArray(data) || data.length === 0)
      return callback(new Error("CSV data is required"));

    const degreefield = [];
    data.forEach(row => {
      const degreefieldName = row.name?.trim();
      if (degreefieldName) {
        degreefield.push([degreefieldName, t_id]);
      }
    });

    if (degreefield.length === 0)
      return callback(new Error("No valid degreefield found in CSV"));

    const query = "INSERT INTO degreefields (name, degree_type_id) VALUES ?";
    connection.query(query, [degreefield], (err, dbRes) => {
      if (err) return callback(err);

      const startId = dbRes.insertId;
      degreefield.forEach((row, idx) => {
        logAudit({
          tableName: "dbadminhistory",
          entityType: "degreefield",
          entityId: startId + idx,
          action: "ADDED",
          data: { name: row[0], t_id, status: "active" },
          changedBy: userId,
        });
      });

      callback(null, {
        inserted: dbRes.affectedRows,
        message: `${dbRes.affectedRows} degreefield inserted successfully`,
      });
    });
  } else {
    if (!name || !t_id)
      return callback(new Error("degreefield name and degree type are required"));

    const checkQuery =
      "SELECT id FROM degreefields WHERE name = ? AND degree_type_id = ?";
    connection.query(checkQuery, [name, t_id], (err, results) => {
      if (err) return callback(err);
      if (results.length > 0)
        return callback(new Error("degreefield already exists"));

      const insertQuery =
        "INSERT INTO degreefields (name, degree_type_id) VALUES (?, ?)";
      connection.query(insertQuery, [name, t_id], (err, insertResults) => {
        if (err) return callback(err);

        logAudit({
          tableName: "dbadminhistory",
          entityType: "degreefield",
          entityId: insertResults.insertId,
          action: "ADDED",
          data: { name, t_id, status: "active" },
          changedBy: userId,
        });

        callback(null, { degreefieldId: insertResults.insertId });
      });
    });
  }
};

const getAllDegreeFields = (
  { page = 1, limit = 15, name = "name", search = "", status = "all" },
  callback
) => {
  page = parseInt(page);
  limit = parseInt(limit);
  const offset = (page - 1) * limit;
  const allowedColumns = ["name", "created_at", "updated_at", "status"];
  if (!allowedColumns.includes(name)) {
    name = "name";
  }

  const whereConditions = [];
  const values = [];

  // Status filter
  if (status && status !== "all") {
    whereConditions.push("d.status = ?");
    values.push(status);
  }

  // Search filter
  if (search && search.trim() !== "") {
    if (name === "created_at" || name === "updated_at") {
      whereConditions.push(`DATE(d.${name}) = ?`);
      values.push(search);
    } else if (name === "status") {
      whereConditions.push("LOWER(d.status) LIKE ?");
      values.push(`%${search.toLowerCase()}%`);
    } else {
      whereConditions.push(`d.${name} LIKE ?`);
      values.push(`%${search}%`);
    }
  }

  const whereClause =
    whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

  // Main query with pagination
  const query = `
    SELECT 
      d.*,
      dt.name AS degree_type_name
    FROM degreefields d
    LEFT JOIN degreetypes dt ON dt.id = d.degree_type_id
    ${whereClause}
    ORDER BY d.id DESC
    LIMIT ? OFFSET ?
  `;

  connection.query(query, [...values, limit, offset], (err, results) => {
    if (err) {
      console.error("Query Error:", err);
      return callback(err);
    }

    // Count query with same WHERE conditions
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM degreefields d
      LEFT JOIN degreetypes dt ON dt.id = d.degree_type_id
      ${whereClause}
    `;

    connection.query(countQuery, values, (err2, count) => {
      if (err2) {
        console.error("Count Query Error:", err2);
        return callback(err2);
      }

      callback(null, {
        total: count[0].total,
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

const deleteDegreeField = (id, userId, callback) => {
    const checkQuery = "SELECT * FROM degreefields WHERE id = ?";
    connection.query(checkQuery, [id], (err, results) => {
        if (err) return callback({ status: 500, message: "Database error" });

        if (results.length === 0) return callback({ status: 404, message: "Degree field not found" });

        const current = results[0];
        const newStatus = current.status === "Active" ? "InActive" : "Active";

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
const getDegreeFieldsDropdown = ({ degree_type_id, search = "", status = "Active" }, callback) => {
};


module.exports = {
    createDegreeFieldsTable,
    addDegreeField,
    getAllDegreeFields,
    editDegreeField,
    deleteDegreeField,
    getDegreeFieldsDropdown
};  