const connection = require("../connection");
const logAudit = require("../utils/auditLogger");

const createPackagesTable = () => {
  const packagetable = `
    CREATE TABLE IF NOT EXISTS packages (
      id INT AUTO_INCREMENT PRIMARY KEY,

      -- ── Core ────────────────────────────────────────────────────────────────
      name          VARCHAR(255),
      package_type  ENUM('Company','Candidate') NOT NULL DEFAULT 'Company',
      pricing_model ENUM(
        'daily_budget',
        'per_apply',
        'job_slot',
        'duration_bundle',
        'cv_credits',
        'featured_boost'
      ) NOT NULL,

      currency_id   INT,
      is_featured   TINYINT(1) DEFAULT 0,
      description   TEXT,
      status        ENUM('Active','Inactive') DEFAULT 'Active',

      -- ── daily_budget ─────────────────────────────────────────────────────
      -- Employer sets a daily spend cap; charged per click / impression / apply
      daily_budget_cap      DECIMAL(10,2) DEFAULT NULL,
      billing_model         ENUM('ppv','pps') DEFAULT NULL,
      rate_per_unit         DECIMAL(10,4) DEFAULT NULL,  -- cost per click / 1k impressions / apply
      campaign_duration_days INT DEFAULT NULL,            -- NULL = open-ended
      min_daily_budget      DECIMAL(10,2) DEFAULT NULL,
      sponsor_to_top        TINYINT(1) DEFAULT 0,        -- +20% surcharge flag
      email_blast           TINYINT(1) DEFAULT 0,        -- one-time add-on flag

      -- ── per_apply ────────────────────────────────────────────────────────
      -- Charged only when a qualified applicant applies
      cost_per_apply       DECIMAL(10,2) DEFAULT NULL,
      max_applies          INT DEFAULT NULL,              -- NULL = unlimited
      budget_ceiling       DECIMAL(10,2) DEFAULT NULL,   -- total spend cap for this job
      qualification_filter ENUM('any','screened','viewed') DEFAULT NULL,

      -- ── job_slot ─────────────────────────────────────────────────────────
      -- Subscription: N simultaneous live job slots, swappable
      slot_count           INT DEFAULT NULL,
      billing_cycle        ENUM('monthly','quarterly','annual') DEFAULT NULL,
      price_per_slot       DECIMAL(10,2) DEFAULT NULL,
      free_views_per_slot  INT DEFAULT NULL,             -- free CV views per slot/month
      extra_view_charge    DECIMAL(10,2) DEFAULT NULL,   -- charge per view after free quota
      swap_allowed         TINYINT(1) DEFAULT 1,

      -- ── duration_bundle ──────────────────────────────────────────────────
      -- Buy X job posts of a fixed duration; activate within validity window
      price                DECIMAL(10,2) DEFAULT NULL,   -- bundle / pack / boost price
      duration_days        INT DEFAULT NULL,              -- days per post (30/60/90/custom)
      num_posts            INT DEFAULT NULL,
      bundle_validity_days INT DEFAULT NULL,              -- window to activate posts after purchase
      include_views        TINYINT(1) DEFAULT 0,
      include_featured_slot TINYINT(1) DEFAULT 0,
      include_analytics    TINYINT(1) DEFAULT 0,

      -- ── cv_credits ───────────────────────────────────────────────────────
      -- Buy a pack of credits; each credit unlocks one candidate profile
      credit_count         INT DEFAULT NULL,
      credit_expiry_days   INT DEFAULT NULL,             -- NULL / 0 = never expires
      unlock_scope         ENUM('basic','contact','full') DEFAULT NULL,
      -- Volume tiers (Tier 1 = base pack above)
      tier2_credits        INT DEFAULT NULL,
      tier2_price          DECIMAL(10,2) DEFAULT NULL,
      tier3_credits        INT DEFAULT NULL,
      tier3_price          DECIMAL(10,2) DEFAULT NULL,

      -- ── featured_boost ───────────────────────────────────────────────────
      -- Standalone add-on; linked to a base package at checkout
      boost_type           ENUM('top','highlighted','homepage','email','profile_top','highlighted_profile','recruiter_spotlight') DEFAULT NULL,
      boost_duration_days  INT DEFAULT NULL,

      -- ── Timestamps ───────────────────────────────────────────────────────
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

      FOREIGN KEY (currency_id) REFERENCES currencies(id) ON DELETE SET NULL
    );
  `;

  connection.query(packagetable, (err) => {
    if (err) return console.error("❌ packages table error:", err.message);
    console.log("✅ packages table created (Indeed-style, 6 pricing models)");
  });
};
// 1. Keep this definition at the top of your file
const validateByModel = (pricing_model, body) => {
  switch (pricing_model) {
    case "daily_budget":
      if (!body.daily_budget_cap) return "daily_budget_cap is required";
      if (!body.billing_model) return "billing_model (ppv/pps) is required";
      if (!body.rate_per_unit) return "rate_per_unit is required";
      break;
    case "per_apply":
      if (!body.cost_per_apply) return "cost_per_apply is required";
      break;
    case "job_slot":
      if (!body.slot_count) return "slot_count is required";
      if (!body.billing_cycle) return "billing_cycle is required";
      if (!body.price_per_slot) return "price_per_slot is required";
      break;
    case "duration_bundle":
      if (!body.price) return "price is required";
      if (!body.duration_days) return "duration_days is required";
      if (body.package_type === "Company" && !body.num_posts)
        return "num_posts is required";
      break;
    case "cv_credits":
      if (!body.price) return "price is required";
      if (!body.credit_count) return "credit_count is required";
      break;
    case "featured_boost":
      if (!body.price) return "price is required";
      if (!body.boost_type) return "boost_type is required";
      if (!body.boost_duration_days) return "boost_duration_days is required";
      break;
    default:
      return `Unknown pricing_model: ${pricing_model}`;
  }
  return null;
};


