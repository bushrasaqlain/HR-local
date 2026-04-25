const express = require("express");
const router = express.Router();
const connection = require("../connection");
const logAudit = require("../utils/auditLogger.js");
const { CompanyModule } = require("@faker-js/faker");


const createJobPostTable = () => {
  const createjob_postsTableQuery = `
CREATE TABLE IF NOT EXISTS job_posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  account_id INT, 
  job_title VARCHAR(255),
  job_description TEXT,
  skill_ids JSON,
  time_from TIME,
  time_to TIME,
  job_type_id INT,
  min_salary INT,
  max_salary INT,
  currency_id INT,
  min_experience VARCHAR(255),
  max_experience VARCHAR(255),
  speciality_id INT,
  degree_id INT,
  application_deadline TIMESTAMP,
  no_of_positions INT,
  industry VARCHAR(255),
  package_id INT,
  country_id INT,
  district_id JSON,
  city_id JSON,
  company_package_id INT NULL,
  billing_model ENUM(
    'duration_bundle',
    'job_slot',
    'cv_credits',
    'daily_budget',
    'per_apply',
    'featured_boost',
    'free'
  ) DEFAULT NULL,
  is_sponsored TINYINT DEFAULT 0,
  daily_budget DECIMAL(10,2) DEFAULT 0,
  cost_per_click DECIMAL(10,2) DEFAULT 0,
  spent_amount DECIMAL(10,2) DEFAULT 0,
  job_location_type VARCHAR(50),
  screening_start DATE,
  screening_end DATE,
  interview_start DATE,
  interview_end DATE,
  expected_joining_date DATE,
  approval_status ENUM('Pending','Pending Payment','Approved','UnApproved') DEFAULT 'Pending',
  status ENUM('Active','Inactive') DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (account_id) REFERENCES account(id),
  FOREIGN KEY (job_type_id) REFERENCES jobtypes(id), 
  FOREIGN KEY (speciality_id) REFERENCES speciality(id),
  FOREIGN KEY (degree_id) REFERENCES degreetypes(id),
  FOREIGN KEY (currency_id) REFERENCES currencies(id),
  FOREIGN KEY (country_id) REFERENCES countries(id),
  FOREIGN KEY (company_package_id) REFERENCES company_packages(id),
  FOREIGN KEY (package_id) REFERENCES packages(id)
);
`;

  connection.query(createjob_postsTableQuery, function (err, results, fields) {
    if (err) {
      return console.error(err.message);
    }
    console.log("job_posts table created successfully");
  });
};

