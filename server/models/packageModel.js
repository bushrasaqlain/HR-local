const connection = require("../connection");
const logAudit = require("../utils/auditLogger");

const createPackagesTable = () => {
  const packagetable = `
    CREATE TABLE IF NOT EXISTS packages (
      id             INT AUTO_INCREMENT PRIMARY KEY,
      name           VARCHAR(255) NULL,
      price          VARCHAR(255) NOT NULL,
      duration_unit  VARCHAR(20) NULL,
      duration_value VARCHAR(255) NULL,
      currency       VARCHAR(50)  NOT NULL,
      currency_id    INT          NOT NULL,
      candidate_limit INT         DEFAULT NULL COMMENT 'NULL = unlimited, company only',
      // interview_slots INT         DEFAULT NULL COMMENT 'NULL = unlimited, company only',
      location_scope ENUM('city','all') DEFAULT 'city' COMMENT 'company only',
      package_type   ENUM('company','candidate','registration') DEFAULT 'company',
      is_featured    TINYINT      DEFAULT 0,
      description    TEXT         NULL,
      status         ENUM('Active','Inactive') DEFAULT 'Active',
      created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `;
  connection.query(packagetable, (err) => {
    if (err) return console.error(err.message);
    console.log("✅ packages table created successfully");
  });
};

// ─────────────────────────────────────────────
// GET ALL PACKAGES
// ─────────────────────────────────────────────
const getAllPackages = (
  { page = 1, limit = 10, name = "price", search = "", status = "Active", package_type = "" },
  callback,
) => {
  page = parseInt(page, 10);
  limit = parseInt(limit, 10);
  const offset = (page - 1) * limit;

  const columnMap = {
    name: "p.name",
    price: "p.price",
    duration_value: "p.duration_value",
    duration_unit: "p.duration_unit",
    currency: "c.code",
    created_at: "p.created_at",
    updated_at: "p.updated_at",
    status: "p.status",
  };

  if (name === "amount") name = "price";
  if (name === "duration") name = "duration_value";
  if (!columnMap[name]) name = "price";

  let query = `
    SELECT p.*, c.id AS currency_id, c.code AS currency
    FROM packages p
    LEFT JOIN currencies c ON c.id = p.currency_id
    WHERE 1=1
  `;
  let values = [];

  if (status !== "all") { query += ` AND p.status = ?`; values.push(status); }
  // ✅ Add after status filter
  if (package_type && ["company", "candidate", "registration"].includes(package_type)) {
    query += ` AND p.package_type = ?`;
    values.push(package_type);
  }
  if (search) {
    if (name === "created_at" || name === "updated_at") {
      query += ` AND DATE_FORMAT(${columnMap[name]}, '%Y-%m-%d') LIKE ?`;
      values.push(`%${search}%`);
    } else if (name === "price" || name === "duration_value") {
      query += ` AND ${columnMap[name]} = ?`;
      values.push(search);
    } else {
      query += ` AND ${columnMap[name]} LIKE ?`;
      values.push(`%${search}%`);
    }
  }

  query += ` ORDER BY p.id DESC LIMIT ? OFFSET ?`;
  values.push(limit, offset);

  connection.query(query, values, (err, results) => {
    if (err) return callback(err);

    let countQuery = `
      SELECT COUNT(*) AS total FROM packages p
      LEFT JOIN currencies c ON c.id = p.currency_id WHERE 1=1
    `;
    let countValues = [];
    if (status !== "all") { countQuery += ` AND p.status = ?`; countValues.push(status); }
    if (search) {
      if (name === "created_at" || name === "updated_at") {
        countQuery += ` AND DATE_FORMAT(${columnMap[name]}, '%Y-%m-%d') LIKE ?`;
        countValues.push(`%${search}%`);
      } else if (name === "price" || name === "duration_value") {
        countQuery += ` AND ${columnMap[name]} = ?`;
        countValues.push(search);
      } else {
        countQuery += ` AND ${columnMap[name]} LIKE ?`;
        countValues.push(`%${search}%`);
      }
    }
    if (package_type && ["company", "candidate", "registration"].includes(package_type)) {
      countQuery += ` AND p.package_type = ?`;
      countValues.push(package_type);
    }
    connection.query(countQuery, countValues, (err2, countResult) => {
      if (err2) return callback(err2);
      callback(null, { total: countResult[0].total, page, limit, packages: results });
    });
  });
};