// ─── addPackage ───────────────────────────────────────────────────────────────
const addPackage = (req, res) => {
  const userId = req.user.userId;
  const body = req.body;

  // 1. Core Validation
  if (!body.package_type || !body.pricing_model || !body.currency_id || !body.name) {
    return res.status(400).json({
      error: "name, package_type, pricing_model, and currency_id are required",
    });
  }

  // 2. Pricing Model Specific Validation (The updated function)
  const modelErrors = validateByModel(body.pricing_model, body);
  if (modelErrors) return res.status(400).json({ error: modelErrors });

  // 3. Duplicate Check
  const duplicateQuery = `
      SELECT id FROM packages 
      WHERE name = ? AND pricing_model = ? AND package_type = ? AND currency_id = ?
      AND status = 'Active'
      LIMIT 1
  `;

  connection.query(
    duplicateQuery,
    [body.name, body.pricing_model, body.package_type, body.currency_id],
    (err, exists) => {
      if (err) return res.status(500).json({ error: "Database error", details: err.message });
      if (exists.length > 0) {
        return res.status(409).json({ message: "A package with this name and model already exists" });
      }

      // 4. Insert Logic (Mappings)
      const insertSql = `
        INSERT INTO packages (
          name, package_type, pricing_model, currency_id, is_featured, description,
          daily_budget_cap, billing_model, rate_per_unit, campaign_duration_days, 
          min_daily_budget, sponsor_to_top, email_blast, cost_per_apply, max_applies, 
          budget_ceiling, qualification_filter, slot_count, billing_cycle, price_per_slot,
          free_views_per_slot, extra_view_charge, swap_allowed, price, duration_days, 
          num_posts, bundle_validity_days, include_views, include_featured_slot, 
          include_analytics, credit_count, credit_expiry_days, unlock_scope, 
          tier2_credits, tier2_price, tier3_credits, tier3_price, boost_type, 
          boost_duration_days, status
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 
          ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active'
        )
      `;

      const values = [
        body.name, body.package_type, body.pricing_model, body.currency_id,
        body.is_featured ? 1 : 0, body.description || null,
        body.daily_budget_cap ?? null, body.billing_model ?? null, body.rate_per_unit ?? null,
        body.campaign_duration_days ?? null, body.min_daily_budget ?? null,
        body.sponsor_to_top ? 1 : 0, body.email_blast ? 1 : 0,
        body.cost_per_apply ?? null, body.max_applies ?? null, body.budget_ceiling ?? null,
        body.qualification_filter ?? null, body.slot_count ?? null, body.billing_cycle ?? null,
        body.price_per_slot ?? null, body.free_views_per_slot ?? null,
        body.extra_view_charge ?? null, body.swap_allowed === false ? 0 : 1,
        body.price ?? null, body.duration_days ?? null, body.num_posts ?? null,
        body.bundle_validity_days ?? null, body.include_views ? 1 : 0,
        body.include_featured_slot ? 1 : 0, body.include_analytics ? 1 : 0,
        body.credit_count ?? null, body.credit_expiry_days ?? null, body.unlock_scope ?? null,
        body.tier2_credits ?? null, body.tier2_price ?? null, body.tier3_credits ?? null,
        body.tier3_price ?? null, body.boost_type ?? null, body.boost_duration_days ?? null
      ];

      connection.query(insertSql, values, (err2, result) => {
        if (err2) return res.status(500).json({ error: "Insert failed", details: err2.message });
        logAudit({
          tableName: "dbadminhistory",
          entityType: "package",
          entityId: result.insertId,
          action: "ADDED",
          data: { name: body.name, pricing_model: body.pricing_model, price: body.price },
          changedBy: userId,
        });

        return res.status(201).json({ success: true, id: result.insertId });
      });
    }
  );
};
const getAvailablePackages = (req, res) => {
  const { pricing_model } = req.query;

  let sql = `SELECT * FROM packages WHERE status = 'Active' AND package_type = 'Company'`;
  const params = [];

  if (pricing_model) {
    sql += ` AND pricing_model = ?`;
    params.push(pricing_model);
  }

  connection.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ error: "DB error", details: err.message });
    return res.status(200).json({ packages: results });
  });
};
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
  if (package_type && ["Company", "Candidate", "registration"].includes(package_type)) {
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
    if (package_type && ["Company", "Candidate", "registration"].includes(package_type)) {
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


const validateByType = (data) => {
  const errors = [];
  if (!data.package_type) errors.push("package_type is required");
  if (!data.pricing_model) errors.push("pricing_model is required");
  if (!data.currency_id) errors.push("currency_id is required");
  return errors;
};
// ─────────────────────────────────────────────
const editPackage = (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;
  const body = req.body;

  const validationErrors = validateByType(body);
  if (validationErrors.length) {
    return res.status(400).json({ error: validationErrors.join(", ") });
  }

  const modelError = validateByModel(body.pricing_model, body);
  if (modelError) {
    return res.status(400).json({ error: modelError });
  }

  connection.query("SELECT * FROM packages WHERE id = ?", [id], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (!results.length) return res.status(404).json({ error: "Package not found" });

    const updateSql = `
      UPDATE packages SET
        name = ?, package_type = ?, pricing_model = ?, currency_id = ?,
        is_featured = ?, description = ?,
        daily_budget_cap = ?, billing_model = ?, rate_per_unit = ?,
        campaign_duration_days = ?, min_daily_budget = ?,
        sponsor_to_top = ?, email_blast = ?,
        cost_per_apply = ?, max_applies = ?, budget_ceiling = ?,
        qualification_filter = ?, slot_count = ?, billing_cycle = ?,
        price_per_slot = ?, free_views_per_slot = ?, extra_view_charge = ?,
        swap_allowed = ?, price = ?, duration_days = ?, num_posts = ?,
        bundle_validity_days = ?, include_views = ?, include_featured_slot = ?,
        include_analytics = ?, credit_count = ?, credit_expiry_days = ?,
        unlock_scope = ?, tier2_credits = ?, tier2_price = ?,
        tier3_credits = ?, tier3_price = ?, boost_type = ?, boost_duration_days = ?
      WHERE id = ?
    `;

    const values = [
      body.name, body.package_type, body.pricing_model, body.currency_id,
      body.is_featured ? 1 : 0, body.description || null,
      body.daily_budget_cap ?? null, body.billing_model ?? null, body.rate_per_unit ?? null,
      body.campaign_duration_days ?? null, body.min_daily_budget ?? null,
      body.sponsor_to_top ? 1 : 0, body.email_blast ? 1 : 0,
      body.cost_per_apply ?? null, body.max_applies ?? null, body.budget_ceiling ?? null,
      body.qualification_filter ?? null, body.slot_count ?? null, body.billing_cycle ?? null,
      body.price_per_slot ?? null, body.free_views_per_slot ?? null, body.extra_view_charge ?? null,
      body.swap_allowed === false ? 0 : 1,
      body.price ?? null, body.duration_days ?? null, body.num_posts ?? null,
      body.bundle_validity_days ?? null, body.include_views ? 1 : 0,
      body.include_featured_slot ? 1 : 0, body.include_analytics ? 1 : 0,
      body.credit_count ?? null, body.credit_expiry_days ?? null, body.unlock_scope ?? null,
      body.tier2_credits ?? null, body.tier2_price ?? null,
      body.tier3_credits ?? null, body.tier3_price ?? null,
      body.boost_type ?? null, body.boost_duration_days ?? null,
      id,
    ];

    connection.query(updateSql, values, (err2) => {
      if (err2) return res.status(500).json({ error: "Database error", details: err2.message });

      logAudit({
        tableName: "dbadminhistory",
        entityType: "package",
        entityId: id,
        action: "UPDATED",
        data: body,
        changedBy: userId,
      });

      res.status(200).json({ success: true, message: "Package updated successfully" });
    });
  });
};

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

  // Added 'pricing_model' to allowed sorts
  const allowedSortFields = ["price", "package_type", "status", "id", "pricing_model"];
  if (!allowedSortFields.includes(name)) name = "price";

  let sql = `
    SELECT 
      c.id, c.status, 
      p.name AS package_display_name, p.package_type, p.pricing_model, p.price,
      a.id AS account_id, a.username, ci.company_name,
      co.name AS country_name, ci_town.name AS city_name
    FROM cart c
    JOIN account a ON c.account_id = a.id
    JOIN packages p ON c.package_id = p.id  /* Join the new packages table */
    LEFT JOIN company_info ci ON ci.account_id = a.id
    LEFT JOIN countries co ON co.id = ci.country_id
    LEFT JOIN cities ci_town ON ci_town.id = ci.city_id
    WHERE 1=1
  `;

  const params = [];
  if (status !== "all") { sql += ` AND c.status = ?`; params.push(status); }
  if (search) {
    sql += ` AND (p.name LIKE ? OR a.username LIKE ? OR ci.company_name LIKE ? OR p.pricing_model LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  sql += ` ORDER BY ${name} ASC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  connection.query(sql, params, (err, results) => {
    if (err) { console.error("SQL ERROR:", err); return callback(err, null); }

    // Count query needs to mirror the joins for accurate results
    let countSql = `
      SELECT COUNT(*) AS totalRecords 
      FROM cart c 
      JOIN packages p ON c.package_id = p.id 
      JOIN account a ON c.account_id = a.id 
      WHERE 1=1
    `;
    const countParams = [];
    if (status !== "all") { countSql += ` AND c.status = ?`; countParams.push(status); }
    if (search) {
      countSql += ` AND (p.name LIKE ? OR a.username LIKE ? OR ci.company_name LIKE ?)`;
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    connection.query(countSql, countParams, (countErr, countRes) => {
      if (countErr) return callback(countErr, null);
      callback(null, { data: results, totalRecords: countRes[0].totalRecords || 0 });
    });
  });
};

const getCompanyPackgestatus = (req, res) => {
  try {
    const userId = req.params.userId;
    // We check for the most recent active purchase in the cart
    const query = `
      SELECT c.status, p.name as package_name, p.pricing_model 
      FROM cart c 
      JOIN packages p ON c.package_id = p.id
      WHERE c.account_id = ? AND c.status = 'Active'
      ORDER BY c.id DESC LIMIT 1
    `;

    connection.query(query, [userId], (err, results) => {
      if (err) return res.status(500).json({ error: "Internal Server Error" });
      if (results.length === 0) return res.status(404).json({ error: "No active package found for this user" });

      res.status(200).json({
        userId,
        packageStatus: results[0].status,
        packageName: results[0].package_name,
        model: results[0].pricing_model
      });
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getPackageDetail = (req, res) => {
  const companyId = req.params.userId;
  const query = `
    SELECT 
      pay.account_id AS company_id,
      pay.payment_status,
      jp.id AS job_id, jp.job_title, jp.status AS job_status, jp.created_at AS job_date,
      p.id AS package_id, p.name AS package_name, p.pricing_model,
      /* Financial Fields */
      p.price AS base_price, cur.code AS currency,
      p.daily_budget_cap, p.cost_per_apply, p.rate_per_unit,
      /* Limits and Validity */
      p.credit_count, p.slot_count, p.num_posts,
      p.duration_days, p.campaign_duration_days,
      /* Booleans */
      p.is_featured, p.sponsor_to_top, p.include_analytics
    FROM payment pay
    LEFT JOIN job_posts jp ON jp.id = pay.job_id
    LEFT JOIN packages p ON p.id = IFNULL(jp.package_id, pay.package_id) /* Fallback if not linked to a specific job */
    LEFT JOIN currencies cur ON cur.id = p.currency_id
    WHERE pay.account_id = ?
    ORDER BY pay.id DESC
  `;

  connection.query(query, [companyId], (err, results) => {
    if (err) {
      console.error("SQL Error:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
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
  getAvailablePackages
};