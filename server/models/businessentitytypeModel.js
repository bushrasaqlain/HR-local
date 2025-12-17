const express = require("express");
const router = express.Router();
const connection = require("../connection.js");
const authMiddleware = require("../middleware/auth.js");
const logAudit = require("../utils/auditLogger.js");

const createbusiness_entity_typeTable =()=>{
const createTableQuery = `
  CREATE TABLE IF NOT EXISTS business_entity_type (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status ENUM('active', 'inactive') DEFAULT 'active'
  )
`;

connection.query(createTableQuery, (err) => {
  if (err) console.error(err.message);
  else console.log("Business Entity Type table created successfully");
});
}

const addBusinessEntityType = (req, res) => {
 const { name, type, data } = req.body;
  const userId = req.user.userId;

  if (type === "csv") {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: "CSV data is required" });
    }

    const results = data
      .map((row) => row.name?.trim())
      .filter(Boolean)
      .map((n) => [n]);

    if (results.length === 0) {
      return res.status(400).json({ error: "No valid business entity types found in CSV." });
    }

    const query = "INSERT INTO business_entity_type (name) VALUES ?";
    connection.query(query, [results], (err, dbRes) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({ error: "Some business entity types already exist" });
        }
        return res.status(500).json({ error: "Database error" });
      }

      const startId = dbRes.insertId;
      results.forEach((row, idx) => {
        const entityId = startId + idx;
        logAudit({
          tableName: "dbadminhistory",
          entityType: "business_entity_type",
          entityId,
          action: "ADDED",
          data: { name: row[0], status: "active" },
          changedBy: userId,
        });
      });

      res.json({
        success: true,
        inserted: dbRes.affectedRows,
        message: `${dbRes.affectedRows} business entity types inserted successfully`,
      });
    });
  } else {
    if (!name) return res.status(400).json({ error: "Name is required" });

    const checkQuery = "SELECT id FROM business_entity_type WHERE name = ?";
    connection.query(checkQuery, [name], (err, results) => {
      if (err) return res.status(500).json({ error: "Database error" });

      if (results.length > 0) {
        return res.status(409).json({ message: "Business entity type already exists" });
      }

      const insertQuery = "INSERT INTO business_entity_type (name) VALUES (?)";
      connection.query(insertQuery, [name], (err, insertResults) => {
        if (err) return res.status(500).json({ error: "Database error" });

        logAudit({
          tableName: "dbadminhistory",
          entityType: "business_entity_type",
          entityId: insertResults.insertId,
          action: "ADDED",
          data: { name, status: "active" },
          changedBy: userId,
        });

        res.status(201).json({
          message: "Business entity type added successfully",
          id: insertResults.insertId,
        });
      });
    });
  }
}

const getAllbusinessentitytype = (
  { page = 1, limit = 15, name = "name", search = "", status = "active" },
  callback
) => {
  // Ensure numbers
  page = parseInt(page, 10);
  limit = parseInt(limit, 10);
  const offset = (page - 1) * limit;

  const query = `
    SELECT * FROM business_entity_type
    WHERE status = ? AND ${name} LIKE ?
    ORDER BY id DESC
    LIMIT ? OFFSET ?
  `;
  const values = [status, `%${search}%`, limit, offset];

  connection.query(query, values, (err, results) => {
    if (err) return callback(err);

    const countQuery = `
      SELECT COUNT(*) AS total 
      FROM business_entity_type 
      WHERE status = ? AND ${name} LIKE ?
    `;
    connection.query(countQuery, [status, `%${search}%`], (err2, countResult) => {
      if (err2) return callback(err2);

      callback(null, {
        total: countResult[0].total,
        page,
        limit,
        business_types: results,
      });
    });
  });
};


  const deletebusinessentitytype = (req, res) => {
     const { id } = req.params;
  const userId = req.user.userId;

  const checkQuery = "SELECT * FROM business_entity_type WHERE id = ?";
  connection.query(checkQuery, [id], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (results.length === 0) return res.status(404).json({ error: "Business entity type not found" });

    const current = results[0];
    const newStatus = current.status === "active" ? "inactive" : "active";

    const updateQuery = "UPDATE business_entity_type SET status = ? WHERE id = ?";
    connection.query(updateQuery, [newStatus, id], (err2) => {
      if (err2) return res.status(500).json({ error: "Database error" });

      logAudit({
        tableName: "dbadminhistory",
        entityType: "business_entity_type",
        entityId: id,
        action: newStatus.toUpperCase(),
        data: { name: current.name, status: newStatus },
        changedBy: userId,
      });

      res.status(200).json({ message: `Business entity type status updated to ${newStatus}` });
    });
  });
}

const editbusinessentitytype = (req, res) => {
   const { id } = req.params;
    const { name } = req.body;
    const userId = req.user.userId;
  
    if (!name) return res.status(400).json({ error: "Name is required" });
  
    const checkQuery = "SELECT * FROM business_entity_type WHERE id = ?";
    connection.query(checkQuery, [id], (err, results) => {
      if (err) return res.status(500).json({ error: "Database error" });
      if (results.length === 0) return res.status(404).json({ error: "Business entity type not found" });
  
      const updateQuery = "UPDATE business_entity_type SET name = ? WHERE id = ?";
      connection.query(updateQuery, [name, id], (err2) => {
        if (err2) return res.status(500).json({ error: "Database error" });
  
        logAudit({
          tableName: "dbadminhistory",
          entityType: "business_entity_type",
          entityId: id,
          action: "UPDATED",
          data: { status: results[0].status, name },
          changedBy: userId,
        });
  
        res.status(200).json({ message: "Business entity type updated successfully" });
      });
    });
  }

  module.exports = {
   createbusiness_entity_typeTable,
   addBusinessEntityType,
   getAllbusinessentitytype,
   deletebusinessentitytype,
   editbusinessentitytype,
};