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
  salary_period ENUM('hourly','daily','weekly','monthly','yearly') DEFAULT 'monthly',
  currency_id INT,
  min_experience VARCHAR(255),
  max_experience VARCHAR(255),
  speciality_id INT,
  degree_id INT,
  degreefields_id JSON NULL,
  application_deadline TIMESTAMP,
  no_of_positions INT,
  industry INT NULL,
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
  FOREIGN KEY (package_id) REFERENCES packages(id),
  FOREIGN KEY (industry) REFERENCES industry(id),
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
            const parsed =
              typeof job.district_id === "string"
                ? JSON.parse(job.district_id)
                : job.district_id;
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        })();

        const cityIds = (() => {
          try {
            const parsed =
              typeof job.city_id === "string"
                ? JSON.parse(job.city_id)
                : job.city_id;
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        })();

        // ── Fetch district names ──
        let districts = [];
        if (districtIds.length > 0) {
          try {
            districts = await new Promise((resolve, reject) => {
              connection.query(
                `SELECT id, name FROM districts WHERE id IN (?)`,
                [districtIds],
                (err, rows) => (err ? reject(err) : resolve(rows)),
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
                (err, rows) => (err ? reject(err) : resolve(rows)),
              );
            });
          } catch (e) {
            console.error("Error fetching cities for job", job.id, e);
          }
        }

        // ── Fetch skill names ──
        const skillIds = (() => {
          try {
            const parsed =
              typeof job.skill_ids === "string"
                ? JSON.parse(job.skill_ids)
                : job.skill_ids;
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        })();

        let skills = [];
        if (skillIds.length > 0) {
          try {
            skills = await new Promise((resolve, reject) => {
              connection.query(
                `SELECT id, name FROM skills WHERE id IN (?)`,
                [skillIds],
                (err, rows) => (err ? reject(err) : resolve(rows)),
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
          package: job.package_snapshot
            ? (() => {
                try {
                  return typeof job.package_snapshot === "string"
                    ? JSON.parse(job.package_snapshot)
                    : job.package_snapshot;
                } catch {
                  return null;
                }
              })()
            : null,
        };
      }),
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
    if (["Approved", "Pending", "UnApproved"].includes(status)) {
      whereClause += " AND jp.approval_status = ?";
    } else {
      whereClause += " AND jp.status = ?";
    }
    params.push(status);
  }

  if (search && name) {
    let column;
    switch (name) {
      case "packageprice":
        column = "pkg.price";
        break;
      case "currency":
        column = "pkg.currency";
        break;
      case "duration_days":
        column = "pkg.duration_days";
        break;
      case "package_name":
        column = "pkg.name";
        break;
      case "status":
        column = "jp.status";
        break;
      default:
        column = name;
    }

    if (name === "packageprice") {
      const num = Number(search);
      if (!isNaN(num) && search.trim() !== "") {
        whereClause += ` AND (pkg_ccy.code LIKE ? OR pkg.price LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`);
      } else {
        whereClause += ` AND pkg_ccy.code LIKE ?`;
        params.push(`${search}%`);
      }
    } else if (["jp.status", "jp.approval_status"].includes(column)) {
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
      COALESCE(ci.company_name, a.username) AS username,
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
    LEFT JOIN company_info ci ON a.id = ci.account_id
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
    const transformed = await Promise.all(
      results.map(async (job) => {
        const parseJsonIds = (val) => {
          try {
            const parsed = typeof val === "string" ? JSON.parse(val) : val;
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
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
              (err, rows) => (err ? reject(err) : resolve(rows)),
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
      }),
    );

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
const approveJob = (req, res) => {
  const { jobId } = req.params;

  // ─────────────────────────────────────────────
  // STEP 1: GET JOB DETAILS
  // ─────────────────────────────────────────────
  connection.query(
    `SELECT id, account_id, billing_model, daily_budget, approval_status
     FROM job_posts
     WHERE id = ?
     LIMIT 1`,
    [jobId],
    (err, jobs) => {
      if (err) {
        console.error("approveJob fetch error:", err);
        return res
          .status(500)
          .json({ success: false, message: "Failed to fetch job" });
      }

      if (!jobs.length) {
        return res
          .status(404)
          .json({ success: false, message: "Job not found" });
      }

      const job = jobs[0];

      if (job.approval_status === "Approved") {
        return res
          .status(400)
          .json({ success: false, message: "Job is already approved" });
      }

      // ─────────────────────────────────────────────
      // STEP 2: NON-DAILY-BUDGET — just approve, no charge
      // ─────────────────────────────────────────────
      if (job.billing_model !== "daily_budget") {
        connection.query(
          `UPDATE job_posts SET approval_status = 'Approved' WHERE id = ?`,
          [jobId],
          (updateErr) => {
            if (updateErr) {
              console.error("Approval update error:", updateErr);
              return res
                .status(500)
                .json({ success: false, message: "Approval failed" });
            }

            // ✅ ALREADY EXISTS — job timeline
            logAudit({
              tableName: "history",
              entityType: "job",
              entityId: jobId,
              action: "APPROVED",
              data: { event: "Job approved", billing_model: job.billing_model },
              changedBy: job.account_id,
            });

            // ✅ ADD THIS — employer timeline
            logAudit({
              tableName: "history",
              entityType: "employer",
              entityId: job.account_id,
              action: "APPROVED",
              data: {
                event: "Job approved by admin",
                job_id: jobId,
                billing_model: job.billing_model,
              },
              changedBy: job.account_id,
            });

            return res.json({ success: true, message: "Job approved ✅" });
          },
        );
        return;
      }

      // ─────────────────────────────────────────────
      // STEP 3: DAILY BUDGET — look up saved card
      // ─────────────────────────────────────────────
      connection.query(
        `SELECT id, card_last4, card_brand, card_holder, payment_token
         FROM saved_cards
         WHERE account_id = ?
         LIMIT 1`,
        [job.account_id],
        (cardErr, cards) => {
          if (cardErr) {
            console.error("Card lookup error:", cardErr);
            return res
              .status(500)
              .json({ success: false, message: "Card lookup failed" });
          }

          if (!cards.length) {
            return res.status(402).json({
              success: false,
              message:
                "No saved card found for this account — cannot approve daily budget job",
            });
          }

          const card = cards[0];

          // ─────────────────────────────────────────────
          // STEP 4: TRANSACTION — charge card + approve job
          // ─────────────────────────────────────────────
          connection.beginTransaction((txErr) => {
            if (txErr) {
              return res
                .status(500)
                .json({ success: false, message: "Transaction failed" });
            }

            // Insert payment record
            // In production: call your real payment gateway here using card.payment_token
            const insertPayment = `
              INSERT INTO payment
              (account_id, job_id,
               card_last4, card_brand, card_holder,
               amount, currency,
               payment_type, payment_method, payment_status,
               payment_reference)
              VALUES (?, ?, ?, ?, ?, ?, 'PKR', 'job', 'Card', 'Paid', ?)
            `;

            connection.query(
              insertPayment,
              [
                job.account_id,
                job.id,
                card.card_last4,
                card.card_brand,
                card.card_holder,
                job.daily_budget,
                `daily_budget_job_${job.id}_${Date.now()}`,
              ],
              (payErr, payResult) => {
                if (payErr) {
                  console.error("Payment insert error:", payErr);
                  return connection.rollback(() =>
                    res
                      .status(500)
                      .json({
                        success: false,
                        message: "Payment record failed",
                      }),
                  );
                }

                // Approve the job
                connection.query(
                  `UPDATE job_posts SET approval_status = 'Approved' WHERE id = ?`,
                  [jobId],
                  (updateErr) => {
                    if (updateErr) {
                      console.error("Job approval error:", updateErr);
                      return connection.rollback(() =>
                        res
                          .status(500)
                          .json({
                            success: false,
                            message: "Job approval failed",
                          }),
                      );
                    }

                    connection.commit((commitErr) => {
                      if (commitErr) {
                        return connection.rollback(() =>
                          res
                            .status(500)
                            .json({ success: false, message: "Commit failed" }),
                        );
                      }

                      // ✅ ALREADY EXISTS — job timeline
                      logAudit({
                        tableName: "history",
                        entityType: "job",
                        entityId: jobId,
                        action: "APPROVED",
                        data: {
                          event: "Job approved with card charge",
                          billing_model: "daily_budget",
                          daily_budget: job.daily_budget,
                          payment_id: payResult.insertId,
                        },
                        changedBy: job.account_id,
                      });

                      // ✅ ADD THIS — employer timeline
                      logAudit({
                        tableName: "history",
                        entityType: "employer",
                        entityId: job.account_id,
                        action: "APPROVED",
                        data: {
                          event: "Job approved by admin with card charge",
                          job_id: jobId,
                          billing_model: "daily_budget",
                          daily_budget: job.daily_budget,
                          payment_id: payResult.insertId,
                        },
                        changedBy: job.account_id,
                      });

                      // ✅ ADD THIS — also log the payment on employer timeline
                      logAudit({
                        tableName: "history",
                        entityType: "employer",
                        entityId: job.account_id,
                        action: "PAYMENT",
                        data: {
                          event: "Daily budget charge on job approval",
                          job_id: jobId,
                          amount: job.daily_budget,
                          payment_id: payResult.insertId,
                        },
                        changedBy: job.account_id,
                      });

                      return res.json({
                        success: true,
                        message: "Job approved and card charged ✅",
                        payment_id: payResult.insertId,
                      });
                    });
                  },
                );
              },
            );
          });
        },
      );
    },
  );
};
const updateJobPostStatus = (req, res) => {
  const { id, status, userId } = req.params;

  if (!id || !status || !userId) {
    return res.status(400).json({
      error: "Job post ID, status, and userId are required",
    });
  }

  const normalizedStatus = status.trim();
  const isActiveStatus =
    normalizedStatus === "Active" || normalizedStatus === "Inactive";
  const columnToUpdate = isActiveStatus ? "status" : "approval_status";

  // ✅ Action decide karo status ke hisaab se
  let auditAction;
  if (normalizedStatus === "Active") {
    auditAction = "ACTIVE";
  } else if (normalizedStatus === "Inactive") {
    auditAction = "INACTIVE";
  } else if (normalizedStatus === "Approved") {
    auditAction = "APPROVED";
  } else if (normalizedStatus === "UnApproved") {
    auditAction = "UNAPPROVED";
  } else {
    auditAction = "UPDATED";
  }

  const selectSql = `SELECT ${columnToUpdate} FROM job_posts WHERE id = ?`;

  connection.query(selectSql, [id], (selectErr, rows) => {
    if (selectErr)
      return res.status(500).json({ error: "Internal Server Error" });
    if (!rows.length)
      return res.status(404).json({ error: "Job post not found" });

    const previousValue = rows[0][columnToUpdate];

    const updateSql = `UPDATE job_posts SET ${columnToUpdate} = ? WHERE id = ?`;
    connection.query(updateSql, [normalizedStatus, id], (err, result) => {
      if (err) return res.status(500).json({ error: "Internal Server Error" });

      // ✅ ALREADY EXISTS — job timeline
      logAudit({
        tableName: "history",
        entityType: "job",
        entityId: id,
        action: auditAction,
        data: {
          previousValue,
          newValue: normalizedStatus,
          event:
            normalizedStatus === "Active"
              ? "Job activated"
              : normalizedStatus === "Inactive"
                ? "Job deactivated"
                : `Approval status changed to ${normalizedStatus}`,
        },
        changedBy: userId,
      });

      // ✅ ADD THIS — fetch job's account_id then log on employer timeline
      connection.query(
        `SELECT account_id FROM job_posts WHERE id = ? LIMIT 1`,
        [id],
        (fetchErr, jobRows) => {
          if (!fetchErr && jobRows.length > 0) {
            const employerAccountId = jobRows[0].account_id;

            logAudit({
              tableName: "history",
              entityType: "employer",
              entityId: employerAccountId,
              action: auditAction,
              data: {
                event:
                  normalizedStatus === "Active"
                    ? "Job activated by admin"
                    : normalizedStatus === "Inactive"
                      ? "Job deactivated by admin"
                      : `Job approval status changed to ${normalizedStatus}`,
                job_id: id,
                changed_by_admin: userId,
                previousValue,
                newValue: normalizedStatus,
              },
              changedBy: userId,
            });
          }
        },
      );

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

    const transformedResults = results.map((job) => ({
      ...job,
      skill_ids: job.skill_ids
        ? String(job.skill_ids)
            .replace(/\s+/g, "") // remove spaces
            .split(",")
            .map(Number)
        : [],
      skills: job.skills ? String(job.skills).split(",") : [],
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

const triggerJobAlerts = (jobId) => {
  const jobSql = `
    SELECT 
      jp.id,
      jp.job_title,
      jp.skill_ids,
      jp.min_salary,
      jp.max_salary,
      jp.city_id,
      jp.country_id,
      jp.job_type_id,
      jt.name AS job_type_name
    FROM job_posts jp
    LEFT JOIN jobtypes jt ON jt.id = jp.job_type_id
    WHERE jp.id = ?
    LIMIT 1
  `;

  connection.query(jobSql, [jobId], (err, jobs) => {
    if (err || !jobs.length) return;

    const job = jobs[0];

    const parseJSON = (val) => {
      if (!val) return [];
      try {
        return typeof val === "string" ? JSON.parse(val) : val;
      } catch {
        return [];
      }
    };

    const jobSkillIds = parseJSON(job.skill_ids);
    const jobCityIds = parseJSON(job.city_id);

    const candidatesSql = `
      SELECT 
        jp.candidate_id,
        jp.desired_job_titles,
        jp.job_type,
        jp.min_salary,
        jp.max_salary,
        jp.preferred_country_id,
        jp.preferred_city_ids,
        ci.skills AS candidate_skills
      FROM job_preferences jp
      JOIN candidate_info ci ON ci.id = jp.candidate_id
      WHERE jp.alerts_enabled = 1
    `;

    connection.query(candidatesSql, (err2, candidates) => {
      if (err2 || !candidates.length) return;

      const alertsToInsert = [];

      candidates.forEach((candidate) => {
        const desiredTitles = parseJSON(candidate.desired_job_titles);
        const preferredJobTypes = parseJSON(candidate.job_type);
        const preferredCityIds = parseJSON(candidate.preferred_city_ids);
        const candidateSkills = parseJSON(candidate.candidate_skills);

        let matchScore = 0;

        // 1. Job Title match
        const jobTitleLower = (job.job_title || "").toLowerCase();
        const titleMatch = desiredTitles.some(
          (title) =>
            jobTitleLower.includes(title.toLowerCase()) ||
            title.toLowerCase().includes(jobTitleLower),
        );
        if (titleMatch) matchScore += 3;

        // 2. Skills match
        const skillsMatch = candidateSkills.some((skillId) =>
          jobSkillIds.includes(skillId),
        );
        if (skillsMatch) matchScore += 2;

        // 3. Salary match
        if (candidate.min_salary && candidate.max_salary) {
          if (
            (job.max_salary || 0) >= candidate.min_salary &&
            (job.min_salary || 0) <= candidate.max_salary
          ) {
            matchScore += 1;
          }
        }

        // 4. Country match
        if (
          candidate.preferred_country_id &&
          job.country_id &&
          Number(candidate.preferred_country_id) === Number(job.country_id)
        ) {
          matchScore += 1;
        }

        // 5. City match
        if (preferredCityIds.length && jobCityIds.length) {
          const cityMatch = preferredCityIds.some((cityId) =>
            jobCityIds.includes(Number(cityId)),
          );
          if (cityMatch) matchScore += 1;
        }

        // 6. Job Type match
        if (preferredJobTypes.length && job.job_type_name) {
          const typeMatch = preferredJobTypes.some(
            (type) => type.toLowerCase() === job.job_type_name.toLowerCase(),
          );
          if (typeMatch) matchScore += 1;
        }

        if (matchScore >= 2) {
          alertsToInsert.push([candidate.candidate_id, jobId]);
        }
      });

      if (!alertsToInsert.length) return;

      connection.query(
        `INSERT IGNORE INTO job_alerts (candidate_id, job_id) VALUES ?`,
        [alertsToInsert],
        (err3, result) => {
          if (err3) {
            console.error("triggerJobAlerts insert error:", err3);
            return;
          }
          console.log(
            `Job alerts created: ${result.affectedRows} for job ${jobId}`,
          );
        },
      );
    });
  });
};

const postJob = (req, res) => {
  const userId = req.params.userId;

  const {
    job_title,
    job_description,
    skill_ids,
    time_from,
    time_to,
    job_type_id,
    min_salary,
    max_salary,
    salary_period,
    currency_id,
    min_experience,
    max_experience,
    speciality_id,
    degree_id,
    degreefields_id,
    application_deadline,
    no_of_positions,
    industry,
    country_id,
    district_id,
    city_id,
    daily_budget,
    job_location_type,
    screening_start,
    screening_end,
    interview_start,
    interview_end,
    expected_joining_date,
    chosen_package_id,
    chosen_daily_package_id, // ← ADD THIS to destructuring
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
      const snapshot =
        typeof pkg.package_snapshot === "string"
          ? JSON.parse(pkg.package_snapshot || "{}")
          : pkg.package_snapshot || {};

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
      // daily_budget packages are intentionally NOT matched here
      // they are handled separately via chosen_daily_package_id
    }

    // ─────────────────────────────────────────────
    // STEP 3: FINAL BILLING DECISION
    // ─────────────────────────────────────────────
    let finalCompanyPackageId = activePackage ? activePackage.id : null;
    let finalPackageId = activePackage ? activePackage.package_id : null;
    let finalBillingModel = null;
    let isSponsored = 0;

    if (activePackage) {
      finalBillingModel = billingModel;
    } else if (daily_budget && daily_budget > 0 && chosen_daily_package_id) {
      finalBillingModel = "daily_budget";
      isSponsored = 1;
      // ← Set these from the chosen daily package
      finalCompanyPackageId = chosen_daily_package_id;
    } else {
      return res.status(402).json({ error: "no_package" });
    }

    // ─────────────────────────────────────────────
    // STEP 4: INSERT JOB
    // ─────────────────────────────────────────────
    const proceedWithJobInsert = () => {
      if (finalBillingModel === "daily_budget" && chosen_daily_package_id) {
        // 1. Fetch the package template to get rate_per_unit and duration
        connection.query(
          `SELECT * FROM packages WHERE id = ?`,
          [chosen_daily_package_id],
          (err, pkgRows) => {
            if (err || !pkgRows.length) {
              return res
                .status(500)
                .json({ error: "Invalid daily budget package" });
            }

            const pkg = pkgRows[0];
            const resolvedCpc = parseFloat(pkg.rate_per_unit || 0);
            const duration =
              pkg.campaign_duration_days || pkg.duration_days || 30;

            // 2. Create a company_packages row for this daily budget subscription
            connection.query(
              `INSERT INTO company_packages 
           (account_id, package_id, payment_id, pricing_model, start_date, end_date, package_snapshot)
           VALUES (?, ?, 0, 'daily_budget', CURDATE(), DATE_ADD(CURDATE(), INTERVAL ? DAY), ?)`,
              [userId, chosen_daily_package_id, duration, JSON.stringify(pkg)],
              (err2, result2) => {
                if (err2) {
                  console.error(
                    "Failed to create company_package for daily_budget:",
                    err2,
                  );
                  return res
                    .status(500)
                    .json({ error: "Failed to create package subscription" });
                }

                const newCompanyPackageId = result2.insertId;
                finalCompanyPackageId = newCompanyPackageId;
                finalPackageId = pkg.id;

                insertJob(resolvedCpc);
              },
            );
          },
        );
      } else {
        insertJob(0);
      }
    };
    function insertJob(resolvedCpc) {
      const parsedUserId = parseInt(userId);
      const sql = `
        INSERT INTO job_posts (
          account_id, job_title, job_description, skill_ids,
          time_from, time_to, job_type_id,
          min_salary, max_salary, salary_period, currency_id,
          min_experience, max_experience,
          speciality_id, degree_id, degreefields_id,
          application_deadline, no_of_positions, industry,
          country_id, district_id, city_id,
          is_sponsored, daily_budget, cost_per_click, spent_amount,
          approval_status, status,
          company_package_id, package_id, billing_model,
          job_location_type,
          screening_start, screening_end,
          interview_start, interview_end,
          expected_joining_date,
          chosen_daily_package_id
        )
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
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
        salary_period || "monthly",
        currency_id || null,
        min_experience,
        max_experience,
        speciality_id,
        degree_id,
        Array.isArray(degreefields_id) && degreefields_id.length
  ? JSON.stringify(degreefields_id)
  : null,
        application_deadline,
        no_of_positions,
        industry,
        country_id || null,
        Array.isArray(district_id) && district_id.length
          ? JSON.stringify(district_id)
          : null,
        Array.isArray(city_id) && city_id.length
          ? JSON.stringify(city_id)
          : null,
        isSponsored,
        daily_budget || 0,
        resolvedCpc, // ← from package
        0, // spent_amount
        "Pending",
        "Active",
        finalCompanyPackageId, // ← now correctly set to chosen_daily_package_id
        finalPackageId,
        finalBillingModel,
        job_location_type || null,
        screening_start || null,
        screening_end || null,
        interview_start || null,
        interview_end || null,
        expected_joining_date || null,
        finalBillingModel === "daily_budget" ? chosen_daily_package_id : null,
      ];

      connection.query(sql, params, (err2, result) => {
        if (err2) {
          console.error("Insert error:", err2);
          return res.status(500).json({ error: "Database error" });
        }

        const jobId = result.insertId;

        if (finalCompanyPackageId && deductField) {
          connection.query(
            `UPDATE company_packages SET ${deductField} = ${deductField} + 1 WHERE id = ?`,
            [finalCompanyPackageId],
            (err3) => {
              if (err3) console.error("Deduction error:", err3);
            },
          );
        }

        triggerJobAlerts(jobId);

        // Audit log
        logAudit({
          tableName: "history",
          entityType: "job",
          entityId: jobId,
          action: "CREATED",
          data: {
            event: "Job posted",
            job_title,
            billing_model: finalBillingModel,
          },
          changedBy: parsedUserId,
        });
        // ✅ ADD THIS — saves under entity_type: "employer" so it shows in employer history
        logAudit({
          tableName: "history",
          entityType: "employer",
          entityId: parsedUserId, // ← employer's account_id, NOT job id
          action: "CREATED",
          data: {
            event: "Job posted",
            job_id: jobId,
            job_title,
            billing_model: finalBillingModel,
          },
          changedBy: parsedUserId,
        });
        return res.status(201).json({
          message:
            finalBillingModel === "daily_budget"
              ? "Job posted successfully ✅ — pending admin approval. Your saved card will be charged once approved."
              : "Job posted successfully ✅",
          job_id: jobId,
          billing_model: finalBillingModel,
        });
      });
    }

    // ─────────────────────────────────────────────
    // Daily budget: verify saved card first
    // ─────────────────────────────────────────────
    if (finalBillingModel === "daily_budget") {
      connection.query(
        `SELECT id FROM saved_cards WHERE account_id = ? LIMIT 1`,
        [userId],
        (cardErr, cards) => {
          if (cardErr)
            return res.status(500).json({ error: "Card lookup failed" });
          if (!cards.length) {
            return res.status(402).json({
              error: "no_saved_card",
              message:
                "A saved card is required to post a daily budget job. Please add a card first.",
            });
          }
          proceedWithJobInsert();
        },
      );
    } else {
      proceedWithJobInsert();
    }
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
    Array.isArray(district_id) && district_id.length
      ? JSON.stringify(district_id)
      : null,
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
    logAudit({
      tableName: "history",
      entityType: "employer",
      entityId: userId,
      action: "UPDATED",
      data: { event: "Job updated", job_title, job_id: jobId },
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
  connection.query(
    createcompany_packagesTableQuery,
    function (err, results, fields) {
      if (err) {
        return console.error(err.message);
      }
      console.log("company_packages  table created successfully");
    },
  );
};
const subcribePackage = (req, res) => {
  const body = req.body ?? req;
  const { userId, packageId, jobId, paymentId } = body;

  const resolvedPaymentId = paymentId || jobId || 0;

  if (!userId || !packageId) {
    if (typeof res === "function")
      return res(new Error("userId and packageId required"));
    return res.status(400).json({ error: "userId and packageId required" });
  }

  // ✅ CHECK: block if same package already active and not expired
  const duplicateCheck = `
    SELECT id FROM company_packages
    WHERE account_id = ? AND package_id = ?
    AND LOWER(status) = 'active'
    AND end_date >= CURDATE()
    LIMIT 1
  `;

  connection.query(
    duplicateCheck,
    [userId, packageId],
    (errCheck, existing) => {
      if (errCheck) {
        if (typeof res === "function")
          return res(new Error("Duplicate check failed"));
        return res.status(500).json({ error: "Duplicate check failed" });
      }

      if (existing.length > 0) {
        if (typeof res === "function")
          return res(
            new Error(
              "Package already active. You can repurchase after it expires.",
            ),
          );
        return res
          .status(409)
          .json({
            error:
              "Package already active. You can repurchase after it expires.",
          });
      }

      // proceed with normal subscribe flow
      connection.query(
        `SELECT * FROM packages WHERE id = ?`,
        [packageId],
        (err, result) => {
          if (err || !result.length) {
            if (typeof res === "function")
              return res(new Error("Invalid package"));
            return res.status(404).json({ error: "Invalid package" });
          }

          const pkg = result[0];
          const duration =
            pkg.duration_days ||
            pkg.bundle_validity_days ||
            pkg.credit_expiry_days ||
            pkg.campaign_duration_days ||
            30;

          connection.query(
            `INSERT INTO company_packages
         (account_id, package_id, payment_id, pricing_model, start_date, end_date, package_snapshot)
         VALUES (?, ?, ?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL ? DAY), ?)`,
            [
              userId,
              packageId,
              resolvedPaymentId,
              pkg.pricing_model,
              duration,
              JSON.stringify(pkg),
            ],
            (err2, result2) => {
              if (err2) {
                console.error("Subscription insert error:", err2);

                if (typeof res === "function") {
                  return res(new Error("Subscription failed"));
                }

                return res.status(500).json({
                  error: "Subscription failed",
                });
              }

              // Audit log
              logAudit({
                tableName: "history",
                entityType: "employer",
                entityId: userId,
                action: "PACKAGE_SUBSCRIBED",
                data: {
                  event: "Package subscribed",
                  packageId,
                  pricing_model: pkg.pricing_model,
                  subscriptionId: result2.insertId,
                },
                changedBy: userId,
              });

              if (typeof res === "function") {
                return res(null, {
                  subscriptionId: result2.insertId,
                });
              }

              return res.status(201).json({
                message: "Package subscribed successfully ✅",
                subscriptionId: result2.insertId,
              });
            },
          );
        },
      );
    },
  );
};
// Sirf internal use ke liye (no res/req)
const subcribePackageInternal = ({ userId, packageId, paymentId }) => {
  return new Promise((resolve, reject) => {
    connection.query(
      `SELECT * FROM packages WHERE id = ?`,
      [packageId],
      (err, result) => {
        if (err || !result.length) {
          return reject(new Error("Invalid package"));
        }

        const pkg = result[0];

        const duration = pkg.duration_days || pkg.bundle_validity_days || 30;

        connection.query(
          `INSERT INTO company_packages
           (account_id, package_id, payment_id, pricing_model, start_date, end_date, package_snapshot)
           VALUES (?, ?, ?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL ? DAY), ?)`,
          [
            userId,
            packageId,
            paymentId,
            pkg.pricing_model,
            duration,
            JSON.stringify(pkg),
          ],
          (err2, result2) => {
            if (err2) {
              return reject(new Error("Subscription failed"));
            }

            // Audit log
            logAudit({
              tableName: "history",
              entityType: "employer",
              entityId: userId,
              action: "PACKAGE_SUBSCRIBED",
              data: {
                event: "Package subscribed",
                packageId,
                pricing_model: pkg.pricing_model,
                subscriptionId: result2.insertId,
              },
              changedBy: userId,
            });

            resolve({
              subscriptionId: result2.insertId,
            });
          },
        );
      },
    );
  });
};

// In jobModel.js, replace getUserPackages with this:
const getUserPackages = (req, res) => {
  const userId = req.params.userId;
  const now = new Date();

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
      cp.used_budget,
      cp.package_snapshot
    FROM company_packages cp
    WHERE cp.account_id = ?
    ORDER BY cp.id DESC
  `;

  const dailyJobsQuery = `
    SELECT 
      id, job_title, status, billing_model,
      daily_budget  AS daily_budget_cap,
      spent_amount  AS total_spend,
      application_deadline
    FROM job_posts
    WHERE account_id = ?
      AND billing_model = 'daily_budget'
    ORDER BY created_at DESC
  `;

  connection.query(subsQuery, [userId], (err, subsResult) => {
    if (err) return res.status(500).json({ error: "Failed to fetch packages" });

    connection.query(dailyJobsQuery, [userId], (err2, dailyJobs) => {
      if (err2) return res.status(500).json({ error: "Failed to fetch daily budget jobs" });

      const packages = subsResult.map((p) => {
        const pkg = typeof p.package_snapshot === "string"
          ? JSON.parse(p.package_snapshot)
          : p.package_snapshot || {};

        const isExpired = p.end_date && new Date(p.end_date) < now;

        return {
          subscription_id: p.subscription_id || p.id,
          start_date:      p.start_date,
          end_date:        p.end_date,
          pricing_model:   p.pricing_model,
          status:          isExpired ? "expired" : (p.status?.toLowerCase() || "active"),
          used_posts:      p.used_posts,
          used_credits:    p.used_credits,
          used_slots:      p.used_slots,
          package:         { ...pkg, id: pkg.id },
          remaining_credits: Math.max((pkg.credit_count || 0) - (p.used_credits || 0), 0),
          is_daily_budget: false,
        };
      });

      const dailyPackages = dailyJobs.map((job) => {
        const isExpired = job.application_deadline && new Date(job.application_deadline) < now;

        return {
          subscription_id: `job_${job.id}`,
          start_date:      null,
          end_date:        job.application_deadline,
          pricing_model:   "daily_budget",
          status:          isExpired ? "expired" : (job.status?.toLowerCase() || "active"),
          used_posts:      0,
          used_credits:    0,
          used_slots:      0,
          is_daily_budget: true,
          package: {
            name:              job.job_title,
            pricing_model:     "daily_budget",
            billing_model:     job.billing_model,
            daily_budget_cap:  job.daily_budget_cap,
            daily_spend_today: 0,
            total_spend:       job.total_spend,
            price:             job.total_spend,
          },
        };
      });

      res.json([...packages, ...dailyPackages]);
    });
  });
};
const getTransactionHistory = (req, res) => {
  const { userId } = req.params;

  // Query 1: Package-based transactions (existing)
  const packageQuery = `
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

  // Query 2: Daily budget jobs
  const dailyBudgetQuery = `
    SELECT
      id, job_title, status, billing_model,
      daily_budget, cost_per_click,
      spent_amount, application_deadline,
      created_at
    FROM job_posts
    WHERE account_id = ? AND billing_model = 'daily_budget'
    ORDER BY created_at DESC
  `;

  connection.query(packageQuery, [userId], (err, packageResults) => {
    if (err)
      return res
        .status(500)
        .json({ error: "Failed to fetch transaction history" });

    connection.query(dailyBudgetQuery, [userId], (err2, dailyResults) => {
      if (err2)
        return res
          .status(500)
          .json({ error: "Failed to fetch daily budget jobs" });

      // Format package transactions (your existing logic, unchanged)
      const packageTransactions = packageResults.map((item) => {
        const pkg =
          typeof item.package_snapshot === "string"
            ? JSON.parse(item.package_snapshot)
            : item.package_snapshot || {};

        const totalUnits =
          pkg.num_posts ||
          pkg.credit_count ||
          pkg.slot_count ||
          pkg.daily_budget ||
          pkg.applies_limit ||
          0;

        const usedUnits =
          item.used_posts ||
          item.used_credits ||
          item.used_slots ||
          item.used_applies ||
          Number(item.used_budget) ||
          0;

        return {
          transaction_id: item.transaction_id,
          package_name: pkg.name || "Package",
          package_type: pkg.type || item.pricing_model,
          pricing_model: item.pricing_model,
          amount_paid: pkg.price || 0,
          status: item.status,
          start_date: item.start_date,
          end_date: item.end_date,
          purchased_at: item.created_at,
          total_units: totalUnits,
          used_units: usedUnits,
          remaining_units: Math.max(totalUnits - usedUnits, 0),
          is_daily_budget: false,
        };
      });

      // Format daily budget jobs to match the same shape
      const dailyTransactions = dailyResults.map((job) => ({
        transaction_id: `job_${job.id}`,
        package_name: job.billing_model
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase()),
        package_type: "daily_budget",
        pricing_model: "daily_budget",
        amount_paid: job.spent_amount || 0, // actual spend so far
        status: job.status,
        start_date: job.created_at,
        end_date: job.application_deadline,
        purchased_at: job.created_at,
        total_units: job.daily_budget || 0, // the cap they set
        used_units: job.spent_amount || 0, // what's been spent
        remaining_units: Math.max(
          (job.daily_budget || 0) - (job.spent_amount || 0),
          0,
        ),
        is_daily_budget: true,
        // extra detail useful for the UI
        cost_per_click: job.cost_per_click || 0,
      }));

      // Merge and sort everything by date descending
      const allTransactions = [
        ...packageTransactions,
        ...dailyTransactions,
      ].sort((a, b) => new Date(b.purchased_at) - new Date(a.purchased_at));

      res.json(allTransactions);
    });
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
      console.error("Error fetching job posts:", err);
      return res.status(500).json({ error: "Internal Server Error" });
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
};

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
};

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
        console.log(err);
        return reject(err);
      }
      resolve(results);
    });
  });
};

const viewCandidate = (req, res) => {
  const { jobId, candidateId } = req.params;
  const userId = req.params.userId; // company account_id from auth middleware

  // ─────────────────────────────────────────────
  // STEP 1: GET JOB DETAILS
  // ─────────────────────────────────────────────
  connection.query(
    `SELECT id, account_id, billing_model, daily_budget, cost_per_click, spent_amount
     FROM job_posts
     WHERE id = ? AND account_id = ? AND approval_status = 'Approved' AND status = 'Active'
     LIMIT 1`,
    [jobId, userId],
    (err, jobs) => {
      if (err) {
        console.error("viewCandidate job fetch error:", err);
        return res
          .status(500)
          .json({ success: false, message: "Failed to fetch job" });
      }

      if (!jobs.length) {
        return res
          .status(404)
          .json({ success: false, message: "Job not found" });
      }

      const job = jobs[0];

      // ─────────────────────────────────────────────
      // STEP 2: IF DAILY BUDGET — CHECK CAP + CHARGE
      // ─────────────────────────────────────────────
      const fetchCandidate = () => {
        connection.query(
          `SELECT 
             a.id, a.username, a.email,
             cp.full_name, cp.phone, cp.profile_picture,
             cp.dob, cp.gender, cp.location,
             cp.bio, cp.experience_years,
             cp.resume_url
           FROM account a
           LEFT JOIN candidate_profile cp ON cp.account_id = a.id
           WHERE a.id = ?
           LIMIT 1`,
          [candidateId],
          (candErr, candidates) => {
            if (candErr) {
              console.error("Candidate fetch error:", candErr);
              return res
                .status(500)
                .json({ success: false, message: "Failed to fetch candidate" });
            }

            if (!candidates.length) {
              return res
                .status(404)
                .json({ success: false, message: "Candidate not found" });
            }

            return res.json({
              success: true,
              candidate: candidates[0],
            });
          },
        );
      };

      if (job.billing_model !== "daily_budget") {
        // Non daily budget job — just return candidate directly
        return fetchCandidate();
      }

      // ─────────────────────────────────────────────
      // STEP 3: CHECK IF DAILY BUDGET CAP IS HIT
      // ─────────────────────────────────────────────
      if (job.spent_amount >= job.daily_budget) {
        return res.status(402).json({
          success: false,
          error: "daily_budget_exceeded",
          message:
            "You have reached your daily budget cap. You can view more candidates tomorrow.",
          spent_amount: job.spent_amount,
          daily_budget: job.daily_budget,
        });
      }

      // ─────────────────────────────────────────────
      // STEP 4: GET SAVED CARD
      // ─────────────────────────────────────────────
      connection.query(
        `SELECT id, card_last4, card_brand, card_holder, payment_token
         FROM saved_cards
         WHERE account_id = ?
         LIMIT 1`,
        [userId],
        (cardErr, cards) => {
          if (cardErr) {
            console.error("Card lookup error:", cardErr);
            return res
              .status(500)
              .json({ success: false, message: "Card lookup failed" });
          }

          if (!cards.length) {
            return res.status(402).json({
              success: false,
              message:
                "No saved card found. Please add a card to view candidates.",
            });
          }

          const card = cards[0];

          // ─────────────────────────────────────────────
          // STEP 5: TRANSACTION — charge CPC + update spent_amount
          // ─────────────────────────────────────────────
          connection.beginTransaction((txErr) => {
            if (txErr) {
              return res
                .status(500)
                .json({ success: false, message: "Transaction failed" });
            }

            // Insert payment record for this click
            // In production: call your real payment gateway here using card.payment_token
            const insertPayment = `
              INSERT INTO payment
              (account_id, job_id,
               card_last4, card_brand, card_holder,
               amount, currency,
               payment_type, payment_method, payment_status,
               payment_reference)
              VALUES (?, ?, ?, ?, ?, ?, 'PKR', 'job', 'Card', 'Paid', ?)
            `;

            connection.query(
              insertPayment,
              [
                userId,
                job.id,
                card.card_last4,
                card.card_brand,
                card.card_holder,
                job.cost_per_click,
                `cpc_job_${job.id}_candidate_${candidateId}_${Date.now()}`,
              ],
              (payErr) => {
                if (payErr) {
                  console.error("CPC payment insert error:", payErr);
                  return connection.rollback(() =>
                    res
                      .status(500)
                      .json({ success: false, message: "Payment failed" }),
                  );
                }

                // Update spent_amount on the job
                connection.query(
                  `UPDATE job_posts
                   SET spent_amount = spent_amount + ?
                   WHERE id = ?`,
                  [job.cost_per_click, job.id],
                  (updateErr) => {
                    if (updateErr) {
                      console.error("spent_amount update error:", updateErr);
                      return connection.rollback(() =>
                        res
                          .status(500)
                          .json({
                            success: false,
                            message: "Spend update failed",
                          }),
                      );
                    }

                    connection.commit((commitErr) => {
                      if (commitErr) {
                        return connection.rollback(() =>
                          res
                            .status(500)
                            .json({ success: false, message: "Commit failed" }),
                        );
                      }

                      // ─────────────────────────────────────────────
                      // STEP 6: RETURN CANDIDATE PROFILE
                      // ─────────────────────────────────────────────
                      fetchCandidate();
                    });
                  },
                );
              },
            );
          });
        },
      );
    },
  );
};

// const cron = require("node-cron");

const resetDailyBudgets = () => {
  console.log("⏰ Running daily budget reset...", new Date().toISOString());

  connection.query(
    `UPDATE job_posts
     SET spent_amount = 0
     WHERE billing_model = 'daily_budget'
       AND approval_status = 'Approved'
       AND status = 'Active'
       AND application_deadline >= CURDATE()`,
    [],
    (err, result) => {
      if (err) {
        console.error("❌ Daily budget reset failed:", err.message);
        return;
      }

      console.log(
        `✅ Reset spent_amount for ${result.affectedRows} daily budget job(s)`,
      );
    },
  );
};

const cron = require("node-cron");

// at the bottom of jobModel.js
cron.schedule("0 0 * * *", () => {
  console.log("⏰ Daily budget cron running...");

  // Get all active daily budget jobs + their saved cards
  connection.query(
    `SELECT jp.id, jp.account_id, jp.daily_budget,
            sc.payment_token, sc.card_last4, sc.card_brand, sc.card_holder
     FROM job_posts jp
     LEFT JOIN saved_cards sc ON sc.account_id = jp.account_id
     WHERE jp.billing_model = 'daily_budget'
       AND jp.approval_status = 'Approved'
       AND jp.status = 'Active'
       AND jp.application_deadline >= CURDATE()
     ORDER BY sc.id DESC`,
    [],
    (err, jobs) => {
      if (err) return console.error("Cron fetch error:", err);

      jobs.forEach((job) => {
        if (!job.payment_token) {
          // No card → pause job
          connection.query(
            `UPDATE job_posts SET status = 'Inactive' WHERE id = ?`,
            [job.id],
          );
          return;
        }

        // 🔴 Replace with real payment gateway charge here
        const chargeSuccess = true;

        if (chargeSuccess) {
          // Log the daily charge
          connection.query(
            `INSERT INTO daily_budget_charges (job_id, account_id, amount, status, payment_token)
             VALUES (?, ?, ?, 'success', ?)`,
            [job.id, job.account_id, job.daily_budget, job.payment_token],
          );

          // Log in payment table
          connection.query(
            `INSERT INTO payment (account_id, job_id, card_last4, card_brand, card_holder, amount, currency, payment_type, payment_method, payment_status, payment_reference)
             VALUES (?, ?, ?, ?, ?, ?, 'PKR', 'job', 'Card', 'Paid', ?)`,
            [
              job.account_id,
              job.id,
              job.card_last4,
              job.card_brand,
              job.card_holder,
              job.daily_budget,
              `daily_cron_job${job.id}_${Date.now()}`,
            ],
          );

          // Reset spent_amount for new day
          connection.query(
            `UPDATE job_posts SET spent_amount = 0 WHERE id = ?`,
            [job.id],
          );
        } else {
          // Charge failed → pause job
          connection.query(
            `INSERT INTO daily_budget_charges (job_id, account_id, amount, status, payment_token)
             VALUES (?, ?, ?, 'failed', ?)`,
            [job.id, job.account_id, job.daily_budget, job.payment_token],
          );

          connection.query(
            `UPDATE job_posts SET status = 'Inactive' WHERE id = ?`,
            [job.id],
          );

          console.log(`⚠️ Job ${job.id} paused — charge failed`);
        }
      });
    },
  );
});
const createDailyBudgetChargesTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS daily_budget_charges (
      id INT AUTO_INCREMENT PRIMARY KEY,
      job_id INT NOT NULL,
      account_id INT NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      status ENUM('success', 'failed') DEFAULT 'success',
      payment_token VARCHAR(255),
      charged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (job_id) REFERENCES job_posts(id),
      FOREIGN KEY (account_id) REFERENCES account(id)
    );
  `;
  connection.query(sql, (err) => {
    if (err)
      return console.error("Daily budget charges table error:", err.message);
    console.log("✅ daily_budget_charges table ready");
  });
};

module.exports = {
  createJobPostTable,
  createCompanyPackagesTable,
  createDailyBudgetChargesTable,
  getJobbyRegAdmin,
  approveJob,
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
  getTransactionHistory,
  resetDailyBudgets,
  viewCandidate,
  triggerJobAlerts,
  viewCandidate,
  subcribePackageInternal,
};
