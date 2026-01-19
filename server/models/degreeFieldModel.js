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


const addDegreeField = ({ name, t_id, type, data, userId }, callback) => {
  if (type === "csv") {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return callback({ status: 400, message: "CSV data is required" });
    }

    const rows = data
      .map((row) => row.name?.trim())
      .filter((fieldName) => fieldName)
      .map((fieldName) => [fieldName, t_id]);

    if (rows.length === 0) return callback({ status: 400, message: "No valid degree fields found in CSV." });

    const query = "INSERT INTO degreefields (name, degree_type_id) VALUES ?";
    connection.query(query, [rows], (err, dbRes) => {
      if (err) return callback({ status: 500, message: "Database error" });

      const startId = dbRes.insertId;
      rows.forEach((row, idx) => {
        logAudit({
          tableName: "dbadminhistory",
          entityType: "degreefield",
          entityId: startId + idx,
          action: "ADDED",
          data: { name: row[0], degree_type_id: t_id, status: "Active" },
          changedBy: userId,
        });
      });

      callback(null, { inserted: dbRes.affectedRows });
    });

  } else {
    // Single field add
    const checkQuery = "SELECT id FROM degreefields WHERE name = ? AND degree_type_id = ?";
    connection.query(checkQuery, [name, t_id], (err, results) => {
      if (err) return callback({ status: 500, message: "Database error" });
      if (results.length > 0) return callback({ status: 409, message: "Degree field already exists" });

      const insertQuery = "INSERT INTO degreefields (name, degree_type_id) VALUES (?, ?)";
      connection.query(insertQuery, [name, t_id], (err, insertResults) => {
        if (err) return callback({ status: 500, message: "Database error" });

        logAudit({
          tableName: "dbadminhistory",
          entityType: "degreefield",
          entityId: insertResults.insertId,
          action: "ADDED",
          data: { name, degree_type_id: t_id, status: "Active" },
          changedBy: userId,
        });

        callback(null, { id: insertResults.insertId });
      });
    });
  }
};



const getAllDegreeFields = (
  { page = 1, limit = 0, column = "name", search = "", status = "all", degree_type_id },
  callback
) => {
  page = parseInt(page);
  limit = parseInt(limit);
  const offset = (page - 1) * limit;

  const allowedColumns = ["name", "created_at", "updated_at"];
  if (!allowedColumns.includes(column)) column = "name";

  const conditions = [];
  const params = [];

  // ✅ Search filter
  if (search) {
    const searchColumn =
      column === "created_at" || column === "updated_at"
        ? `DATE(d.${column})`
        : `d.${column}`;
    conditions.push(`${searchColumn} LIKE ?`);
    params.push(`%${search}%`);
  }

  // ✅ Status filter
  if (status !== "all") {
    conditions.push("d.status = ?");
    params.push(status);
  }

  // ✅ Degree type filter
  if (degree_type_id) {
    conditions.push("d.degree_type_id = ?");
    params.push(degree_type_id);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  // ✅ Main query
  const query = `
    SELECT d.*
    FROM degreefields d
    ${whereClause}
    ORDER BY d.id DESC
    ${limit > 0 ? "LIMIT ? OFFSET ?" : ""}
  `;
  const queryValues = limit > 0 ? [...params, limit, offset] : params;

  connection.query(query, queryValues, (err, results) => {
    if (err) return callback(err);

    // ✅ Count query
    const countQuery = `SELECT COUNT(*) AS total FROM degreefields d ${whereClause}`;
    connection.query(countQuery, params, (err2, count) => {
      if (err2) return callback(err2);

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

module.exports = { editDegreeField };

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


module.exports = {
    createDegreeFieldsTable,
    addDegreeField,
    getAllDegreeFields,
    editDegreeField,
    deleteDegreeField
};  