const getAllJobs = (req, res) => {
  const userId = req.params.userId;

  const jobPostsQuery = `
    SELECT 
      jp.id,
      jp.account_id,
      a.username,
      jp.job_title,
      jp.job_description,
      jp.skill_ids,
      jp.time_from,
      jp.time_to,
      jt.name AS job_type,
      jp.job_location_type,
      jp.min_salary,
      jp.max_salary,
      ccy.code AS currency,
      jp.min_experience,
      jp.max_experience,
      spec.name AS speciality,
      deg.name AS degree,
      jp.no_of_positions,
      jp.industry,
      jp.district_id,
      jp.city_id,
      co.name AS country,
      jp.application_deadline,
      jp.screening_start,
      jp.screening_end,
      jp.interview_start,
      jp.interview_end,
      jp.expected_joining_date,
      jp.billing_model,
      jp.approval_status,
      jp.status,
      jp.created_at,
      jp.updated_at
    FROM job_posts jp
    LEFT JOIN account a ON jp.account_id = a.id
    LEFT JOIN jobtypes jt ON jp.job_type_id = jt.id
    LEFT JOIN currencies ccy ON jp.currency_id = ccy.id
    LEFT JOIN speciality spec ON jp.speciality_id = spec.id
    LEFT JOIN degreetypes deg ON jp.degree_id = deg.id
    LEFT JOIN countries co ON jp.country_id = co.id
    WHERE jp.account_id = ?
    ORDER BY jp.created_at DESC
  `;

  connection.query(jobPostsQuery, [userId], async (err, results) => {
    if (err) {
      console.error("Error fetching job posts:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    const transformedResults = await Promise.all(
      results.map(async (job) => {

        // ── Parse district_id and city_id JSON arrays ──
        const districtIds = (() => {
          try {
            const parsed = typeof job.district_id === "string"
              ? JSON.parse(job.district_id)
              : job.district_id;
            return Array.isArray(parsed) ? parsed : [];
          } catch { return []; }
        })();

        const cityIds = (() => {
          try {
            const parsed = typeof job.city_id === "string"
              ? JSON.parse(job.city_id)
              : job.city_id;
            return Array.isArray(parsed) ? parsed : [];
          } catch { return []; }
        })();

        // ── Fetch district names ──
        let districts = [];
        if (districtIds.length > 0) {
          try {
            districts = await new Promise((resolve, reject) => {
              connection.query(
                `SELECT id, name FROM districts WHERE id IN (?)`,
                [districtIds],
                (err, rows) => err ? reject(err) : resolve(rows)
              );
            });
          } catch (e) {
            console.error("Error fetching districts for job", job.id, e);
          }
        }

        // ── Fetch city names ──
        let cities = [];
        if (cityIds.length > 0) {
          try {
            cities = await new Promise((resolve, reject) => {
              connection.query(
                `SELECT id, name FROM cities WHERE id IN (?)`,
                [cityIds],
                (err, rows) => err ? reject(err) : resolve(rows)
              );
            });
          } catch (e) {
            console.error("Error fetching cities for job", job.id, e);
          }
        }

        // ── Fetch skill names ──
        const skillIds = (() => {
          try {
            const parsed = typeof job.skill_ids === "string"
              ? JSON.parse(job.skill_ids)
              : job.skill_ids;
            return Array.isArray(parsed) ? parsed : [];
          } catch { return []; }
        })();

        let skills = [];
        if (skillIds.length > 0) {
          try {
            skills = await new Promise((resolve, reject) => {
              connection.query(
                `SELECT id, name FROM skills WHERE id IN (?)`,
                [skillIds],
                (err, rows) => err ? reject(err) : resolve(rows)
              );
            });
          } catch (e) {
            console.error("Error fetching skills for job", job.id, e);
          }
        }

        return {
          ...job,
          skill_ids: skillIds,
          skills: skills.map((s) => s.name),
          district_id: districtIds,
          districts: districts.map((d) => ({ id: d.id, name: d.name })),
          city_id: cityIds,
          cities: cities.map((c) => ({ id: c.id, name: c.name })),
        };
      })
    );

    res.status(200).json(transformedResults);
  });
};

const getJobbyRegAdmin = (req, res) => {
  const { page = 1, limit = 10, status, search, name } = req.query;
  const offset = (page - 1) * limit;

  let whereClause = "WHERE jp.approval_status != 'Pending Payment'";
  let params = [];

  if (status) {
    if (['Approved', 'Pending', 'UnApproved'].includes(status)) {
      whereClause += " AND jp.approval_status = ?";
    } else {
      whereClause += " AND jp.status = ?";
    }
    params.push(status);
  }

  if (search && name) {
    let column;
    switch (name) {
      case "packageprice": column = "pkg.price"; break;
      case "currency": column = "pkg.currency"; break;
      case "duration_days": column = "pkg.duration_days"; break;
      case "package_name": column = "pkg.name"; break;
      case "status": column = "jp.status"; break;
      default: column = name;
    }

    if (name === "packageprice") {
      const num = Number(search);
      if (!isNaN(num) && search.trim() !== '') {
        whereClause += ` AND (pkg_ccy.code LIKE ? OR pkg.price LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`);
      } else {
        whereClause += ` AND pkg_ccy.code LIKE ?`;
        params.push(`${search}%`);
      }
    }  else if (["jp.status", "jp.approval_status"].includes(column)) {
      whereClause += ` AND LOWER(${column}) LIKE LOWER(?)`;
      params.push(`${search}%`);
    } else {
      whereClause += ` AND ${column} LIKE ?`;
      params.push(`%${search}%`);
    }
  }

  const jobPostsQuery = `
    SELECT 
      jp.id AS jobpost_id,
      jp.account_id,
      a.username,
      jp.job_title,
      jp.job_description,
      jp.skill_ids,
      jp.time_from,
      jp.time_to,
      jt.name AS job_type,
      jp.job_location_type,
      jp.min_salary,
      jp.max_salary,
      ccy.code AS currency,
      jp.min_experience,
      jp.max_experience,
      spec.name AS speciality,
      deg.name AS degree,
      jp.no_of_positions,
      jp.industry,
      pkg.price AS packageprice,
      pkg_ccy.code AS packagecurrency,
      pkg.duration_days,
pkg.name AS package_name,
pkg.pricing_model AS package_pricing_model,
pkg.slot_count,
pkg.num_posts,
pkg.credit_count,
      jp.billing_model,
      co.name AS country,
      jp.district_id,
      jp.city_id,
      jp.application_deadline,
      jp.screening_start,
      jp.screening_end,
      jp.interview_start,
      jp.interview_end,
      jp.expected_joining_date,
      jp.created_at,
      jp.updated_at,
      jp.status,
      jp.approval_status
    FROM job_posts jp
    LEFT JOIN account a ON jp.account_id = a.id
    LEFT JOIN jobtypes jt ON jp.job_type_id = jt.id
    LEFT JOIN currencies ccy ON jp.currency_id = ccy.id
    LEFT JOIN packages pkg ON jp.package_id = pkg.id
    LEFT JOIN currencies pkg_ccy ON pkg.currency_id = pkg_ccy.id
    LEFT JOIN speciality spec ON jp.speciality_id = spec.id
    LEFT JOIN degreetypes deg ON jp.degree_id = deg.id
    LEFT JOIN countries co ON jp.country_id = co.id
    ${whereClause}
    ORDER BY jp.created_at DESC
    LIMIT ? OFFSET ?
  `;

  const queryParams = [...params, Number(limit), Number(offset)];

  connection.query(jobPostsQuery, queryParams, async (err, results) => {
    if (err) {
      console.error("Error fetching job posts:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    // ── Resolve JSON arrays for districts, cities, skills ──
    const transformed = await Promise.all(results.map(async (job) => {

      const parseJsonIds = (val) => {
        try {
          const parsed = typeof val === "string" ? JSON.parse(val) : val;
          return Array.isArray(parsed) ? parsed : [];
        } catch { return []; }
      };

      const districtIds = parseJsonIds(job.district_id);
      const cityIds = parseJsonIds(job.city_id);
      const skillIds = parseJsonIds(job.skill_ids);

      const fetchNames = (table, ids) => {
        if (!ids.length) return Promise.resolve([]);
        return new Promise((resolve, reject) => {
          connection.query(
            `SELECT id, name FROM ${table} WHERE id IN (?)`,
            [ids],
            (err, rows) => err ? reject(err) : resolve(rows)
          );
        });
      };

      const [districts, cities, skills] = await Promise.all([
        fetchNames("districts", districtIds).catch(() => []),
        fetchNames("cities", cityIds).catch(() => []),
        fetchNames("skills", skillIds).catch(() => []),
      ]);

      return {
        ...job,
        skill_ids: skillIds,
        skills: skills.map((s) => s.name),
        district_id: districtIds,
        districts: districts.map((d) => ({ id: d.id, name: d.name })),
        city_id: cityIds,
        cities: cities.map((c) => ({ id: c.id, name: c.name })),
      };
    }));

    // ── Count ──
    const countQuery = `
      SELECT COUNT(DISTINCT jp.id) AS total
      FROM job_posts jp
      LEFT JOIN account a ON jp.account_id = a.id
      LEFT JOIN packages pkg ON jp.package_id = pkg.id
      LEFT JOIN currencies pkg_ccy ON pkg.currency_id = pkg_ccy.id
      ${whereClause}
    `;

    connection.query(countQuery, params, (countErr, countResult) => {
      if (countErr) {
        console.error("Count error:", countErr);
        return res.status(500).json({ error: "Count failed" });
      }

      res.status(200).json({
        data: transformed,
        totalRecords: countResult[0].total,
        currentPage: Number(page),
        totalPages: Math.ceil(countResult[0].total / limit),
      });
    });
  });
};

const updateJobPostStatus = (req, res) => {
  const { id, status, userId } = req.params; // add userId here

  if (!id || !status || !userId) {
    return res.status(400).json({
      error: "Job post ID, status, and userId are required",
    });
  }

  const normalizedStatus = status.trim();
  const isActiveStatus = normalizedStatus === "Active" || normalizedStatus === "Inactive";
  const columnToUpdate = isActiveStatus ? "status" : "approval_status";

  // Get previous value
  const selectSql = `SELECT ${columnToUpdate} FROM job_posts WHERE id = ?`;

  connection.query(selectSql, [id], (selectErr, rows) => {
    if (selectErr) return res.status(500).json({ error: "Internal Server Error" });
    if (!rows.length) return res.status(404).json({ error: "Job post not found" });

    const previousValue = rows[0][columnToUpdate];

    // Update job post
    const updateSql = `UPDATE job_posts SET ${columnToUpdate} = ? WHERE id = ?`;
    connection.query(updateSql, [normalizedStatus, id], (err, result) => {
      if (err) return res.status(500).json({ error: "Internal Server Error" });

      // Log history
      logAudit({
        tableName: "history",
        entityType: "job",
        entityId: id, // use job id here
        action: "UPDATED",
        data: { previousValue, normalizedStatus },
        changedBy: userId, // now defined
      });

      return res.status(200).json({
        message: `Job post ${columnToUpdate} updated to ${normalizedStatus}`,
      });
    });
  });
};



const getSingleJob = (req, res) => {
  const jobId = req.params.jobId;
  const singlejobquery = `
    SELECT 
        jp.id,
        jp.account_id,
        jp.job_title,
        jp.job_description,
        jp.skill_ids,
        GROUP_CONCAT(DISTINCT s.name ORDER BY s.name) AS skills,
        jp.time_from,
        jp.time_to,
        jt.name AS job_type,
        jt.id AS job_type_id,
        jp.min_salary,
        jp.max_salary,
        ccy.code AS currency,
        ccy.id AS currency_id,
        jp.min_experience,
        jp.max_experience,
        spec.name AS speciality,
        spec.id As spec_id,
        deg.name AS degree,
        deg.id AS degree_id,
        jp.no_of_positions,
        jp.industry,
        pkg.price AS packageprice,
        pkg.currency AS packagecurrency,
        co.name AS country,
        co.id AS country_id,
        d.name AS district,
        d.id AS district_id,
        ci.name AS city,
        ci.id AS city_id,
        jp.application_deadline,
        jp.created_at,
        jp.updated_at,
        jp.status,
        jp.approval_status
    FROM job_posts jp
    LEFT JOIN account a ON jp.account_id = a.id
    LEFT JOIN jobtypes jt ON jp.job_type_id = jt.id
    LEFT JOIN currencies ccy ON jp.currency_id = ccy.id
    LEFT JOIN packages pkg ON jp.package_id = pkg.id
    LEFT JOIN speciality spec ON jp.speciality_id = spec.id
    LEFT JOIN degreetypes deg ON jp.degree_id = deg.id
    LEFT JOIN countries co ON jp.country_id = co.id
    LEFT JOIN districts d ON jp.district_id = d.id
    LEFT JOIN cities ci ON jp.city_id = ci.id
   LEFT JOIN skills s 
  ON FIND_IN_SET(s.id, REPLACE(jp.skill_ids, ' ', ''))
    WHERE jp.id = ?
    GROUP BY jp.id
  `;

  connection.query(singlejobquery, [jobId], (err, results) => {
    if (err) {
      console.error("Error fetching job post:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    if (!results || results.length === 0) {
      return res.status(404).json({ error: "Job not found" });
    }

    const transformedResults = results.map(job => ({
      ...job,
      skill_ids: job.skill_ids
        ? String(job.skill_ids)
          .replace(/\s+/g, '') // remove spaces
          .split(',')
          .map(Number)
        : [],
      skills: job.skills
        ? String(job.skills).split(',')
        : [],
    }));


    res.status(200).json(transformedResults[0]); // single job
  });
};

const deleteJob = (req, res) => {
  const userId = req.params.userId;
  const jobId = req.params.jobId;

  const inactivateJobQuery = `
    UPDATE job_posts 
    SET is_active = 0 
    WHERE id = ? AND account_id = ?
  `;

  connection.query(inactivateJobQuery, [jobId, userId], (err, jobResult) => {
    if (err) {
      console.error("Error inactivating job:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    if (jobResult.affectedRows === 0) {
      return res.status(404).json({ error: "Job not found" });
    }

    return res.status(200).json({ message: "Job inactivated successfully" });
  });
};

const postJob = (req, res) => {
  const userId = req.params.userId;

  const {
    job_title, job_description, skill_ids,
    time_from, time_to, job_type_id,
    min_salary, max_salary, currency_id,
    min_experience, max_experience,
    speciality_id, degree_id,
    application_deadline, no_of_positions, industry,
    country_id, district_id, city_id,
    daily_budget, cost_per_click,
    job_location_type,
    screening_start, screening_end,
    interview_start, interview_end,
    expected_joining_date,
    chosen_package_id,
  } = req.body;

  // ─────────────────────────────────────────────
  // STEP 1: CHECK ACTIVE PACKAGE
  // ─────────────────────────────────────────────
  const packageQuery = chosen_package_id
    ? `SELECT cp.*, p.pricing_model, cp.package_snapshot
       FROM company_packages cp
       JOIN packages p ON p.id = cp.package_id
       WHERE cp.id = ? AND cp.account_id = ? AND cp.status = 'active' AND cp.end_date >= CURDATE()
       LIMIT 1`
    : `SELECT cp.*, p.pricing_model, cp.package_snapshot
       FROM company_packages cp
       JOIN packages p ON p.id = cp.package_id
       WHERE cp.account_id = ? AND cp.status = 'active' AND cp.end_date >= CURDATE()
       ORDER BY FIELD(p.pricing_model, 'duration_bundle', 'job_slot', 'cv_credits')
       LIMIT 1`;

  const packageParams = chosen_package_id
    ? [chosen_package_id, userId]
    : [userId];

  connection.query(packageQuery, packageParams, (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Package check failed" });
    }

    let activePackage = null;
    let billingModel = null;
    let deductField = null;

    // ─────────────────────────────────────────────
    // STEP 2: DETERMINE BILLING MODEL
    // ─────────────────────────────────────────────
    if (rows.length) {
      const pkg = rows[0];
      const snapshot = typeof pkg.package_snapshot === "string"
        ? JSON.parse(pkg.package_snapshot || "{}")
        : (pkg.package_snapshot || {});

      if (pkg.pricing_model === "duration_bundle") {
        if (pkg.used_posts < (snapshot.num_posts || 0)) {
          activePackage = pkg;
          billingModel = "duration_bundle";
          deductField = "used_posts";
        }
      } else if (pkg.pricing_model === "job_slot") {
        if (pkg.used_slots < (snapshot.slot_count || 0)) {
          activePackage = pkg;
          billingModel = "job_slot";
          deductField = "used_slots";
        }
      } else if (pkg.pricing_model === "cv_credits") {
        activePackage = pkg;
        billingModel = "cv_credits";
      }
    }

    // ─────────────────────────────────────────────
    // STEP 3: FINAL BILLING DECISION
    // ─────────────────────────────────────────────
    const finalCompanyPackageId = activePackage ? activePackage.id : null;
    const finalPackageId = activePackage ? activePackage.package_id : null;

    let finalBillingModel = null;
    let isSponsored = 0;

    if (activePackage) {
      finalBillingModel = billingModel;
    } else if (daily_budget && daily_budget > 0) {
      finalBillingModel = "daily_budget";
      isSponsored = 1;
    } else {
      return res.status(402).json({ error: "no_package" });
    }

    // ─────────────────────────────────────────────
    // STEP 4: INSERT JOB
    // ─────────────────────────────────────────────
    const sql = `
      INSERT INTO job_posts (
        account_id, job_title, job_description, skill_ids,
        time_from, time_to, job_type_id,
        min_salary, max_salary, currency_id,
        min_experience, max_experience,
        speciality_id, degree_id,
        application_deadline, no_of_positions, industry,
        country_id, district_id, city_id,
        is_sponsored, daily_budget, cost_per_click, spent_amount,
        approval_status, status,
        company_package_id, package_id, billing_model,
        job_location_type,
        screening_start, screening_end,
        interview_start, interview_end,
        expected_joining_date
      )
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `;

    const params = [
      userId,
      job_title,
      job_description,
      JSON.stringify(skill_ids),
      time_from,
      time_to,
      job_type_id,
      min_salary || null,
      max_salary || null,
      currency_id || null,
      min_experience,
      max_experience,
      speciality_id,
      degree_id,
      application_deadline,
      no_of_positions,
      industry,
      country_id || null,
      Array.isArray(district_id) && district_id.length ? JSON.stringify(district_id) : null,
      Array.isArray(city_id) && city_id.length ? JSON.stringify(city_id) : null,
      isSponsored,
      daily_budget || 0,
      cost_per_click || 0,
      0, // spent_amount
      (activePackage || finalBillingModel === "daily_budget") ? "Pending" : "Pending Payment",
      "Active",
      finalCompanyPackageId,
      finalPackageId,
      finalBillingModel,
      job_location_type || null,
      screening_start || null,
      screening_end || null,
      interview_start || null,
      interview_end || null,
      expected_joining_date || null,
    ];

    connection.query(sql, params, (err2, result) => {
      if (err2) {
        console.error("Insert error:", err2);
        return res.status(500).json({ error: "Database error" });
      }

      const jobId = result.insertId;

      // ─────────────────────────────────────────────
      // STEP 5: DEDUCT PACKAGE USAGE
      // ─────────────────────────────────────────────
      if (finalCompanyPackageId && deductField) {
        connection.query(
          `UPDATE company_packages 
           SET ${deductField} = ${deductField} + 1 
           WHERE id = ?`,
          [finalCompanyPackageId],
          (err3) => {
            if (err3) console.error("Deduction error:", err3);
          }
        );
      }

      // ─────────────────────────────────────────────
      // DONE 🎉
      // ─────────────────────────────────────────────
      return res.status(201).json({
        message: "Job posted successfully ✅",
        job_id: jobId,
        billing_model: finalBillingModel,
      });
    });
  });
};

const updatePostJob = (req, res) => {
  const { userId, jobId } = req.params;

  const {
    job_title,
    job_description,
    skill_ids,
    time_from,
    time_to,
    job_type_id,
    min_salary,
    max_salary,
    max_experience,
    min_experience,
    speciality_id,
    degree_id,
    application_deadline,
    no_of_positions,
    industry,
    currency_id,
    country_id,
    district_id,
    city_id,
    package_id,
    job_location_type,
    screening_start,
    screening_end,
    interview_start,
    interview_end,
    expected_joining_date,
  } = req.body;

  const sql = `
    UPDATE job_posts SET
      job_title = ?,
      job_description = ?,
      skill_ids = ?,
      time_from = ?,
      time_to = ?,
      job_type_id = ?,
      min_salary = ?,
      max_salary = ?,
      currency_id = ?,
      min_experience = ?,
      max_experience = ?,
      speciality_id = ?,
      degree_id = ?,
      application_deadline = ?,
      no_of_positions = ?,
      industry = ?,
      package_id = ?,
      country_id = ?,
      district_id = ?,
      city_id = ?,
      job_location_type = ?,
      screening_start = ?,
      screening_end = ?,
      interview_start = ?,
      interview_end = ?,
      expected_joining_date = ?,
      updated_at = NOW()
    WHERE id = ? AND account_id = ?
  `;

  const params = [
    job_title,
    job_description,
    JSON.stringify(skill_ids),
    time_from,
    time_to,
    job_type_id,
    min_salary || null,
    max_salary || null,
    currency_id || null,
    min_experience,
    max_experience,
    speciality_id,
    degree_id,
    application_deadline,
    no_of_positions,
    industry,
    package_id || null,
    country_id || null,
    Array.isArray(district_id) && district_id.length ? JSON.stringify(district_id) : null,
    Array.isArray(city_id) && city_id.length ? JSON.stringify(city_id) : null,
    job_location_type || null,
    screening_start || null,
    screening_end || null,
    interview_start || null,
    interview_end || null,
    expected_joining_date || null,
    jobId,
    userId,
  ];

  connection.query(sql, params, (error, result) => {
    if (error) {
      console.error("ERROR updating job post:", error);
      return res.status(500).json({ error: "Database error" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Job not found or unauthorized" });
    }

    logAudit({
      tableName: "history",
      entityType: "job",
      entityId: jobId,
      action: "UPDATED",
      data: {
        userId,
        job_title,
        job_description,
        skill_ids,
        time_from,
        time_to,
        job_type_id,
        min_salary,
        max_salary,
        currency_id,
        min_experience,
        max_experience,
        speciality_id,
        degree_id,
        application_deadline,
        no_of_positions,
        industry,
        package_id,
        country_id,
        district_id,
        city_id,
        job_location_type,
        screening_start,
        screening_end,
        interview_start,
        interview_end,
        expected_joining_date,
      },
      changedBy: userId,
    });

    return res.status(200).json({
      message: "Job updated successfully",
      job_id: jobId,
    });
  });
};

const createCompanyPackagesTable = () => {
  const createcompany_packagesTableQuery = `
CREATE TABLE IF NOT EXISTS company_packages (
 id INT AUTO_INCREMENT PRIMARY KEY,

  account_id INT NOT NULL,
  package_id INT NOT NULL,
  payment_id INT NOT NULL,
  pricing_model ENUM(
    'daily_budget',
    'per_apply',
    'job_slot',
    'duration_bundle',
    'cv_credits',
    'featured_boost'
  ) NOT NULL,

  -- 🟢 Common lifecycle
  start_date DATE,
  end_date DATE,
  status ENUM('active','expired','used','cancelled') DEFAULT 'active',

  -- 🟡 Usage tracking (depends on type)
  used_posts INT DEFAULT 0,
  used_credits INT DEFAULT 0,
  used_slots INT DEFAULT 0,
  used_budget DECIMAL(10,2) DEFAULT 0,
  used_applies INT DEFAULT 0,

  -- 🔵 Store original package config snapshot (VERY IMPORTANT)
  package_snapshot JSON,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (account_id) REFERENCES account(id),
  FOREIGN KEY (package_id) REFERENCES packages(id)
);
`;

  // Execute the queries to create the tables
  connection.query(createcompany_packagesTableQuery, function (err, results, fields) {
    if (err) {
      return console.error(err.message);
    }
    console.log("company_packages  table created successfully");
  })
}
const subcribePackage = ({ userId, packageId, paymentId }, callback) => {
  const getPackageQuery = `SELECT * FROM packages WHERE id = ?`;

  connection.query(getPackageQuery, [packageId], (err, result) => {
    if (err || !result.length) {
      return callback(new Error("Invalid package"));
    }

    const pkg = result[0];

    const duration =
      pkg.duration_days ||
      pkg.bundle_validity_days ||
      pkg.credit_expiry_days ||
      pkg.campaign_duration_days ||
      30;

    const insertQuery = `
      INSERT INTO company_packages
      (account_id, package_id, payment_id, pricing_model, start_date, end_date, package_snapshot)
      VALUES (?, ?, ?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL ? DAY), ?)
    `;

    connection.query(
      insertQuery,
      [
        userId,
        packageId,
        paymentId,        // ✅ now correctly passed in
        pkg.pricing_model,
        duration,
        JSON.stringify(pkg),
      ],
      (err2, result2) => {
        if (err2) {
          return callback(new Error("Subscription failed"));
        }

        // ✅ Return result via callback, NOT res.json()
        return callback(null, { subscriptionId: result2.insertId });
      }
    );
  });
};
const getUserPackages = (req, res) => {
  const { userId } = req.params;

  const subsQuery = `
    SELECT 
      cp.id as subscription_id,
      cp.start_date,
      cp.end_date,
      cp.pricing_model,
      cp.status,
      cp.used_posts,
      cp.used_credits,
      cp.used_slots,
      cp.package_snapshot
    FROM company_packages cp
    WHERE cp.account_id = ?
    ORDER BY cp.id DESC
  `;

const dailyJobsQuery = `
  SELECT 
    id, job_title, status, billing_model,
    cost_per_click  AS rate_per_unit,      -- your actual column
    daily_budget    AS daily_budget_cap,   -- your actual column
    0               AS daily_spend_today,  -- you don't track this yet
    spent_amount    AS total_spend,        -- your actual column
    application_deadline
  FROM job_posts
  WHERE account_id = ? AND billing_model = 'daily_budget'
  ORDER BY created_at DESC
`;

  // run both queries in parallel
  connection.query(subsQuery, [userId], (err, subsResult) => {
    if (err) return res.status(500).json({ error: "Failed to fetch packages" });

    connection.query(dailyJobsQuery, [userId], (err2, dailyJobs) => {
      if (err2) return res.status(500).json({ error: "Failed to fetch daily budget jobs" });

      // format subscription packages (existing logic unchanged)
      const packages = subsResult.map(item => {
        const pkg = typeof item.package_snapshot === "string"
          ? JSON.parse(item.package_snapshot)
          : item.package_snapshot;

        return {
          subscription_id: item.subscription_id,
          start_date:      item.start_date,
          end_date:        item.end_date,
          pricing_model:   item.pricing_model,
          status:          item.status,
          used_posts:      item.used_posts,
          used_credits:    item.used_credits,
          used_slots:      item.used_slots,
          package:         pkg,
          is_daily_budget: false,
        };
      });

      // format daily_budget jobs to match the same shape
      const dailyPackages = dailyJobs.map(job => ({
        subscription_id:  `job_${job.id}`,
        start_date:       null,
        end_date:         job.application_deadline,
        pricing_model:    "daily_budget",
        status:           job.status,
        used_posts:       0,
        used_credits:     0,
        used_slots:       0,
        is_daily_budget:  true,
        package: {
          name:              job.job_title,
          pricing_model:     "daily_budget",
          billing_model:     job.billing_model,
          rate_per_unit:     job.rate_per_unit,
          daily_budget_cap:  job.daily_budget_cap,
          daily_spend_today: job.daily_spend_today,
          total_spend:       job.total_spend,
          price:             job.total_spend, // actual spend so far
        },
      }));

      res.json([...packages, ...dailyPackages]);
    });
  });
};
const getTransactionHistory = (req, res) => {
  const { userId } = req.params;

  const query = `
    SELECT 
      cp.id              AS transaction_id,
      cp.account_id,
      cp.package_id,
      cp.pricing_model,
      cp.start_date,
      cp.end_date,
      cp.status,
      cp.used_posts,
      cp.used_credits,
      cp.used_slots,
      cp.used_budget,
      cp.used_applies,
      cp.created_at,
      cp.package_snapshot
    FROM company_packages cp
    WHERE cp.account_id = ?
    ORDER BY cp.created_at DESC
  `;

  connection.query(query, [userId], (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Failed to fetch transaction history" });
    }

    const transactions = results.map((item) => {
      const pkg =
        typeof item.package_snapshot === "string"
          ? JSON.parse(item.package_snapshot)
          : item.package_snapshot || {};

      // Pull units from snapshot based on pricing model
      const totalUnits =
        pkg.num_posts         ||
        pkg.credit_count      ||
        pkg.slot_count        ||
        pkg.daily_budget      ||
        pkg.applies_limit     ||
        0;

      const usedUnits =
        item.used_posts   ||
        item.used_credits ||
        item.used_slots   ||
        item.used_applies ||
        Number(item.used_budget) ||
        0;

      return {
        transaction_id: item.transaction_id,
        package_name:   pkg.name          || "Package",
        package_type:   pkg.type          || item.pricing_model,
        pricing_model:  item.pricing_model,
        amount_paid:    pkg.price         || 0,
        status:         item.status,
        start_date:     item.start_date,
        end_date:       item.end_date,
        purchased_at:   item.created_at,  // ← exact purchase timestamp
        total_units:    totalUnits,
        used_units:     usedUnits,
        remaining_units: Math.max(totalUnits - usedUnits, 0),
      };
    });

    res.json(transactions);
  });
};
const getJobTitle = (req, res) => {
  const userId = req.params.userId;

  const jobPostsQuery = `
    SELECT *
    FROM job_posts jp
    WHERE jp.account_id = ? 
      AND jp.approval_status = 'Approved'
      AND jp.status = 'Active'
  `;

  connection.query(jobPostsQuery, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching job posts:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
    res.status(200).json(results);
  });
};

const getTopCompanies = (req, res) => {
  const limit = parseInt(req.params.limit) || 10;

  if (isNaN(limit)) {
    return res.status(400).json({ error: "Invalid limit" });
  }

  const sql = `
      SELECT a.id, a.username, COUNT(j.id) AS total_jobs
  FROM account a
  JOIN job_posts j ON j.account_id = a.id
  GROUP BY a.id, a.username
  ORDER BY total_jobs DESC
  LIMIT ?;
    `;

  connection.query(sql, [limit], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    // returns an array: [ { id: 1, company_name: 'ABC Corp', totalPosts: 12 }, ... ]
    return res.json(results);
  });
}

const popularCategory = (req, res) => {
  const limit = parseInt(req.params.limit) || 10;

  if (isNaN(limit)) {
    return res.status(400).json({ error: "Invalid limit" });
  }

  const sql = `
      SELECT
        industry,
        COUNT(*) as totalPosts
      FROM job_posts
      GROUP BY industry
      ORDER BY totalPosts DESC
      LIMIT ?
    `;

  connection.query(sql, [limit], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    // returns an array:  [ { industry: 'Pathologists', totalPosts: 24 }, ... ]
    return res.json(results);
  });
}

const getTotalJobPosts = (accountId, type, value) => {
  return new Promise((resolve, reject) => {
    let query = "";
    let params = [accountId];

    if (type === "month") {
      query = `
        SELECT 
          DATE_FORMAT(created_at, '%Y-%m') AS label,
          COUNT(id) AS total
        FROM job_posts
        WHERE account_id = ?
          AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
        GROUP BY label
        ORDER BY label ASC
      `;
      params.push(value);
    }

    if (type === "year") {
      query = `
        SELECT 
          DATE_FORMAT(created_at, '%b') AS label,
          COUNT(id) AS total
        FROM job_posts
        WHERE account_id = ?
          AND YEAR(created_at) = ?
        GROUP BY MONTH(created_at)
        ORDER BY MONTH(created_at) ASC
      `;
      params.push(value);
    }

    connection.query(query, params, (err, results) => {
      if (err) {
        console.log(err)
        return reject(err);
      }
      resolve(results);
    });
  });
};



module.exports = {
  createJobPostTable,
  createCompanyPackagesTable,
  getJobbyRegAdmin,
  updateJobPostStatus,
  getAllJobs,
  getSingleJob,
  deleteJob,
  postJob,
  subcribePackage,
  updatePostJob,
  getJobTitle,
  getTopCompanies,
  popularCategory,
  getTotalJobPosts,
  getUserPackages,
  getTransactionHistory

}