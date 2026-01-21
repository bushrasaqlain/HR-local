const express = require("express");
const router = express.Router();
const connection = require("../connection");
const authMiddleware = require("../middleware/auth");
const logAudit = require("../utils/auditLogger");

const createSpecialityTable = () => {
  const createTableQuery = `
  CREATE TABLE IF NOT EXISTS speciality (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status ENUM('active', 'inactive') DEFAULT 'active'
  )
`;

  connection.query(createTableQuery, (err) => {
    if (err) {
      return console.error("❌ Error creating Speciality table:", err.message);
    }
    console.log("✅ Speciality Table created successfully");
  });
};
const addSpeciality = (req, res) => {
  const userId = req.user?.userId;
  const { name, type, data } = req.body;

  // ---------------- CSV UPLOAD LOGIC ----------------
  if (type === "csv") {
    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: "CSV data is required" });
    }

    const values = data
      .map((row) => row.name?.trim())
      .filter((name) => name)
      .map((name) => [name]);

    if (values.length === 0) {
      return res
        .status(400)
        .json({ error: "No valid Speciality found in CSV." });
    }

    const query = "INSERT INTO speciality (name) VALUES ?";
    connection.query(query, [values], (err, result) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res
            .status(409)
            .json({ error: "Some Speciality already exist" });
        }
        return res.status(500).json({ error: "Database error" });
      }

      // Log each row
      const startId = result.insertId;
      values.forEach((row, index) => {
        logAudit({
          tableName: "dbadminhistory",
          entityType: "speciality",
          entityId: startId + index,
          action: "ADDED",
          data: { name: row[0], status: "active" },
          changedBy: userId,
        });
      });

      res.json({
        success: true,
        inserted: result.affectedRows,
        message: `${result.affectedRows} Speciality inserted successfully`,
      });
    });

    return;
  }
  if (!name) {
    return res.status(400).json({ error: "Speciality name is required" });
  }

  const checkQuery = "SELECT id FROM speciality WHERE name = ?";
  connection.query(checkQuery, [name], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });

    if (results.length > 0) {
      return res.status(409).json({ message: "Speciality already exists" });
    }

    const insertQuery = "INSERT INTO speciality (name) VALUES (?)";
    connection.query(insertQuery, [name], (err, insertResult) => {
      if (err) return res.status(500).json({ error: "Database error" });

      logAudit({
        tableName: "dbadminhistory",
        entityType: "speciality",
        entityId: insertResult.insertId,
        action: "ADDED",
        data: { name, status: "active" },
        changedBy: userId,
      });

      res.status(201).json({
        message: "Speciality added successfully",
        SpecialityId: insertResult.insertId,
      });
    });
  });
};

const getAllSpeciality = (
  { page = 1, limit = 15, name = "name", search = "", status = "active" },
  callback
) => {
  // Ensure numeric values
  page = parseInt(page, 10) || 1;
  limit = parseInt(limit, 10) || 15;
  const offset = (page - 1) * limit;

  let condition = "";
  let values = [];

  // Status filter
  if (status !== "all") {
    condition += " AND status = ?";
    values.push(status);
  }

  // Search/filter
  if (name === "name") {
    condition += " AND name LIKE ?";
    values.push(`%${search}%`);
  } else if (name === "created_at" || name === "updated_at") {
    condition += ` AND DATE(${name}) = ?`;
    values.push(search);
  }  else if (name === "status") {
    condition += " AND LOWER(status) LIKE ?";
    values.push(`%${search.toLowerCase()}%`);
}

  const query = `
    SELECT * FROM speciality
    WHERE 1=1 ${condition}
    ORDER BY id DESC
    LIMIT ? OFFSET ?
  `;
  values.push(limit, offset);

  connection.query(query, values, (err, results) => {
    if (err) return callback(err);

    const countQuery = `SELECT COUNT(*) AS total FROM speciality WHERE 1=1 ${condition}`;
    connection.query(countQuery, values.slice(0, -2), (err2, countResult) => {
      if (err2) return callback(err2);

      callback(null, {
        total: countResult[0].total,
        page,
        limit,
        speciality: results,
      });
    });
  });
};



const updateStatus = (req, res) => {
  const { id } = req.params;
  const userId = req.user?.userId;

  // Check if Speciality exists
  const checkQuery = "SELECT * FROM speciality WHERE id = ?";
  connection.query(checkQuery, [id], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (results.length === 0)
      return res.status(404).json({ error: "Speciality not found" });

    const currentSpeciality = results[0];
    // Toggle status
    const newStatus =
      currentSpeciality.status === "active" ? "inactive" : "active";

    const updateQuery = "UPDATE speciality SET status = ? WHERE id = ?";
    connection.query(updateQuery, [newStatus, id], (err2) => {
      if (err2) return res.status(500).json({ error: "Database error" });

      // Log audit
      logAudit({
        tableName: "dbadminhistory",
        entityType: "speciality",
        entityId: id,
        action: newStatus.toUpperCase(),
        data: { name: currentSpeciality.name, status: newStatus },
        changedBy: userId,
      });

      res
        .status(200)
        .json({ message: `Speciality status updated to ${newStatus}` });
    });
  });
};
const editSpeciality = (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  const userId = req.user.userId;

  if (!name) return res.status(400).json({ error: "Name is required" });

    const updateQuery = "UPDATE speciality SET name = ? WHERE id = ?";
    connection.query(updateQuery, [name, id], (err2) => {
      if (err2) return res.status(500).json({ error: "Database error" });

      logAudit({
        tableName: "dbadminhistory",
        entityType: "speciality",
        entityId: id,
        action: "UPDATED",
        data: { name, status: results[0].status },
        changedBy: userId,
      });

      res.status(200).json({ message: "Speciality updated successfully" });
    });

};
module.exports = {
  createSpecialityTable,
  addSpeciality,
  getAllSpeciality,
  updateStatus,
  editSpeciality,
};
