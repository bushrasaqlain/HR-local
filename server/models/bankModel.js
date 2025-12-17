const express = require("express");
const router = express.Router();
const connection = require("../connection");
const authMiddleware = require("../middleware/auth.js");
const logAudit = require("../utils/auditLogger");

// Create bank_names table
const createBankTable = () => {
  const createTableQuery = `
  CREATE TABLE IF NOT EXISTS bank_names (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status ENUM('active', 'inactive') DEFAULT 'active'
  )
`;

  connection.query(createTableQuery, (err) => {
    if (err) {
      return console.error("❌ Error creating bank_names table:", err.message);
    }
    console.log("✅ Bank Names Table created successfully");
  });
}


const getAllBank = ({ page, limit, name, search, status }, callback) => {
  page = parseInt(page) || 1;
  limit = parseInt(limit) || 15;
  const offset = (page - 1) * limit;

  const allowedColumns = ["name", "created_at", "updated_at"];
  if (!allowedColumns.includes(name)) name = "name";

  let condition = "";
  let values = [status];

  if (name === "name") {
    condition = " AND name LIKE ?";
    values.push(`%${search}%`);
  } else {
    condition = ` AND DATE(${name}) = ?`;
    values.push(search);
  }

  const query = `
    SELECT * FROM bank_names
    WHERE status = ? ${condition}
    ORDER BY id DESC
    LIMIT ? OFFSET ?
  `;

  values.push(limit, offset);

  connection.query(query, values, (err, results) => {
    if (err) return callback(err);

    connection.query(
      `SELECT COUNT(*) AS total FROM bank_names WHERE status = ? ${condition}`,
      values.slice(0, -2),
      (err2, countResult) => {
        if (err2) return callback(err2);

        callback(null, {
          total: countResult[0].total,
          page,
          limit,
          bank_names: results,
        });
      }
    );
  });
};



const addBank = ({ name, type, data, userId }, callback) => {

  if (type === "csv") {
    if (!Array.isArray(data) || data.length === 0) {
      return callback({ status: 400, message: "CSV data is required" });
    }

    const values = [];
    data.forEach(row => {
      const bankName = row.name?.trim();
      if (bankName) values.push([bankName]);
    });

    if (values.length === 0) {
      return callback({ status: 400, message: "No valid bank names found in CSV" });
    }

    const query = "INSERT INTO bank_names (name) VALUES ?";
    connection.query(query, [values], (err, dbRes) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return callback({ status: 409, message: "Some bank names already exist" });
        }
        return callback(err);
      }

      const startId = dbRes.insertId;
      values.forEach((row, idx) => {
        logAudit({
          tableName: "dbadminhistory",
          entityType: "bank_name",
          entityId: startId + idx,
          action: "ADDED",
          data: { name: row[0], status: "active" },
          changedBy: userId,
        });
      });

      callback(null, {
        success: true,
        inserted: dbRes.affectedRows,
        message: `${dbRes.affectedRows} bank names inserted successfully`,
      });
    });

  } else {
    if (!name) {
      return callback({ status: 400, message: "Bank name is required" });
    }

    const checkQuery = "SELECT id FROM bank_names WHERE name = ?";
    connection.query(checkQuery, [name], (err, results) => {
      if (err) return callback(err);
      if (results.length > 0) {
        return callback({ status: 409, message: "Bank name already exists" });
      }

      const insertQuery = "INSERT INTO bank_names (name) VALUES (?)";
      connection.query(insertQuery, [name], (err, insertResults) => {
        if (err) return callback(err);

        logAudit({
          tableName: "dbadminhistory",
          entityType: "bank_name",
          entityId: insertResults.insertId,
          action: "ADDED",
          data: { name, status: "active" },
          changedBy: userId,
        });

        callback(null, {
          message: "Bank name added successfully",
          bankId: insertResults.insertId,
        });
      });
    });
  }
};



const editBank=(req, res) => {
   const { id } = req.params;
  const { name } = req.body;
  const userId = req.user.userId;

  if (!name) return res.status(400).json({ error: "Name is required" });

  const checkQuery = "SELECT * FROM bank_names WHERE id = ?";
  connection.query(checkQuery, [id], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (results.length === 0) return res.status(404).json({ error: "Bank name not found" });

    const updateQuery = "UPDATE bank_names SET name = ? WHERE id = ?";
    connection.query(updateQuery, [name, id], (err2) => {
      if (err2) return res.status(500).json({ error: "Database error" });

      logAudit({
        tableName: "dbadminhistory",
        entityType: "bank_name",
        entityId: id,
        action: "UPDATED",
        data: { name, status: results[0].status },
        changedBy: userId,
      });

      res.status(200).json({ message: "Bank name updated successfully" });
    });
  });
}

const deleteBank=(req, res) => {
   const { id } = req.params;
  const userId = req.user.userId;

  const checkQuery = "SELECT * FROM bank_names WHERE id = ?";
  connection.query(checkQuery, [id], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (results.length === 0) return res.status(404).json({ error: "Bank name not found" });

    const currentBank = results[0];
    const newStatus = currentBank.status === "active" ? "inactive" : "active";

    const updateQuery = "UPDATE bank_names SET status = ? WHERE id = ?";
    connection.query(updateQuery, [newStatus, id], (err2) => {
      if (err2) return res.status(500).json({ error: "Database error" });

      logAudit({
        tableName: "dbadminhistory",
        entityType: "bank_name",
        entityId: id,
        action: newStatus.toUpperCase(),
        data: { name: currentBank.name, status: newStatus },
        changedBy: userId,
      });

      res.status(200).json({ message: `Bank name status updated to ${newStatus}` });
    });
  });
}



module.exports = {
  createBankTable,
  addBank,
  getAllBank,
  editBank,
  deleteBank
};