// ─────────────────────────────────────────────
// CURRENCY HELPER
// ─────────────────────────────────────────────
const getCurrencyMap = () =>
  new Promise((resolve, reject) => {
    connection.query(
      "SELECT id, code FROM currencies WHERE status = 'Active'",
      (err, rows) => {
        if (err) return reject(err);
        const map = {};
        rows.forEach((c) => { map[c.code.toLowerCase()] = c.id; });
        resolve(map);
      },
    );
  });

// ─────────────────────────────────────────────
// VALIDATE FIELDS BY PACKAGE TYPE
// company needs: candidate_limit, interview_slots, location_scope (optional but allowed)
// candidate needs: none of the above
// ─────────────────────────────────────────────
const validateByType = (body) => {
  const { package_type, duration_unit, duration_value, price, currency_id } = body;
  const errors = [];

  if (!package_type || !["company", "candidate", "registration"].includes(package_type)) {
    errors.push("package_type must be 'company' or 'candidate' or 'registration'");
  }
  if (package_type !== "registration") {
    if (!duration_unit) errors.push("duration_unit is required");
    if (!duration_value) errors.push("duration_value is required");
  }
  if (!price) errors.push("price is required");
  if (!currency_id) errors.push("currency_id is required");

  return errors;
};

// ─────────────────────────────────────────────
// BUILD INSERT PAYLOAD BY TYPE
// ─────────────────────────────────────────────
const buildPayload = (body, currencyCode) => {
  const {
    name, duration_unit, duration_value, price, currency_id,
    description, package_type, is_featured,
    // company-only
    // candidate_limit, interview_slots, location_scope,
  } = body;

  const isCompany = package_type === "company";
  const isRegistration = package_type === "registration";

  return {
    name: name || null,
    duration_unit: isRegistration ? null : duration_unit,
    duration_value: isRegistration ? null : duration_value,
    price,
    currency: currencyCode,
    currency_id,
    description: description || null,
    package_type,
    is_featured: is_featured ? 1 : 0,
    // company-only fields: send null for candidate packages
    candidate_limit: isCompany && candidate_limit ? Number(candidate_limit) : null,
    interview_slots: isCompany && interview_slots ? Number(interview_slots) : null,
    location_scope: isCompany ? (location_scope || "city") : null,
  };
};

