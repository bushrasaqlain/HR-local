const express = require("express");
const router = express.Router();
const connection = require("../connection");
const authMiddleware = require("../middleware/auth");
const logAudit = require("../utils/auditLogger");

const createCitiesTable = () => {
  const createTableQuery = `
  CREATE TABLE IF NOT EXISTS cities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    district_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    UNIQUE KEY unique_city (district_id, name),
    FOREIGN KEY (district_id) REFERENCES districts(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status ENUM('active','inactive') DEFAULT 'active'
  )
`;

  connection.query(createTableQuery, (err) => {
    if (err)
      return console.error("❌ Error creating cities table:", err.message);
    console.log("✅ Cities table created successfully");
  });
};

const addCity = (req, res) => {
  const userId = req.user.userId;
  const { name, district_id, type, data } = req.body;

  if (type === "csv") {
    if (!district_id)
      return res
        .status(400)
        .json({ error: "district_id is required for CSV import" });
    if (!data || !Array.isArray(data) || data.length === 0)
      return res.status(400).json({ error: "CSV data is required" });

    // Get country_id of the district
    const districtQuery = "SELECT country_id FROM districts WHERE id = ?";
    connection.query(districtQuery, [district_id], (err, districtResults) => {
      if (err) return res.status(500).json({ error: "Database error" });
      if (districtResults.length === 0)
        return res.status(404).json({ error: "District not found" });

      const country_id = districtResults[0].country_id;

      const cities = data
        .map((row) => row.name?.trim())
        .filter((cityName) => cityName)
        .map((cityName) => [district_id, cityName]);

      if (cities.length === 0)
        return res.status(400).json({ error: "No valid cities found in CSV." });

      const query = "INSERT INTO cities (district_id, name) VALUES ?";
      connection.query(query, [cities], (err2, dbRes) => {
        if (err2) {
          console.error("❌ Error inserting CSV cities:", err2);
          if (err2.code === "ER_DUP_ENTRY")
            return res
              .status(409)
              .json({ error: "Some cities already exist in this district" });
          return res.status(500).json({ error: "Database error" });
        }

        const startId = dbRes.insertId;
        cities.forEach((row, idx) => {
          logAudit({
            tableName: "dbadminhistory",
            entityType: "city",
            entityId: startId + idx,
            action: "ADDED",
            data: { name: row[1], status: "active", district_id, country_id },
            changedBy: userId,
          });
        });

        res.json({
          success: true,
          inserted: dbRes.affectedRows,
          message: `${dbRes.affectedRows} cities inserted successfully`,
        });
      });
    });
  } else {
    if (!name || !district_id) {
      return res
        .status(400)
        .json({ error: "City name and district_id are required" });
    }

    // ✅ Fetch district to get country_id
    const districtQuery = "SELECT country_id FROM districts WHERE id = ?";
    connection.query(districtQuery, [district_id], (err, districtResults) => {
      if (err) return res.status(500).json({ error: "Database error" });
      if (districtResults.length === 0)
        return res.status(404).json({ error: "District not found" });

      const country_id = districtResults[0].country_id;

      const checkQuery =
        "SELECT id FROM cities WHERE name = ? AND district_id = ?";
      connection.query(checkQuery, [name, district_id], (err2, results) => {
        if (err2) return res.status(500).json({ error: "Database error" });
        if (results.length > 0)
          return res
            .status(409)
            .json({ message: "City already exists in this district" });

        const insertQuery =
          "INSERT INTO cities (district_id, name) VALUES (?, ?)";
        connection.query(
          insertQuery,
          [district_id, name],
          (err3, insertResults) => {
            if (err3) return res.status(500).json({ error: "Database error" });

            logAudit({
              tableName: "dbadminhistory",
              entityType: "city",
              entityId: insertResults.insertId,
              action: "ADDED",
              data: { name, status: "active", district_id, country_id },
              changedBy: userId,
            });

            res.status(201).json({
              success: true,
              message: "City added successfully",
              cityId: insertResults.insertId,
              district_id,
              country_id,
            });
          }
        );
      });
    });
  }
};

