const connection = require("../connection");
const logAudit = require("../utils/auditLogger");

const createCountriesTable = () => {
  const createTableQuery = `
  CREATE TABLE IF NOT EXISTS countries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status ENUM('active', 'inactive') DEFAULT 'active'
  )
`;

  // Execute the query to create the table
  connection.query(createTableQuery, function (err, results, fields) {
    if (err) {
      return console.error(err.message);
    }
    console.log("✅Countries Table created successfully");
  });
};

const addCountry = (req, res) => {
  const userId = req.user.userId; // from JWT
  const { name, type, data } = req.body;

  // === CSV BULK INSERT ===
  if (type === "csv") {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: "CSV data is required" });
    }

    const results = [];
    data.forEach((row) => {
      const country = row.name?.trim();
      if (country) results.push([country]);
    });

    if (results.length === 0) {
      return res.status(400).json({ error: "No valid country found in CSV." });
    }

    const query = "INSERT INTO countries (name) VALUES ?";
    connection.query(query, [results], (err, dbRes) => {
      if (err) {
        console.error("❌ Error inserting CSV countries:", err);
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({
            error: "Some countries already exist in the database",
          });
        }
        return res.status(500).json({ error: "Database error" });
      }

      const startId = dbRes.insertId;
      results.forEach((row, idx) => {
        const countryName = row[0];
        const countryId = startId + idx;

        logAudit({
          tableName: "dbadminhistory",
          entityType: "country",
          entityId: countryId,
          action: "ADDED",
          data: { name: countryName, status: "active" },
          changedBy: userId,
        });
      });

      res.json({
        success: true,
        inserted: dbRes.affectedRows,
        message: `${dbRes.affectedRows} countries inserted successfully`,
      });
    });
  }

  // === SINGLE INSERT ===
  else {
    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    const checkQuery = "SELECT id FROM countries WHERE name = ?";
    connection.query(checkQuery, [name], (err, results) => {
      if (err) {
        console.error("❌ Error checking country:", err);
        return res.status(500).json({ error: "Database error" });
      }

      if (results.length > 0) {
        return res.status(409).json({ message: "Country already exists" });
      }

      const insertQuery = "INSERT INTO countries (name) VALUES (?)";
      connection.query(insertQuery, [name], (err, insertResults) => {
        if (err) {
          console.error("❌ Error inserting country:", err);
          return res.status(500).json({ error: "Database error" });
        }

        const countryId = insertResults.insertId;

        logAudit({
          tableName: "dbadminhistory",
          entityType: "country",
          entityId: countryId,
          action: "ADDED",
          data: { name, status: "active" },
          changedBy: userId,
        });

        res.status(201).json({
          message: "Country added successfully",
          countryId,
        });
      });
    });
  }
};

const editCountry = (req, res) => {
  const userId = req.user.userId;
  const { name } = req.body;
  const id = req.params.id;

  if (!name) return res.status(400).json({ error: "Name is required" });

  const updateQuery = "UPDATE countries SET name = ? WHERE id = ?";
  connection.query(updateQuery, [name, id], (err, result) => {
    if (err) {
      console.error("❌ Error updating country:", err);
      return res.status(500).json({ error: "Database error" });
    }

    logAudit({
      tableName: "dbadminhistory",
      entityType: "country",
      entityId: id,
      action: "UPDATED",
      data: { name },
      changedBy: userId,
    });

    res.status(200).json({ message: "Country updated successfully" });
  });
};

const getAllCountries = (
  { page = 1, limit = 10, search = "", name = "", status = "all" },
  callback
) => {
  const offset = (page - 1) * limit;
  console.log(name, search)

  const allowedColumns = ["name", "created_at", "updated_at", "status"];
  if (!allowedColumns.includes(name)) name = "";

  let whereConditions = [];
  let values = [];

  // ✅ Status filter ONLY if not "all"
  if (status && status !== "all" && status !== undefined) {
    whereConditions.push("status = ?");
    values.push(status);
  }

  // ✅ Search filter
  if (search !== undefined && search !== null && search !== "") {

    if (name === "created_at" || name === "updated_at") {

      // Validate YYYY-MM-DD
      if (!/^\d{4}-\d{2}-\d{2}$/.test(search)) {
        console.log("❌ Invalid date received:", search);
        return callback(new Error("Invalid date format"));
      }

      whereConditions.push(`DATE(${name}) = ?`);
      values.push(search);
    }

    else if (name === "status") {
      whereConditions.push("LOWER(status) LIKE ?");
      values.push(`%${search.toLowerCase()}%`);
    }

    else {
      whereConditions.push(`${name} LIKE ?`);
      values.push(`%${search}%`);
    }
  }



  const whereClause =
    whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

  // ✅ Decide whether to apply LIMIT/OFFSET
  let query = `SELECT * FROM countries ${whereClause} ORDER BY id DESC`;
  if (limit > 0) {
    query += " LIMIT ? OFFSET ?";
  }

  const queryValues = limit > 0 ? [...values, Number(limit), Number(offset)] : values;

  connection.query(query, queryValues, (err, results) => {
    if (err) {
      console.error("❌ Error fetching countries:", err.sqlMessage);
      return callback(err);
    }

    // Count total matching rows
    const countQuery = `SELECT COUNT(*) AS total FROM countries ${whereClause}`;
    connection.query(countQuery, values, (err2, countResult) => {
      if (err2) {
        console.error("❌ Error counting countries:", err2.sqlMessage);
        return callback(err2);
      }

      callback(null, {
        total: countResult[0].total,
        page,
        limit,
        countries: results,
      });
    });
  });
};


const updateStatus = (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  const checkQuery = "SELECT * FROM countries WHERE id = ?";
  connection.query(checkQuery, [id], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (results.length === 0)
      return res.status(404).json({ error: "Country not found" });

    const currentCountry = results[0];
    const newStatus =
      currentCountry.status === "active" ? "inactive" : "active";

    const updateQuery = "UPDATE countries SET status = ? WHERE id = ?";
    connection.query(updateQuery, [newStatus, id], (err2) => {
      if (err2) return res.status(500).json({ error: "Database error" });

      // 🔥 Audit log: ACTIVE / INACTIVE
      logAudit({
        tableName: "dbadminhistory",
        entityType: "country",
        entityId: id,
        action: newStatus.toUpperCase(), // "ACTIVE" or "INACTIVE"
        data: { name: currentCountry.name, status: newStatus },
        changedBy: userId,
      });

      res
        .status(200)
        .json({ message: `Country status updated to ${newStatus}` });
    });
  });
};

module.exports = {
  createCountriesTable,
  addCountry,
  editCountry,
  getAllCountries,
  updateStatus,
};