// ─────────────────────────────────────────────
// ADD PACKAGE
// ─────────────────────────────────────────────
const addPackage = (req, res) => {
  const userId = req.user.userId;
  const { type, data } = req.body;

  // ── CSV bulk import ──
  if (type === "csv") {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ error: "CSV data is required" });
    }

    getCurrencyMap()
      .then((currencyMap) => {
        const packages = data.map((row) => {
          const unit = row.duration_unit?.trim();
          const value = Number(row.duration_value);
          const rowPrice = Number(row.price);
          const currencyTxt = row.currency?.toLowerCase()?.trim();
          const cur_id = currencyMap[currencyTxt];
          const pkgType = ["company", "candidate", "registration"].includes(row.package_type)
            ? row.package_type
            : "company";
          const isCompany = pkgType === "company";
          const isRegistration = pkgType === "registration";

          if (!unit || !value || !rowPrice || !cur_id) return null;

          return [
            row.name || null,
            unit,
            value,
            rowPrice,
            currencyTxt.toUpperCase(),
            cur_id,
            row.description || null,
            pkgType,
            row.is_featured === "Yes" ? 1 : 0,
            isCompany && row.candidate_limit ? Number(row.candidate_limit) : null,
            isCompany && row.interview_slots ? Number(row.interview_slots) : null,
            isCompany ? (row.location_scope || "city") : null,
          ];
        }).filter(Boolean);

        if (packages.length === 0) {
          return res.status(400).json({ error: "Invalid currency or data in CSV" });
        }

        const sql = `
          INSERT INTO packages
            (name, duration_unit, duration_value, price, currency, currency_id,
             description, package_type, is_featured,
             candidate_limit, location_scope)
          VALUES ?
        `;

        connection.query(sql, [packages], (err, result) => {
          if (err) return res.status(500).json({ error: "Database error", details: err.message });

          const startId = result.insertId;
          packages.forEach((row, idx) => {
            logAudit({
              tableName: "dbadminhistory", entityType: "package",
              entityId: startId + idx, action: "ADDED",
              data: { duration_unit: row[1], price: row[3], package_type: row[7] },
              changedBy: userId,
            });
          });

          res.json({ success: true, inserted: result.affectedRows, message: `${result.affectedRows} packages imported` });
        });
      })
      .catch(() => res.status(500).json({ error: "Currency lookup failed" }));

    return;
  }

  // ── Single package ──
  const validationErrors = validateByType(req.body);
  if (validationErrors.length) {
    return res.status(400).json({ error: validationErrors.join(", ") });
  }

  const { currency_id, duration_unit, duration_value, price } = req.body;

  connection.query("SELECT code FROM currencies WHERE id = ?", [currency_id], (err, currencyResult) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (!currencyResult.length) return res.status(400).json({ error: "Invalid currency" });

    const currencyCode = currencyResult[0].code;

    // Check duplicate
    connection.query(
      `SELECT id FROM packages WHERE duration_unit = ? AND duration_value = ? AND price = ? AND currency = ? AND package_type = ?`,
      [duration_unit, duration_value, price, currencyCode, req.body.package_type],
      (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        if (results.length > 0) return res.status(409).json({ message: "Package already exists" });

        const p = buildPayload(req.body, currencyCode);

        const insertSql = `
          INSERT INTO packages
            (name, duration_unit, duration_value, price, currency, currency_id,
             description, package_type, is_featured,
             candidate_limit, location_scope)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        connection.query(
          insertSql,
          [
            p.name, p.duration_unit, p.duration_value, p.price,
            p.currency, p.currency_id, p.description,
            p.package_type, p.is_featured,
            p.candidate_limit, p.location_scope,
          ],
          (err2, insertRes) => {
            if (err2) return res.status(500).json({ error: "Database error", details: err2.message });

            logAudit({
              tableName: "dbadminhistory", entityType: "package",
              entityId: insertRes.insertId, action: "ADDED",
              data: p, changedBy: userId,
            });

            res.status(201).json({ success: true, message: "Package added successfully", id: insertRes.insertId });
          },
        );
      },
    );
  });
};

// ─────────────────────────────────────────────
// EDIT PACKAGE
// ─────────────────────────────────────────────
const editPackage = (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  const validationErrors = validateByType(req.body);
  if (validationErrors.length) {
    return res.status(400).json({ error: validationErrors.join(", ") });
  }

  connection.query("SELECT * FROM packages WHERE id = ?", [id], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (results.length === 0) return res.status(404).json({ error: "Package not found" });

    connection.query("SELECT code FROM currencies WHERE id = ?", [req.body.currency_id], (err, currencyResult) => {
      if (err) return res.status(500).json({ error: "Database error" });
      if (!currencyResult.length) return res.status(400).json({ error: "Invalid currency" });

      const currencyCode = currencyResult[0].code;
      const p = buildPayload(req.body, currencyCode);

      const updateSql = `
        UPDATE packages
        SET name = ?, duration_unit = ?, duration_value = ?, price = ?,
            currency = ?, currency_id = ?, description = ?,
            package_type = ?, is_featured = ?,
            // candidate_limit = ?, interview_slots = ?, location_scope = ?
        WHERE id = ?
      `;

      connection.query(
        updateSql,
        [
          p.name, p.duration_unit, p.duration_value, p.price,
          p.currency, p.currency_id, p.description,
          p.package_type, p.is_featured,
          p.candidate_limit, p.location_scope,
          id,
        ],
        (err2) => {
          if (err2) return res.status(500).json({ error: "Database error", details: err2.message });

          logAudit({
            tableName: "dbadminhistory", entityType: "package",
            entityId: id, action: "UPDATED",
            data: { ...p, status: results[0].status },
            changedBy: userId,
          });

          res.status(200).json({ message: "Package updated successfully" });
        },
      );
    });
  });
};

// ─────────────────────────────────────────────
// TOGGLE STATUS
// ─────────────────────────────────────────────
const deletePackage = (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  connection.query("SELECT * FROM packages WHERE id = ?", [id], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (results.length === 0) return res.status(404).json({ error: "Package not found" });

    const currentPackage = results[0];
    const newStatus = currentPackage.status === "Active" ? "Inactive" : "Active";

    connection.query("UPDATE packages SET status = ? WHERE id = ?", [newStatus, id], (err2) => {
      if (err2) return res.status(500).json({ error: "Database error" });

      logAudit({
        tableName: "dbadminhistory", entityType: "package", entityId: id,
        action: newStatus.toUpperCase(),
        data: { ...currentPackage, status: newStatus },
        changedBy: userId,
      });

      res.status(200).json({ message: `Package status updated to ${newStatus}` });
    });
  });
};

// ─────────────────────────────────────────────
// EXISTING FUNCTIONS (unchanged)
// ─────────────────────────────────────────────
const getPackagebyCompany = ({ page = 1, limit = 10, name = "price", search = "", status = "all" }, callback) => {
  page = parseInt(page);
  limit = parseInt(limit);
  const offset = (page - 1) * limit;

  const allowedSortFields = ["price", "package_type", "status", "id"];
  if (!allowedSortFields.includes(name)) name = "price";

  let sql = `
    SELECT c.id, c.package_type, c.price, c.status,
      a.id AS account_id, a.username, ci.company_name,
      bet.name AS business_entity_type, co.name AS country_name,
      ci_town.name AS city_name, d.name AS district_name,
      ci.company_address, ci.phone, ci.company_website,
      ci.NTN, ci.size_of_company, ci.established_date
    FROM cart c
    JOIN account a ON c.account_id = a.id
    LEFT JOIN company_info ci ON ci.account_id = a.id
    LEFT JOIN business_entity_type bet ON bet.id = ci.Business_entity_type_id
    LEFT JOIN countries co ON co.id = ci.country_id
    LEFT JOIN cities ci_town ON ci_town.id = ci.city_id
    LEFT JOIN districts d ON d.id = ci.district_id
    WHERE 1=1
  `;
  const params = [];
  if (status !== "all") { sql += ` AND c.status = ?`; params.push(status); }
  if (search) {
    sql += ` AND (c.package_type LIKE ? OR a.username LIKE ? OR ci.company_name LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  sql += ` ORDER BY ${name} ASC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  connection.query(sql, params, (err, results) => {
    if (err) { console.error("SQL ERROR:", err); return callback(err, null); }

    let countSql = `SELECT COUNT(*) AS totalRecords FROM cart c JOIN account a ON c.account_id = a.id LEFT JOIN company_info ci ON ci.account_id = a.id WHERE 1=1`;
    const countParams = [];
    if (status !== "all") countParams.push(status);
    if (search) countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);

    connection.query(countSql, countParams, (countErr, countRes) => {
      if (countErr) return callback(countErr, null);
      callback(null, { data: results, totalRecords: countRes[0].totalRecords || 0 });
    });
  });
};

const getCompanyPackgestatus = (req, res) => {
  try {
    const userId = req.params.userId;
    connection.query('SELECT status FROM cart WHERE account_id = ? AND status = "Active"', [userId], (err, results) => {
      if (err) return res.status(500).json({ error: "Internal Server Error" });
      if (results.length === 0) return res.status(404).json({ error: "Package status not found" });
      res.status(200).json({ userId, packageStatus: results[0].status });
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getPackageDetail = (req, res) => {
  const companyId = req.params.userId;
  const query = `
    SELECT pay.account_id AS company_id,
      jp.id AS job_id, jp.job_title, jp.status AS job_status, jp.created_at AS job_date,
      p.id AS package_id, p.price AS package_price, p.package_type,
      p.candidate_limit, p.location_scope,
      cur.code AS package_currency, p.duration_unit, p.duration_value,
      pay.payment_status
    FROM payment pay
    LEFT JOIN job_posts jp ON jp.id = pay.job_id
    LEFT JOIN packages p ON p.id = jp.package_id
    LEFT JOIN currencies cur ON cur.id = p.currency_id
    WHERE pay.account_id = ?
  `;
  connection.query(query, [companyId], (err, results) => {
    if (err) { console.error("SQL Error:", err); return res.status(500).json({ error: "Internal Server Error" }); }
    res.json(results);
  });
};

module.exports = {
  createPackagesTable,
  getAllPackages,
  addPackage,
  editPackage,
  deletePackage,
  getPackagebyCompany,
  getCompanyPackgestatus,
  getPackageDetail,
};