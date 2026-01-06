const express = require("express");
const router = express.Router();
const connection = require("../connection");
const authMiddleware = require("../middleware/auth");
const logAudit = require("../utils/auditLogger");

const createDistrictsTable =()=>{
const createTableQuery = `
  CREATE TABLE IF NOT EXISTS districts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    country_id INT NOT NULL,
    UNIQUE KEY unique_district (name, country_id),
    FOREIGN KEY (country_id) REFERENCES countries(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status ENUM('active', 'inactive') DEFAULT 'active'
  )
`;

connection.query(createTableQuery, function (err) {
  if (err) {
    return console.error(err.message);
  }
  console.log("✅ District Table created successfully");
});
}

const addDistrict = (req, res) => {
 const userId = req.user.userId;
  const { name, country_id, type, data } = req.body;

  if (type === "csv") {
    if (!country_id) {
      return res.status(400).json({ error: "country_id is required for CSV import" });
    }
    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: "CSV data is required" });
    }

    const districts = [];
    data.forEach((row) => {
      const districtName = row.name?.trim();
      if (districtName) {
        districts.push([districtName, country_id]);
      }
    });

    if (districts.length === 0) {
      return res.status(400).json({ error: "No valid districts found in CSV." });
    }

    const query = "INSERT INTO districts (name, country_id) VALUES ?";
    connection.query(query, [districts], (err, dbRes) => {
      if (err) {
        console.error("❌ Error inserting CSV districts:", err);
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({ error: "Some districts already exist" });
        }
        return res.status(500).json({ error: "Database error" });
      }

      const startId = dbRes.insertId;
      districts.forEach((row, idx) => {
        const districtName = row[0];
        const districtId = startId + idx;

        logAudit({
          tableName: "dbadminhistory",
          entityType: "district",
          entityId: districtId,
          action: "ADDED",
          data: { name: districtName, country_id, status: "active" },
          changedBy: userId,
        });
      });

      res.json({
        success: true,
        inserted: dbRes.affectedRows,
        message: `${dbRes.affectedRows} districts inserted successfully`,
      });
    });
  } else {
    // Single insert
    if (!name || !country_id) {
      return res.status(400).json({ error: "District name and country_id are required" });
    }

    const checkQuery = "SELECT id FROM districts WHERE name = ? AND country_id = ?";
    connection.query(checkQuery, [name, country_id], (err, results) => {
      if (err) {
        console.error("❌ Error checking district:", err);
        return res.status(500).json({ error: "Database error" });
      }

      if (results.length > 0) {
        return res.status(409).json({ message: "District already exists" });
      }

      const insertQuery = "INSERT INTO districts (name, country_id) VALUES (?, ?)";
      connection.query(insertQuery, [name, country_id], (err, insertResults) => {
        if (err) {
          console.error("❌ Error inserting district:", err);
          return res.status(500).json({ error: "Database error" });
        }

        const districtId = insertResults.insertId;
        logAudit({
          tableName: "dbadminhistory",
          entityType: "district",
          entityId: districtId,
          action: "ADDED",
          data: { name, country_id, status: "active" },
          changedBy: userId,
        });

        res.status(201).json({
          message: "District added successfully",
          districtId,
        });
      });
    });
  }
}

const editDistrict = (req, res) => {
 const { id } = req.params;
  const { name, country_id } = req.body;
  const userId = req.user.userId;

  if (!name || !country_id) {
    return res.status(400).json({ error: "District name and country_id are required" });
  }

  const checkQuery = "SELECT * FROM districts WHERE id = ?";
  connection.query(checkQuery, [id], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (results.length === 0) return res.status(404).json({ error: "District not found" });

    const updateQuery = "UPDATE districts SET name = ?, country_id = ? WHERE id = ?";
    connection.query(updateQuery, [name, country_id, id], (err2) => {
      if (err2) return res.status(500).json({ error: err2});

      logAudit({
        tableName: "dbadminhistory",
        entityType: "district",
        entityId: id,
        action: "UPDATED",
        data: { name, country_id, status: results[0].status },
        changedBy: userId,
      });

      res.status(200).json({ message: "District updated successfully" });
    });
  });
}

const getAllDistricts = (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 15;
  const offset = (page - 1) * limit;
  const name = req.query.name || "name";
  const search = req.query.search || "";
  const countryId = req.query.country_id
    ? parseInt(req.query.country_id)
    : null;
  const status = req.query.status || "active";

  // ✅ whitelist to avoid SQL injection
  const validColumns = ["name", "country"];
  if (!validColumns.includes(name)) {
    return res.status(400).json({ error: "Invalid column name" });
  }

  const filterColumn = name === "country" ? "c.name" : "d.name";

  let query = `
    SELECT d.*, c.name AS country_name
    FROM districts d
    JOIN countries c ON d.country_id = c.id
    WHERE ${filterColumn} LIKE ?
  `;

  let countQuery = `
    SELECT COUNT(*) AS total
    FROM districts d
    JOIN countries c ON d.country_id = c.id
    WHERE ${filterColumn} LIKE ?
  `;

  let queryValues = [`%${search}%`];
  let countValues = [`%${search}%`];

  // ✅ Apply status filter only if not "all"
  if (status !== "all") {
    query += ` AND d.status = ?`;
    countQuery += ` AND d.status = ?`;
    queryValues.push(status);
    countValues.push(status);
  }

  // ✅ Country filter
  if (countryId) {
    query += ` AND d.country_id = ?`;
    countQuery += ` AND d.country_id = ?`;
    queryValues.push(countryId);
    countValues.push(countryId);
  }

  // ✅ Pagination
  query += ` ORDER BY d.id DESC LIMIT ? OFFSET ?`;
  queryValues.push(limit, offset);

  connection.query(query, queryValues, (err, results) => {
    if (err) {
      console.error("❌ Error fetching districts:", err.sqlMessage || err);
      return res.status(500).json({ error: "Database error" });
    }

    connection.query(countQuery, countValues, (err2, countResult) => {
      if (err2) {
        console.error("❌ Count query error:", err2.sqlMessage || err2);
        return res.status(500).json({ error: "Database error" });
      }

      res.status(200).json({
        total: countResult[0].total,
        page,
        limit,
        districts: results,
      });
    });
  });
};


const deleteDistrict = (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  const checkQuery = "SELECT * FROM districts WHERE id = ?";
  connection.query(checkQuery, [id], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (results.length === 0) return res.status(404).json({ error: "District not found" });

    const currentDistrict = results[0];
    const newStatus = currentDistrict.status === "active" ? "inactive" : "active";

    const updateQuery = "UPDATE districts SET status = ? WHERE id = ?";
    connection.query(updateQuery, [newStatus, id], (err2) => {
      if (err2) return res.status(500).json({ error: "Database error" });

      logAudit({
        tableName: "dbadminhistory",
        entityType: "district",
        entityId: id,
        action: newStatus.toUpperCase(),
        data: { name: currentDistrict.name, country_id: currentDistrict.country_id, status: newStatus },
        changedBy: userId,
      });

      res.status(200).json({ message: `District status updated to ${newStatus}` });
    });
  });
}
module.exports = {
    createDistrictsTable,
    addDistrict,
    editDistrict,
    getAllDistricts,
    deleteDistrict
};