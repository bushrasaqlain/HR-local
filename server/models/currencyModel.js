const express = require("express");
const router = express.Router();
const connection = require("../connection");
const authMiddleware = require("../middleware/auth.js");
const logAudit = require("../utils/auditLogger");


const createCurrenciesTable = () => {
const createTableQuery = `
  CREATE TABLE IF NOT EXISTS currencies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(10) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status ENUM('active', 'inactive') DEFAULT 'active'
  )
`;

connection.query(createTableQuery, (err) => {
  if (err) {
    return console.error("❌ Error creating currencies table:", err.message);
  }
  console.log("✅ Currencies Table created successfully");
});
}

const addCurrency =  (req, res) => {
 const userId = req.user.userId;
  const { name, type, data } = req.body;

  if (type === "csv") {
    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: "CSV data is required" });
    }

    const results = [];
    data.forEach((row) => {
      const code = row.name?.trim(); // 👈 FIXED: use code instead of name
      if (code) {
        results.push([code]);
      }
    });

    if (results.length === 0) {
      return res.status(400).json({ error: "No valid currency found in CSV." });
    }

    const query = "INSERT INTO currencies (code) VALUES ?";
    connection.query(query, [results], (err, dbRes) => {
      if (err) {
        console.error("❌ Error inserting CSV currencies:", err);

        if (err.code === "ER_DUP_ENTRY") {
          return res
            .status(409)
            .json({ error: "Some currencies already exist in the database" });
        }
        return res.status(500).json({ error: "Database error" });
      }

      const startId = dbRes.insertId;
      results.forEach((row, idx) => {
        const code = row[0];
        const currencyId = startId + idx;

        logAudit({
          tableName: "dbadminhistory",
          entityType: "currency",
          entityId: currencyId,
          action: "ADDED",
          data: { code, status: "active" },
          changedBy: userId,
        });
      });

      res.json({
        success: true,
        inserted: dbRes.affectedRows,
        message: `${dbRes.affectedRows} currencies inserted successfully`,
      });
    });
  } else {
    if (!name) {
      return res.status(400).json({ error: "Currency code is required" });
    }

    const checkQuery = "SELECT id FROM currencies WHERE code = ?";
    connection.query(checkQuery, [name], (err, results) => {
      if (err) {
        console.error("Error checking currency:", err);
        return res.status(500).json({ error: "Database error" });
      }

      if (results.length > 0) {
        return res.status(409).json({ message: "Currency already exists" });
      }

      const insertQuery = "INSERT INTO currencies (code) VALUES (?)";
      connection.query(insertQuery, [name], (err, insertResults) => {
        if (err) {
          console.error("Error inserting currency:", err);
          return res.status(500).json({ error: "Database error" });
        }

        const currencyId = insertResults.insertId;

        logAudit({
          tableName: "dbadminhistory",
          entityType: "currency",
          entityId: currencyId,
          action: "ADDED",
          data: { code: name, status: "active" },
          changedBy: userId,
        });

        res.status(201).json({
          message: "Currency added successfully",
          currencyId,
        });
      });
    });
  }
}

const getAllCurrency = (
  { page = 1, limit = 15, name = "code", search = "", status = "active" },
  callback
) => {
  // ✅ Ensure page and limit are numbers
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 15;
  const offset = (pageNum - 1) * limitNum;

  // ✅ Whitelist columns for search
  const allowedColumns = ["code", "name", "status", "created_at", "updated_at"];
  if (!allowedColumns.includes(name)) name = "code";

  const whereConditions = [];
  const values = [];

  // ✅ Status filter (only if not "all")
  if (status && status !== "all") {
    whereConditions.push("status = ?");
    values.push(status);
  }

  // ✅ Search filter
  if (search) {
    if (name === "created_at" || name === "updated_at") {
      whereConditions.push(`DATE(${name}) = ?`);
      values.push(search);
    } else if (name === "status") {
      // case-insensitive status search
      whereConditions.push("LOWER(status) LIKE ?");
      values.push(`%${search.toLowerCase()}%`);
    } else {
      // code or name columns
      whereConditions.push(`${name} LIKE ?`);
      values.push(`%${search}%`);
    }
  }

  const whereClause = whereConditions.length > 0
    ? `WHERE ${whereConditions.join(" AND ")}`
    : "";

  // ✅ Main query
  const query = `
    SELECT *
    FROM currencies
    ${whereClause}
    ORDER BY id DESC
    LIMIT ? OFFSET ?
  `;
  const queryValues = [...values, limitNum, offset];

  // ✅ Count query for pagination
  const countQuery = `
    SELECT COUNT(*) AS total
    FROM currencies
    ${whereClause}
  `;

  connection.query(query, queryValues, (err, results) => {
    if (err) return callback(err);

    connection.query(countQuery, values, (err2, countResult) => {
      if (err2) return callback(err2);

      callback(null, {
        total: countResult[0].total,
        page: pageNum,
        limit: limitNum,
        currencies: results,
      });
    });
  });
};



const deleteCurrency = (req, res) => {
const { id } = req.params;
  const userId = req.user.userId;

  const checkQuery = "SELECT * FROM currencies WHERE id = ?";
  connection.query(checkQuery, [id], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (results.length === 0) return res.status(404).json({ error: "Currency not found" });

    const currentCurrency = results[0];
    const newStatus = currentCurrency.status === "active" ? "inactive" : "active";

    const updateQuery = "UPDATE currencies SET status = ? WHERE id = ?";
    connection.query(updateQuery, [newStatus, id], (err2) => {
      if (err2) return res.status(500).json({ error: "Database error" });

      logAudit({
        tableName: "dbadminhistory",
        entityType: "currency",
        entityId: id,
        action: newStatus.toUpperCase(),
        data: { code: currentCurrency.code, status: newStatus },
        changedBy: userId,
      });

      res.status(200).json({ message: `Currency status updated to ${newStatus}` });
    });
  });
}
const editCurrency = (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  const userId = req.user.userId;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Currency code is required" });
  }

  // Check if currency exists
  const checkQuery = "SELECT * FROM currencies WHERE id = ?";
  connection.query(checkQuery, [id], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error", details: err });
    if (results.length === 0) return res.status(404).json({ error: "Currency not found" });

    // Update currency
    const updateQuery = "UPDATE currencies SET code = ? WHERE id = ?";
    connection.query(updateQuery, [name.trim(), id], (err2) => {
      if (err2) return res.status(500).json({ error: "Database error", details: err2 });

      // Log audit (optional: wrap in try/catch)
      try {
        logAudit({
          tableName: "dbadminhistory",
          entityType: "currency",
          entityId: id,
          action: "UPDATED",
          data: { code: name.trim(), status: results[0].status },
          changedBy: userId,
        });
      } catch (auditErr) {
        console.error("Audit logging failed", auditErr);
      }

      res.status(200).json({ message: "Currency updated successfully" });
    });
  });
};

const getAllCurrenciesinPayment = (req, res) => {
  const query = `
    SELECT id, code
    FROM currencies
    WHERE status = 'active'
    ORDER BY code ASC
  `;

  connection.query(query, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error" });
    }

    res.json({
      success: true,
      currencies: results,
    });
  });
};


module.exports = {
  createCurrenciesTable,
  addCurrency,
  getAllCurrency,
  deleteCurrency,
  editCurrency,
  getAllCurrenciesinPayment
};