const getAllCities = ({ page, limit, name, search, status }, callback) => {
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 15;
  const offset = (pageNum - 1) * limitNum;

  let condition = "AND c.name LIKE ?";
  let values = [status];
  if (name === "district") {
    condition = "AND d.name LIKE ?";
    values.push(`%${search}%`);
  } else if (name === "country") {
    condition = "AND co.name LIKE ?";
    values.push(`%${search}%`);
  } else if (name === "created_at" || name === "updated_at") {
    condition = `AND DATE(c.${name}) = ?`;
    values.push(search);
  } else {
    values.push(`%${search}%`);
  }

  const query = `
    SELECT c.*, d.name AS district_name, co.name AS country_name, co.id AS country_id
    FROM cities c
    JOIN districts d ON c.district_id = d.id
    JOIN countries co ON d.country_id = co.id
    WHERE c.status = ? ${condition}
    ORDER BY c.id DESC
    LIMIT ? OFFSET ?
  `;
  values.push(limitNum, offset);

  connection.query(query, values, (err, results) => {
    if (err) return callback(err);

    const countQuery = `
      SELECT COUNT(*) AS total 
      FROM cities c
      JOIN districts d ON c.district_id = d.id
      JOIN countries co ON d.country_id = co.id
      WHERE c.status = ? ${condition}
    `;

    connection.query(countQuery, values.slice(0, -2), (err2, countResult) => {
      if (err2) return callback(err2);

      callback(null, {
        success: true,
        total: countResult[0].total,
        page: pageNum,
        limit: limitNum,
        cities: results,
      });
    });
  });
};

const getCitiesByDistrict = (district_id, reqquery, callback) => {
  const districtId = district_id;
  const page = parseInt(reqquery.page) || 1;
  const limit = parseInt(reqquery.limit) || 15;
  const offset = (page - 1) * limit;
  const search = reqquery.search || "";

  const query = `
    SELECT ci.*, d.name AS district_name, c.name AS country_name 
    FROM cities ci
    JOIN districts d ON ci.district_id = d.id
    JOIN countries c ON d.country_id = c.id
    WHERE ci.district_id = ? AND ci.name LIKE ?
    ORDER BY ci.id DESC
    LIMIT ? OFFSET ?
  `;

  const countQuery = `
    SELECT COUNT(*) AS total 
    FROM cities 
    WHERE district_id = ? AND name LIKE ?
  `;

  connection.query(
    query,
    [districtId, `%${search}%`, limit, offset],
    (err, results) => {
      if (err) {
        console.error("❌ Error fetching cities:", err);
        return callback(err);
      }

      connection.query(
        countQuery,
        [districtId, `%${search}%`],
        (err2, countResult) => {
          if (err2) {
            console.error("❌ Count query error:", err2);
            return callback(err2);
          }

          callback(null, {
            success: true,
            total: countResult[0].total,
            cities: results,
            page,
            limit,
          });
        }
      );
    }
  );
};

const editCity = (req, res) => {
  const { id } = req.params;
  const { name, district_id } = req.body;
  const userId = req.user.userId;

  if (!name || !district_id)
    return res.status(400).json({ error: "Name and district_id are required" });

  const checkQuery = "SELECT * FROM cities WHERE id = ?";
  connection.query(checkQuery, [id], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (results.length === 0)
      return res.status(404).json({ error: "City not found" });

    const updateQuery =
      "UPDATE cities SET name = ?, district_id = ? WHERE id = ?";
    connection.query(updateQuery, [name, district_id, id], (err2) => {
      if (err2) return res.status(500).json({ error: "Database error" });

      logAudit({
        tableName: "dbadminhistory",
        entityType: "city",
        entityId: id,
        action: "UPDATED",
        data: { status: results[0].status, name },
        changedBy: userId,
      });

      res
        .status(200)
        .json({ success: true, message: "City updated successfully" });
    });
  });
};

const deleteCity = (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  const checkQuery = "SELECT * FROM cities WHERE id = ?";
  connection.query(checkQuery, [id], (err, results) => {
    if (err) {
      console.error("Main Query Error:", err); // 👈 log error
      return res.status(500).json({ error: "Database error" });
    }
    if (results.length === 0)
      return res.status(404).json({ error: "City not found" });

    const currentCity = results[0];
    const newStatus = currentCity.status === "active" ? "inactive" : "active";

    const updateQuery = "UPDATE cities SET status = ? WHERE id = ?";
    connection.query(updateQuery, [newStatus, id], (err2) => {
      if (err2) {
        console.error("Count Query Error:", err2); // 👈 log error
        return res.status(500).json({ error: "Database error" });
      }
      logAudit({
        tableName: "dbadminhistory",
        entityType: "city",
        entityId: id,
        action: newStatus.toUpperCase(), // ACTIVE / INACTIVE
        data: { name: currentCity.name, status: newStatus },
        changedBy: userId,
      });

      res.status(200).json({ message: `City status updated to ${newStatus}` });
    });
  });
};

module.exports = {
  createCitiesTable,
  getAllCities,
  addCity,
  getCitiesByDistrict,
  editCity,
  deleteCity,
};
