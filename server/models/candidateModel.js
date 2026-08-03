const express = require("express");
const router = express.Router();
const connection = require("../connection");
const authMiddleware = require("../middleware/auth");
const logAudit = require("../utils/auditLogger");
const { get } = require("../routes/accountRoutes");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const axios = require("axios");
const OpenAI = require("openai");
function calculateTotalExperience(experienceRows) {
  if (!experienceRows || !experienceRows.length) return 0;

  let totalMonths = 0;
  experienceRows.forEach((e) => {
    const start = e.start_date ? new Date(e.start_date) : null;
    const end = e.is_ongoing || !e.end_date ? new Date() : new Date(e.end_date);
    if (!start || isNaN(start)) return;
    const months =
      (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth());
    if (months > 0) totalMonths += months;
  });

  return Math.round((totalMonths / 12) * 10) / 10; // years, 1 decimal
}
const createCandidateTable = () => {
  const createCandidateInfoTable = `
  CREATE TABLE IF NOT EXISTS candidate_info (
  id INT AUTO_INCREMENT PRIMARY KEY,
  account_id INT UNIQUE NOT NULL,

  full_name VARCHAR(255),
  phone VARCHAR(20),

  date_of_birth DATE,

  gender ENUM('male','female','other'),
  marital_status ENUM('single','married','divorced','widowed'),
  registration_type ENUM('manual', 'cv_only') DEFAULT 'manual',

  is_fresher BOOLEAN DEFAULT FALSE,

  license_type INT,
  license_number VARCHAR(50),

  address TEXT,

  country INT,
  district INT,
  city INT,
  otherPreferredCities JSON,
  skills JSON,
  Links JSON,


  current_salary INT,
  expected_salary INT,

  passport_photo VARCHAR(255),
  resume VARCHAR(255),

  profile_completed BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (account_id) REFERENCES account(id) ON DELETE CASCADE,
  FOREIGN KEY (country) REFERENCES countries(id),
  FOREIGN KEY (district) REFERENCES districts(id),
  FOREIGN KEY (city) REFERENCES cities(id)
);
  `;

  // Execute the queries to create the tables
  connection.query(createCandidateInfoTable, function (err, results, fields) {
    if (err) {
      return console.error(err.message);
    }
    console.log("Candidate Info table created successfully");
  });
};

const createJobPreferencesTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS job_preferences (
      id INT AUTO_INCREMENT PRIMARY KEY,
      candidate_id INT NOT NULL,
      
      desired_job_titles JSON,
      job_type JSON,
      
      min_salary INT DEFAULT NULL,
      max_salary INT DEFAULT NULL,
      currency_id INT DEFAULT NULL,
      
      preferred_country_id INT DEFAULT NULL,
      preferred_city_ids JSON,
      
      experience_level ENUM(
        'fresh',
        '1-2 years',
        '3-5 years',
        '5-10 years',
        '10+ years'
      ) DEFAULT NULL,
      
      notice_period ENUM(
        'immediately',
        '1 week',
        '2 weeks',
        '1 month',
        '2 months',
        '3 months'
      ) DEFAULT NULL,
      
      joining_date DATE DEFAULT NULL,
      
      shift_preference JSON,
      
      willing_to_relocate BOOLEAN DEFAULT FALSE,
      
      alerts_enabled BOOLEAN DEFAULT TRUE,
      
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      
      FOREIGN KEY (candidate_id) 
        REFERENCES candidate_info(id) ON DELETE CASCADE,
      FOREIGN KEY (preferred_country_id) 
        REFERENCES countries(id),
      FOREIGN KEY (currency_id) 
        REFERENCES currencies(id)
    );
  `;

  connection.query(sql, (err) => {
    if (err) {
      console.error("Error creating job_preferences table:", err.message);
    } else {
      console.log("job_preferences table created successfully");
    }
  });
};

const createJobAlertsTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS job_alerts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      candidate_id INT NOT NULL,
      job_id INT NOT NULL,
      
      is_read BOOLEAN DEFAULT FALSE,
      alert_type VARCHAR DEFAULT JOB_MATCH,
      sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      message VARCHAR,
      FOREIGN KEY (candidate_id) 
        REFERENCES candidate_info(id) ON DELETE CASCADE,
      FOREIGN KEY (job_id) 
        REFERENCES job_posts(id) ON DELETE CASCADE
    );
  `;

  connection.query(sql, (err) => {
    if (err) {
      console.error("Error creating job_alerts table:", err.message);
    } else {
      console.log("job_alerts table created successfully");
    }
  });
};

const createCandidateSpecialityTable = () => {
  const createCanSpecialityTable = `
  CREATE TABLE candidate_speciality (
  candidate_id INT,
  speciality_id INT,
  PRIMARY KEY (candidate_id, speciality_id),
  FOREIGN KEY (candidate_id) REFERENCES candidate_info(ID) ON DELETE CASCADE,
  FOREIGN KEY (speciality_id) REFERENCES speciality(id)
);
`;

  connection.query(createCanSpecialityTable, function (err, results, fields) {
    if (err) {
      return console.error(err.message);
    }
    console.log("Candidate Speciality table created successfully");
  });
};

const createCandidatePreferredCitiesTable = () => {
  const createCanPreferredCitiesTable = `
CREATE TABLE candidate_preferred_cities (
  candidate_id INT,
  city_id INT,
  PRIMARY KEY (candidate_id, city_id),
  FOREIGN KEY (candidate_id) REFERENCES candidate_info(ID) ON DELETE CASCADE,
  FOREIGN KEY (city_id) REFERENCES cities(id)
);
`;

  connection.query(
    createCanPreferredCitiesTable,
    function (err, results, fields) {
      if (err) {
        return console.error(err.message);
      }
      console.log("Candidate Preferred Cities table created successfully");
    },
  );
};

const createsaveJobsTableQuery = () => {
  const saveJobsTableQuery = `
  CREATE TABLE IF NOT EXISTS saved_jobs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_id INT,
  account_id INT,
  FOREIGN KEY (job_id) REFERENCES job_posts(id),
  FOREIGN KEY (account_id) REFERENCES account(id)
);
`;

  connection.query(saveJobsTableQuery, function (err, results, fields) {
    if (err) {
      console.error("Error creating Saved Jobs table:", err.message);
    } else {
      console.log("Saved Jobs table created successfully");
    }
  });
};

// ============ BOOST TABLE CREATION ============

const createBoostPackagesTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS boost_packages (
      id            INT AUTO_INCREMENT PRIMARY KEY,
      name          VARCHAR(100) NOT NULL,
      duration_days INT NOT NULL,
      price         DECIMAL(10,2) NOT NULL,
      is_active     BOOLEAN DEFAULT TRUE,
      created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  connection.query(sql, (err) => {
    if (err)
      return console.error("Error creating boost_packages table:", err.message);
    console.log("boost_packages table created successfully");

    const insertSql = `
      INSERT IGNORE INTO boost_packages (id, name, duration_days, price) VALUES
        (1, '7 Day Boost',  7,  299),
        (2, '14 Day Boost', 14, 499),
        (3, '30 Day Boost', 30, 799)
    `;
    connection.query(insertSql, (err2) => {
      if (err2)
        return console.error(
          "Error inserting default boost packages:",
          err2.message,
        );
      console.log("Default boost packages inserted successfully");
    });
  });
};

const createBoostOrdersTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS boost_orders (
      id           INT AUTO_INCREMENT PRIMARY KEY,
      candidate_id INT NOT NULL,
      package_id   INT NOT NULL,
      status       ENUM('pending','active','expired','rejected') DEFAULT 'pending',
      start_date   DATE NULL,
      end_date     DATE NULL,
      created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (candidate_id) REFERENCES candidate_info(id) ON DELETE CASCADE,
      FOREIGN KEY (package_id)   REFERENCES packages(id)   
    )
  `;
  connection.query(sql, (err) => {
    if (err)
      return console.error("Error creating boost_orders table:", err.message);
    console.log("boost_orders table created successfully");
  });
};

const addBoostColumnsToCandidateInfo = () => {
  connection.query(
    `ALTER TABLE candidate_info ADD COLUMN is_boosted BOOLEAN DEFAULT FALSE`,
    (err) => {
      if (err && err.code !== "ER_DUP_FIELDNAME") {
        console.error("Error adding is_boosted column:", err.message);
      } else {
        console.log("is_boosted column ready in candidate_info");
      }
    },
  );

  connection.query(
    `ALTER TABLE candidate_info ADD COLUMN boost_expires_at DATETIME NULL`,
    (err) => {
      if (err && err.code !== "ER_DUP_FIELDNAME") {
        console.error("Error adding boost_expires_at column:", err.message);
      } else {
        console.log("boost_expires_at column ready in candidate_info");
      }
    },
  );
};

const createProfileViewsTable = () => {
  const createProfileViewsTableQuery = `
    CREATE TABLE IF NOT EXISTS profile_views (
      id INT AUTO_INCREMENT PRIMARY KEY,
      candidate_id INT NOT NULL,
      recruiter_id INT NULL,
      viewed_at DATETIME NOT NULL,
      ip_address VARCHAR(45),
      user_agent TEXT,
      INDEX idx_candidate_date (candidate_id, viewed_at),
      FOREIGN KEY (candidate_id) REFERENCES candidate_info(id) ON DELETE CASCADE
    )
  `;

  connection.query(
    createProfileViewsTableQuery,
    function (err, results, fields) {
      if (err) {
        return console.error(
          "Error creating profile_views table:",
          err.message,
        );
      }
      console.log("Profile Views table created successfully");
    },
  );
};

const getAllCandidates = (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 100;
  const offset = (page - 1) * limit;

  const search = (req.query.search || "").trim();
  const name = (req.query.name || "").trim();
  const status = (req.query.status || "").trim(); // "Active", "InActive", "all"

  // Map client-provided column names -> actual DB columns (SAFE)
  const columnMap = {
    username: "a.username",
    email: "a.email",
    phone: "c.phone",
    password: "a.password",
    full_name: "c.full_name",
    created_at: "a.created_at",
    isActive: "a.isActive",
  };

  let whereConditions = [];
  let values = [];

  // base filter
  whereConditions.push(`a.accountType = 'candidate'`);

  // ✅ Status dropdown filter (exact match, case-insensitive)
  if (status && status.toLowerCase() !== "all") {
    whereConditions.push(`LOWER(a.isActive) = ?`);
    values.push(status.toLowerCase());
  }

  // ✅ Search filter
  if (search) {
    const searchColumn = columnMap[name] || "a.email";

    if (name === "isActive") {
      // IMPORTANT: prevent "Active" matching "InActive"
      whereConditions.push(`LOWER(a.isActive) LIKE ?`);
      values.push(`${search.toLowerCase()}%`); // "active%" won't match "inactive"
      // If you want exact only, replace with:
      // whereConditions.push(`LOWER(a.isActive) = ?`);
      // values.push(search.toLowerCase());
    } else {
      whereConditions.push(`${searchColumn} LIKE ?`);
      values.push(`%${search}%`);
    }
  }

  const whereClause =
    whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

  const query = `
    SELECT a.*,
           c.account_id,
           c.full_name,
           c.id as candidate_id,
           c.full_name,
           c.phone,
           c.date_of_birth,
           c.gender,
           c.marital_status,
           c.license_type,
           c.license_number,
           c.profile_completed,
           ctry.name AS country_name,
           d.name AS district_name,
           city.name AS city_name,
           c.address
    FROM account a
    LEFT JOIN candidate_info c ON a.id = c.account_id
    LEFT JOIN countries ctry ON c.country = ctry.id
    LEFT JOIN districts d ON c.district = d.id
    LEFT JOIN cities city ON c.city = city.id
    ${whereClause}
    ORDER BY a.id DESC
    LIMIT ? OFFSET ?
  `;

  const queryParams = [...values, limit, offset];

  connection.query(query, queryParams, (err, results) => {
    if (err) {
      console.error("❌ Error fetching candidates:", err.sqlMessage);
      return res.status(500).json({ error: "Database error" });
    }

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM account a
      LEFT JOIN candidate_info c ON a.id = c.account_id
      ${whereClause}
    `;

    connection.query(countQuery, values, (err2, countResult) => {
      if (err2) {
        console.error("❌ Error fetching count:", err2.sqlMessage);
        return res.status(500).json({ error: "Database error" });
      }

      res.status(200).json({
        total: countResult[0].total,
        page,
        limit,
        candidate: results,
      });
    });
  });
};
const updateStatus = (id, status, userId, res) => {
  if (!id || !status) {
    return res
      .status(400)
      .json({ success: false, message: "Missing id or status" });
  }

  const query = `UPDATE account SET isActive = ? WHERE id = ?`;

  connection.query(query, [status, id], (err, result) => {
    if (err) {
      console.error("Update company status error:", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Company not found" });
    }
    logAudit({
      tableName: "history",
      entityType: "candidate",
      entityId: id,
      action: status === "Active" ? "ACTIVE" : "INACTIVE", // ✅ fix
      data: { status },
      changedBy: userId,
    });

    return res
      .status(200)
      .json({ success: true, message: `Company status updated to ${status}` });
  });
};

const addCandidateInfo = async (req, res) => {
  try {
    const accountId = req.user?.userId; // from auth middleware

    if (!accountId) {
      return res.status(400).json({
        success: false,
        message: "Invalid account id",
      });
    }

    // 🔹 Destructure frontend fields
    const {
      full_name,
      phone,
      date_of_birth,
      gender,
      marital_status,
      is_fresher,
      license_type,
      license_number,
      address,
      country,
      district,
      city,
      skills,
      // Description,
      Links,
      current_salary,
      expected_salary,
      mode,
      speciality,
      otherPreferredCities,
    } = req.body;

    const isFresherVal =
      is_fresher === true || is_fresher === "true" || is_fresher === 1 ? 1 : 0;

    // 🔹 Safe JSON parser
    const parseJSON = (value) => {
      if (!value) return null;
      try {
        return typeof value === "string" ? JSON.parse(value) : value;
      } catch (err) {
        return null;
      }
    };
    console.log("skill", skills);
    const skillsArr = parseJSON(skills);
    const linksArr = parseJSON(Links);
    const otherCitiesArr = parseJSON(otherPreferredCities);

    // 🔹 Passport photo
    // 🔹 Determine which file was uploaded
    const passportPhotoPath = req.passportPhotoPath
      ? req.passportPhotoPath
        .replace(/\\/g, "/")
        .replace(/^.*uploads/, "/uploads")
      : null;

    const resumePath = req.resumePath
      ? req.resumePath.replace(/\\/g, "/").replace(/^.*uploads/, "/uploads")
      : null;
    // 🔹 Profile completion check
    let profileCompleted = false;
    if (mode === "submit") {
      if (!phone || !city) {
        return res.status(400).json({
          success: false,
          message: "Profile incomplete. Phone and city are required.",
        });
      }
      profileCompleted = true;
    }

    // 🔹 Get email from account table
    const getEmailSql = `SELECT email FROM account WHERE id = ? LIMIT 1`;

    connection.query(getEmailSql, [accountId], (err, result) => {
      if (err) {
        console.error("Email fetch error:", err);
        return res.status(500).json({
          success: false,
          error: err.message,
        });
      }

      const email = result?.[0]?.email || null;

      // 🔹 Insert / Update candidate info
      const sql = `
        INSERT INTO candidate_info (
          account_id,
          full_name,
          phone,
          date_of_birth,
          gender,
          marital_status,
          license_type,
          license_number,
          address,
          country,
          district,
          city,
          skills,
          Links,
          current_salary,
          expected_salary,
          otherPreferredCities,
          passport_photo,
          profile_completed,
          resume,
          is_fresher
        )
        VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
        ON DUPLICATE KEY UPDATE
  full_name = COALESCE(VALUES(full_name), full_name),
  phone = COALESCE(VALUES(phone), phone),
  date_of_birth = COALESCE(VALUES(date_of_birth), date_of_birth),
  gender = COALESCE(VALUES(gender), gender),
  marital_status = COALESCE(VALUES(marital_status), marital_status),
  license_type = COALESCE(VALUES(license_type), license_type),
  license_number = COALESCE(VALUES(license_number), license_number),
  address = COALESCE(VALUES(address), address),
  country = COALESCE(VALUES(country), country),
  district = COALESCE(VALUES(district), district),
  city = COALESCE(VALUES(city), city),
  skills = COALESCE(VALUES(skills), skills),
  Links = COALESCE(VALUES(Links), Links),
  current_salary = COALESCE(VALUES(current_salary), current_salary),
  expected_salary = COALESCE(VALUES(expected_salary), expected_salary),
  otherPreferredCities = COALESCE(VALUES(otherPreferredCities), otherPreferredCities),
  passport_photo = COALESCE(VALUES(passport_photo), passport_photo),
  resume = COALESCE(VALUES(resume), resume),
  profile_completed = COALESCE(VALUES(profile_completed), profile_completed),
  is_fresher = VALUES(is_fresher)
      `;

      const params = [
        accountId,
        full_name,
        phone,
        date_of_birth,
        gender,
        marital_status,
        license_type,
        license_number,
        address,
        country,
        district,
        city,
        skillsArr ? JSON.stringify(skillsArr) : null,
        linksArr ? JSON.stringify(linksArr) : null,
        current_salary,
        expected_salary,
        otherCitiesArr ? JSON.stringify(otherCitiesArr) : null,
        passportPhotoPath,
        profileCompleted,
        resumePath, // 👈 add this
        isFresherVal,
      ];

      // First fetch existing data before update
      connection.query(
        `SELECT * FROM candidate_info WHERE account_id = ? LIMIT 1`,
        [accountId],
        (errFetch, existingRows) => {
          if (errFetch)
            return res
              .status(500)
              .json({ success: false, error: errFetch.message });

          const existingData = existingRows[0] || null;
          const isFirstTime = !existingData || !existingData.full_name; // no profile yet

          connection.query(sql, params, (err2, result) => {
            if (err2) {
              console.error("DB Error:", err2);
              return res
                .status(500)
                .json({ success: false, error: err2.message });
            }

            if (isFirstTime) {
              // First time — just log ADDED, no diff needed
              logAudit({
                tableName: "history",
                entityType: "candidate",
                entityId: accountId,
                action: "ADDED",
                data: {
                  event: "Candidate profile created",
                  profile_completed: profileCompleted,
                },
                changedBy: accountId,
              });
            } else {
              // Not first time — compute diff of old vs new
              const fieldsToTrack = {
                full_name,
                phone,
                date_of_birth,
                gender,
                marital_status,
                license_number,
                address,
                country,
                district,
                city,
                current_salary,
                expected_salary,
              };

              const diff = {};
              for (const [key, newVal] of Object.entries(fieldsToTrack)) {
                const oldVal = String(existingData[key] ?? "");
                const newValStr = String(newVal ?? "");
                if (oldVal !== newValStr) {
                  diff[key] = { from: existingData[key], to: newVal };
                }
              }

              logAudit({
                tableName: "history",
                entityType: "candidate",
                entityId: accountId,
                action: "UPDATED",
                data: {
                  event: "Candidate profile updated",
                  changes: diff,
                  profile_completed: profileCompleted,
                },
                changedBy: accountId,
              });
            }

            return res.json({
              success: true,
              message: "Candidate profile saved successfully",
              profile_completed: profileCompleted,
            });
          });
        },
      );
    });
  } catch (error) {
    console.error("Save Candidate Error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const getCandidateInfo = (req, res) => {
  const accountId = req.user.userId;

  const candidateSql = `
    SELECT
      a.id AS account_id,
      a.email,
      ci.id AS candidate_id,
      ci.full_name,
      ci.is_fresher,
      ci.phone,
      ci.date_of_birth,
      ci.gender,
      ci.marital_status,
      ci.license_type AS license_type_id,
      lt.name AS license_type_name,
      ci.license_number,
      ci.otherPreferredCities,
      ci.address,
      ci.country AS country_id,
      co.name AS country_name,
      ci.district AS district_id,
      d.name AS district_name,
      ci.city AS city_id,
      c.name AS city_name,
      ci.skills,
      ci.Links,
      ci.current_salary,
      ci.expected_salary,
      ci.profile_completed,
      ci.passport_photo,
      ci.resume,
      ci.is_boosted,
      ci.boost_expires_at
    FROM account a
    LEFT JOIN candidate_info ci ON a.id = ci.account_id
    LEFT JOIN countries co ON ci.country = co.id
    LEFT JOIN districts d ON ci.district = d.id
    LEFT JOIN cities c ON ci.city = c.id
    LEFT JOIN license_types lt ON ci.license_type = lt.id
    WHERE a.id = ?
    LIMIT 1
  `;

  connection.query(candidateSql, [accountId], (err, candidateResult) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!candidateResult.length)
      return res.status(404).json({ error: "Candidate not found" });

    const candidate = candidateResult[0];
    if (candidate.is_boosted && candidate.boost_expires_at) {
      const now = new Date();
      const expiry = new Date(candidate.boost_expires_at);
      if (expiry < now) {
        // Expire it in the background
        connection.query(
          `UPDATE candidate_info SET is_boosted = 0, boost_expires_at = NULL WHERE account_id = ?`,
          [accountId]
        );
        connection.query(
          `UPDATE boost_orders SET status = 'expired' 
         WHERE candidate_id = ? AND status = 'active'`,
          [candidate.candidate_id]
        );
        // Correct the in-memory object too
        candidate.is_boosted = 0;
        candidate.boost_expires_at = null;
      }
    }

    const parseJSON = (value) => {
      if (!value) return [];
      try {
        return typeof value === "string" ? JSON.parse(value) : value;
      } catch {
        return [];
      }
    };

    let skillIds = parseJSON(candidate.skills);
    if (!Array.isArray(skillIds)) skillIds = skillIds ? [skillIds] : [];

    // -------- Profile completion logic (UPDATED) --------
    const fieldsToCheck = [
      "full_name",
      "phone",
      "date_of_birth",
      "gender",
      "marital_status",
      "license_type_id",
      "license_number",
      "otherPreferredCities",
      "address",
      "country_id",
      "district_id",
      "city_id",
      "skills",
      "Links",
      "current_salary",
      "expected_salary",
      "passport_photo",
      "resume",
    ];

    let completedCount = 0;

    fieldsToCheck.forEach((field) => {
      if (
        field === "otherPreferredCities" ||
        field === "skills" ||
        field === "Links"
      ) {
        if (parseJSON(candidate[field]).length > 0) completedCount++;
      } else if (candidate[field]) {
        completedCount++;
      }
    });

    // New: check availability, certificates, research for profile completion
    const availabilitySql = `SELECT 1 FROM candidate_availability WHERE candidate_id = ? LIMIT 1`;
    const certificatesSql = `SELECT 1 FROM candidate_certificates WHERE candidate_id = ? LIMIT 1`;
    const researchSql = `SELECT 1 FROM candidate_research WHERE candidate_id = ? LIMIT 1`;

    Promise.all([
      new Promise((resolve, reject) => {
        connection.query(availabilitySql, [candidate.candidate_id], (err, rows) => {
          if (err) return reject(err);
          resolve(rows.length > 0);
        });
      }),
      new Promise((resolve, reject) => {
        connection.query(certificatesSql, [candidate.candidate_id], (err, rows) => {
          if (err) return reject(err);
          resolve(rows.length > 0);
        });
      }),
    ])
      .then(([hasAvailability, hasCertificates]) => {
        if (hasAvailability) completedCount++;
        if (hasCertificates) completedCount++;

        const totalFields = fieldsToCheck.length + 2; // ✅ +2 only (availability + certificates)
        const profile_completion_percent = Math.round((completedCount / totalFields) * 100); 

        // -------- Response object --------
        const response = {
          account_id: candidate.account_id || "",
          email: candidate.email || "",
          full_name: candidate.full_name || "",
          phone: candidate.phone || "",
          date_of_birth: candidate.date_of_birth
            ? candidate.date_of_birth.toISOString().slice(0, 10)
            : "",
          gender: candidate.gender || "",
          marital_status: candidate.marital_status || "",
          total_experience: candidate.total_experience || "",
          license_type: {
            id: candidate.license_type_id
              ? Number(candidate.license_type_id)
              : null,
            name: candidate.license_type_name || "",
          },
          license_number: candidate.license_number || "",
          address: candidate.address || "",
          country: {
            id: candidate.country_id || null,
            name: candidate.country_name || "",
          },
          district: {
            id: candidate.district_id || null,
            name: candidate.district_name || "",
          },
          city: {
            id: candidate.city_id || null,
            name: candidate.city_name || "",
          },
          otherPreferredCities: parseJSON(candidate.otherPreferredCities),
          skills: [],
          Links: parseJSON(candidate.Links),
          current_salary: candidate.current_salary || "",
          expected_salary: candidate.expected_salary || "",
          profile_completed: !!candidate.profile_completed,
          profile_completion_percent, // ✅ updated percentage
          passport_photo: candidate.passport_photo || null,
          resume: candidate.resume || null,

          is_boosted: candidate.is_boosted || false,
          boost_expires_at: candidate.boost_expires_at || null,

          // Tracking
          appeared_in_search: 0,
          profile_views: 0,
          shortlisted_count: 0,
          approved_count: 0,
          interview_count: 0,

          // Detailed lists
          shortlisted_companies: [],
          approved_companies: [],
          saved_companies: [],
          interview_scheduled_companies: [],
          interview_conducted_companies: [],
          considered_companies: [],
          offered_companies: [],
          rejected_companies: [],
          is_fresher: !!candidate.is_fresher,
        };

        // -------- Tracking Queries --------
        const searchCountSql = `
         SELECT 
            COUNT(*) AS total_impressions
            FROM candidate_search_impressions
            WHERE candidate_id = ?
          `;

        const applicationStatusSql = `
        SELECT status, COUNT(*) AS count
        FROM applications
        WHERE candidate_id = ?
        GROUP BY status
      `;

        const companyDetailsSql = `
        SELECT 
          a.status AS application_status,
           a.interview_day,
          a.interview_time,
          a.job_id,
          a.candidate_id,
          a.candidate_response,
          a.company_status,
          ci.account_id,
          ci.id AS company_id, 
          ci.company_name,
          ci.logo,
          jp.job_title
        FROM applications a
        JOIN job_posts jp ON a.job_id = jp.id
        JOIN company_info ci ON jp.account_id = ci.account_id
        WHERE a.candidate_id = ?
        AND a.status IN ('Saved', 'Shortlisted', 'Interview_Scheduled', 'Interview_Conducted', 'Considered', 'Offered', 'Selected', 'Joined', 'Rejected')
      `;

        Promise.all([
          new Promise((resolve, reject) => {
            connection.query(
              searchCountSql,
              [candidate.candidate_id],
              (err, rows) => {
                if (err) return reject(err);
                response.appeared_in_search = rows[0]?.total_impressions || 0;
                response.profile_views = rows[0]?.total_impressions || 0;
                resolve();
              },
            );
          }),
          new Promise((resolve, reject) => {
            connection.query(
              applicationStatusSql,
              [candidate.candidate_id],
              (err, rows) => {
                if (err) return reject(err);
                rows.forEach((r) => {
                  if (r.status === "Interview_Scheduled" || r.status === "Interview_Conducted")
                    response.shortlisted_count += r.count;
                  if (r.status === "Offered")
                    response.approved_count += r.count;
                  if (r.status === "Interview_Scheduled")
                    response.interview_count += r.count;
                });
                resolve();
              },
            );
          }),
          new Promise((resolve, reject) => {
            connection.query(
              companyDetailsSql,
              [candidate.candidate_id],
              (err, rows) => {
                if (err) return reject(err);
                rows.forEach((row) => {
                  const companyData = {
                    status: row.application_status,
                    accountId: row.account_id,
                    candidate_response: row.candidate_response,
                    company_status: row.company_status,
                    company_id: row.company_id,
                    company_name: row.company_name,
                    logo: row.logo ? Buffer.from(row.logo).toString('base64') : null,
                    job_id: row.job_id,
                    job_title: row.job_title,
                    interview_day: row.interview_day || null,
                    interview_time: row.interview_time || null,
                    candidate_id: row.candidate_id,
                    // account_id: row.account_id
                  };
                  if (row.application_status === "Saved")
                    response.saved_companies.push(companyData);
                  if (row.application_status === "Shortlisted")
                    response.shortlisted_companies.push(companyData);
                  if (row.application_status === "Interview_Scheduled")
                    response.interview_scheduled_companies.push(companyData);
                  if (row.application_status === "Interview_Conducted")
                    response.interview_conducted_companies.push(companyData);
                  if (row.application_status === "Considered")
                    response.considered_companies.push(companyData);
                  if (row.application_status === "Offered")
                    response.offered_companies.push(companyData);
                  if (row.application_status === "Offered" || row.application_status === "Selected")
                    response.approved_companies.push(companyData);
                  if (row.application_status === "Rejected")
                    response.rejected_companies.push(companyData);
                });
                resolve();
              },
            );
          }),
        ])
          .then(() => {
            if (!skillIds.length) return res.json(response);

            const skillsSql = `SELECT id, name FROM skills WHERE id IN (?)`;
            connection.query(skillsSql, [skillIds], (err, skillsRows) => {
              if (err) return res.status(500).json({ error: err.message });

              response.skills = skillsRows.map((s) => ({
                id: s.id,
                name: s.name,
              }));

              res.json(response);
            });
          })
          .catch((err) => res.status(500).json({ error: err.message }));
      })
      .catch((err) => res.status(500).json({ error: err.message }));
  });
};

const editCandidateInfo = (req, res) => {
  const accountId = Number(req.params.accountId);

  if (!accountId) {
    return res.status(400).json({ error: "Invalid account_id" });
  }

  // ✅ Correct file handling
  const passportPhotoPath = req.passportPhotoPath
    ? req.passportPhotoPath
      .replace(/\\/g, "/")
      .replace(/^.*uploads/, "/uploads")
    : null;

  const resumePath = req.resumePath
    ? req.resumePath.replace(/\\/g, "/").replace(/^.*uploads/, "/uploads")
    : null;
  // ✅ Map frontend fields → DB columns
  const fieldMap = {
    full_name: "full_name",
    phone: "phone",
    date_of_birth: "date_of_birth",
    gender: "gender",
    marital_status: "marital_status",
    is_fresher: "is_fresher",
    license_type: "license_type",
    license_number: "license_number",
    address: "address",
    country: "country",
    district: "district",
    city: "city",
    current_salary: "current_salary",
    expected_salary: "expected_salary",
    skills: "skills",
    Links: "Links",
    availability: "availability",
  };

  const updateFields = [];
  const updateValues = [];

  // ✅ Add ONLY fields that exist in req.body
  for (const [key, column] of Object.entries(fieldMap)) {
    if (req.body[key] !== undefined) {
      let value = req.body[key];

      if (["skills", "Links", "availability"].includes(key)) {
        try {
          value = JSON.stringify(
            typeof value === "string" ? JSON.parse(value) : value,
          );
        } catch {
          value = null;
        }
      }

      updateFields.push(`${column} = ?`);
      updateValues.push(value);
    }
  }

  // ✅ Add files only if uploaded
  if (passportPhotoPath) {
    updateFields.push("passport_photo = ?");
    updateValues.push(passportPhotoPath);
  }

  if (!updateFields.length) {
    return res.json({ message: "Nothing to update" });
  }

  const sql = `
    UPDATE candidate_info
    SET ${updateFields.join(", ")}
    WHERE account_id = ?
  `;

  updateValues.push(accountId);

  connection.query(sql, updateValues, (err, result) => {
    if (err) {
      console.error("PUT candidate error:", err);
      return res.status(500).json({ error: err.message });
    }

    res.json({
      success: true,
      message: "Candidate updated successfully",
    });
  });
};

const getCandidateInfobyId = (req, res) => {
  const accountId = req.params.accountId;

  const sql = "SELECT * FROM candidate_info WHERE Account_ID = ?";

  connection.query(sql, [accountId], (err, results) => {
    if (err) {
      console.error("Error fetching data:", err);
      res
        .status(500)
        .json({ error: "Error fetching data", details: err.message });
    } else {
      res.status(200).json(results);
    }
  });
};

const getCandidatepassport_photobyId = (req, res) => {
  const accountId = req.params.accountId;

  const sql = "SELECT  passport_photo FROM candidate_info WHERE Account_ID = ?";

  connection.query(sql, [accountId], (err, results) => {
    if (err) {
      console.error("Error fetching data:", err);
      res
        .status(500)
        .json({ error: "Error fetching data", details: err.message });
    } else {
      // Convert the passport_photo in base64
      const resultsWithBase64passport_photo = results.map((result) => {
        const base64Image = Buffer.from(result.passport_photo).toString(
          "base64",
        );
        return { ...result, passport_photo: base64Image };
      });

      // Send the response with base64 passport_photos
      res.status(200).json({ jobDetails: resultsWithBase64passport_photo });
    }
  });
};
function formatDate(dateStr) {
  if (!dateStr) return "Present"; // null = ongoing
  return dayjs(dateStr).format("MMM YYYY"); // e.g. "Jul 2025"
}
function queryPromise(sql, params) {
  return new Promise((resolve, reject) => {
    connection.query(sql, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
}

const getCandidateFullProfilebyId = async (req, res) => {
  const accountId = req.params.accountId;

  try {
    // Run queries in parallel like Promise.all
    const [
      profileResults,
      candidateInfoResults,
      educationResults,
      workResults,
      awardsResults,
      projectsResults,
    ] = await Promise.all([
      queryPromise(
        `SELECT id, username, email
         FROM account WHERE id = ?`,
        [accountId],
      ),
      queryPromise(
        `SELECT  City, Phone as phone, skills, Links
         FROM candidate_info WHERE Account_ID = ?`,
        [accountId],
      ),
      // queryPromise(
      //   `SELECT id, degree_title, field_of_study, institute_name, start_date, end_date, education_description
      //    FROM cv_education WHERE user_id = ?`,
      //   [accountId]
      // ),
      // queryPromise(
      //   `SELECT id, company_name, designation, start_date, end_date, description
      //    FROM cv_work_experience WHERE user_id = ?`,
      //   [accountId]
      // ),
      // queryPromise(
      //   `SELECT id, title, institute_name, description, passing_year
      //    FROM cv_certificateawards WHERE user_id = ?`,
      //   [accountId]
      // ),
      // queryPromise(
      //   `SELECT id, project_title, role, project_description, skills_used, project_link
      //    FROM cv_projects WHERE user_id = ?`,
      //   [accountId]
      // ),
    ]);

    if (profileResults.length === 0) {
      return res.status(404).json({ error: "Candidate not found" });
    }

    const candidate = {
      ...profileResults[0],
      ...candidateInfoResults[0],
      experiences: Array.isArray(workResults)
        ? workResults.map((exp, index) => ({
          ...exp,
          start_date: formatDate(exp.start_date),
          end_date: formatDate(exp.end_date),
          first: index === 0,
        }))
        : [],

      education: Array.isArray(educationResults)
        ? educationResults.map((edu, index) => ({
          ...edu,
          start_date: formatDate(edu.start_date),
          end_date: formatDate(edu.end_date),
          first: index === 0,
        }))
        : [],

      projects: Array.isArray(projectsResults)
        ? projectsResults.map((proj, index) => ({
          ...proj,
          start_date: formatDate(proj.start_date),
          end_date: formatDate(proj.end_date),
          first: index === 0,
        }))
        : [],

      awards: Array.isArray(awardsResults)
        ? awardsResults.map((awd, index) => ({
          ...awd,
          first: index === 0,
        }))
        : [],
    };

    res.status(200).json(candidate);
  } catch (err) {
    console.error("Error fetching full profile:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getCandidateInfobyAccountType = (req, res) => {
  const sql = `
      SELECT *
      FROM account
      WHERE accountType = 'candidate'
    `;

  connection.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    // returns an array of all candidate accounts
    return res.json(results);
  });
};
const addResume = (userId, resumePath, res) => {
  const query = `
    UPDATE candidate_info
    SET resume = ?
    WHERE account_id = ?
  `;

  connection.query(query, [resumePath, userId], (err) => {
    if (err) {
      console.error("DB Error:", err);
      return res.status(500).json({ msg: "SERVER_ERROR" });
    }

    res.status(200).json({
      msg: "Resume uploaded successfully",
      resume: resumePath,
    });
  });
};

// ============ BOOST FUNCTIONS ============

const getBoostPackages = (req, res) => {
  connection.query(
    `SELECT 
      p.id,
      p.name,
      p.price,
      p.pricing_model,
      p.boost_type,
      p.boost_duration_days,
      p.duration_days,
      p.description,
      COALESCE(c.code, 'PKR') AS currency
    FROM packages p
    LEFT JOIN currencies c ON c.id = p.currency_id
    WHERE p.package_type = 'Candidate'
    AND p.status = 'Active'
    AND p.pricing_model IN ('featured_boost', 'duration_bundle')
    ORDER BY p.price ASC`,
    (err, results) => {
      if (err) return res.status(500).json({ error: "Database error" });
      res.json({ success: true, data: results });
    },
  );
};

const placeBoostOrder = (req, res) => {
  const accountId = req.user.userId;
  const { package_id } = req.body;

  if (!package_id) {
    return res.status(400).json({ success: false, message: "Please select a package" });
  }

  connection.query(
    `SELECT bo.id FROM boost_orders bo
     JOIN candidate_info ci ON ci.id = bo.candidate_id
     WHERE ci.account_id = ? AND bo.status IN ('pending', 'active')`,
    [accountId],
    (err, existing) => {
      if (err) return res.status(500).json({ error: "Database error", details: err.message });
      if (existing.length > 0) {
        return res.status(400).json({ success: false, message: "A boost order is already active" });
      }

      connection.query(
        "SELECT id FROM candidate_info WHERE account_id = ?",
        [accountId],
        (err2, rows) => {
          if (err2) return res.status(500).json({ error: "Database error", details: err2.message });
          if (!rows.length) return res.status(404).json({ success: false, message: "Candidate not found" });

          const candidateInfoId = rows[0].id;

          connection.query(
            `SELECT COALESCE(duration_days, boost_duration_days) AS duration_days 
             FROM packages WHERE id = ?`,
            [package_id],
            (err3, pkgRows) => {
              if (err3) return res.status(500).json({ error: "Database error" });
              if (!pkgRows.length) return res.status(404).json({ success: false, message: "Package not found" });

              const days = parseInt(pkgRows[0].duration_days || 0);
              const start = new Date();
              const end = new Date();
              end.setDate(end.getDate() + days);

              connection.query(
                `INSERT INTO boost_orders (candidate_id, package_id, status, start_date, end_date) 
                 VALUES (?, ?, 'active', ?, ?)`,
                [candidateInfoId, package_id, start, end],
                (err4) => {
                  if (err4) return res.status(500).json({ error: "Database error", details: err4.message });

                  connection.query(
                    "UPDATE candidate_info SET is_boosted=1, boost_expires_at=? WHERE id=?",
                    [end, candidateInfoId],
                    (err5) => {
                      if (err5) return res.status(500).json({ error: "Database error" });

                      logAudit({
                        tableName: "history",
                        entityType: "candidate",
                        entityId: accountId,
                        action: "BOOST_ACTIVATED",
                        data: { event: "Boost auto-activated on purchase", package_id, boost_expires_at: end },
                        changedBy: accountId,
                      });

                      res.json({ success: true, message: "Profile boosted successfully!", boost_expires_at: end });
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
};
const getMyBoostStatus = (req, res) => {
  const accountId = req.user.userId;

  connection.query(
    `SELECT bo.status, bo.start_date, bo.end_date,
            p.name AS package_name, p.duration_value, p.duration_unit,
            ci.id as candidate_id,
            ci.is_boosted, ci.boost_expires_at
     FROM candidate_info ci
     LEFT JOIN boost_orders bo
       ON bo.candidate_id = ci.id
       AND bo.status IN ('pending', 'active')
     LEFT JOIN packages p ON p.id = bo.package_id
     WHERE ci.account_id = ?
     LIMIT 1`,
    [accountId],
    (err, rows) => {
      if (err) {
        console.error("Error fetching boost status:", err.message);
        return res.status(500).json({ error: "Database error" });
      }

      let data = rows[0] || null;

      if (data && data.is_boosted && data.boost_expires_at) {
        const now = new Date();
        const expiry = new Date(data.boost_expires_at);

        if (expiry < now) {
          connection.query(
            "UPDATE candidate_info SET is_boosted = 0, boost_expires_at = NULL WHERE id = ?",
            [data.candidate_id],
          );
          connection.query(
            "UPDATE boost_orders SET status = 'expired' WHERE candidate_id = ? AND status = 'active'",
            [data.candidate_id],
          );
          data.is_boosted = false;
        }
      }

      res.json({ success: true, data });
    },
  );
};
const getBoostOrders = (req, res) => {
  // First expire any overdue active orders
  connection.query(
    `UPDATE boost_orders bo
     JOIN candidate_info ci ON ci.id = bo.candidate_id
     SET bo.status = 'expired',
         ci.is_boosted = 0,
         ci.boost_expires_at = NULL
     WHERE bo.status = 'active' AND bo.end_date < NOW()`,
    (errClean) => {
      if (errClean) console.error("Cleanup error:", errClean.message);

      connection.query(
        `SELECT 
    bo.id, bo.status, bo.start_date, bo.end_date, bo.created_at,
    a.id AS account_id,          -- ← ADD THIS
    ci.id AS candidate_info_id,
    a.email AS candidate_email,
    ci.full_name AS candidate_name,
    p.name AS package_name,
    p.price,
    p.boost_duration_days,
    c.code AS currency
  FROM boost_orders bo
  JOIN candidate_info ci ON ci.id = bo.candidate_id
  JOIN account a ON a.id = ci.account_id
  JOIN packages p ON p.id = bo.package_id
  LEFT JOIN currencies c ON c.id = p.currency_id
  ORDER BY bo.created_at DESC`,
        (err, results) => {
          if (err) return res.status(500).json({ error: "Database error" });
          res.json({ success: true, data: results });
        }
      );
    }
  );
};

const activateBoost = (req, res) => {
  const { orderId } = req.params;

  connection.query(
    `SELECT bo.*, 
            COALESCE(p.duration_days, p.boost_duration_days) AS duration_days,
            bo.candidate_id
     FROM boost_orders bo
     JOIN packages p ON p.id = bo.package_id
     WHERE bo.id = ?`,
    [orderId],
    (err, rows) => {
      if (err) {
        console.error(
          "Error fetching boost order for activation:",
          err.message,
        );
        return res.status(500).json({ error: "Database error" });
      }
      if (!rows.length) {
        return res
          .status(404)
          .json({ success: false, message: "Order not found" });
      }

      const order = rows[0];
      const start = new Date();
      const end = new Date();
      const days = parseInt(order.duration_days || 0);
      end.setDate(end.getDate() + days);

      // if (unit === "days") end.setDate(end.getDate() + val);
      // else if (unit === "weeks") end.setDate(end.getDate() + val * 7);
      // else if (unit === "months") end.setMonth(end.getMonth() + val);
      // else if (unit === "hours") end.setHours(end.getHours() + val);
      // else end.setDate(end.getDate() + val); // fallback

      connection.query(
        "UPDATE boost_orders SET status='active', start_date=?, end_date=? WHERE id=?",
        [start, end, orderId],
        (err2) => {
          if (err2) return res.status(500).json({ error: "Database error" });

          connection.query(
            "UPDATE candidate_info SET is_boosted=1, boost_expires_at=? WHERE id=?",
            [end, order.candidate_id],
            (err3) => {
              if (err3)
                return res.status(500).json({ error: "Database error" });
              connection.query(
                "SELECT account_id FROM candidate_info WHERE id = ? LIMIT 1",
                [order.candidate_id],
                (err4, rows) => {
                  if (!err4 && rows.length > 0) {
                    logAudit({
                      tableName: "history",
                      entityType: "candidate",
                      entityId: rows[0].account_id,
                      action: "BOOST_ACTIVATED",
                      data: {
                        event: "Boost activated by admin",
                        boost_expires_at: end,
                      },
                      changedBy: req.user.userId,
                    });
                  }
                },
              );
              res.json({
                success: true,
                message: "Boost activated successfully",
              });
            },
          );
        },
      );
    },
  );
};

const rejectBoost = (req, res) => {
  const { orderId } = req.params;

  connection.query(
    `SELECT bo.candidate_id, ci.account_id 
     FROM boost_orders bo
     JOIN candidate_info ci ON ci.id = bo.candidate_id
     WHERE bo.id = ?`,
    [orderId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "Database error" });

      connection.query(
        "UPDATE boost_orders SET status='rejected' WHERE id=?",
        [orderId],
        (err2) => {
          if (err2) return res.status(500).json({ error: "Database error" });

          if (rows.length > 0) {
            logAudit({
              tableName: "history",
              entityType: "candidate",
              entityId: rows[0].account_id,
              action: "BOOST_REJECTED",
              data: { event: "Boost order rejected by admin" },
              changedBy: req.user.userId,
            });
          }

          res.json({ success: true, message: "Boost order rejected" });
        },
      );
    },
  );
};

const getCandidatesForJob = (req, res) => {
  const jobId = req.params.jobId;

  const sql = `
    SELECT 
      ci.id,
      ci.full_name,
      ci.skills,
      ci.is_boosted,
      ci.boost_expires_at
    FROM candidate_info ci
    JOIN job_posts jp ON jp.id = ?
    WHERE JSON_OVERLAPS(ci.skills, jp.skill_ids)
    ORDER BY 
      ci.is_boosted DESC,  
      ci.created_at DESC
  `;

  connection.query(sql, [jobId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error" });
    }

    const candidateIds = results.map((c) => c.id);
    if (!candidateIds.length) return res.json(results);

    connection.query(
      `SELECT candidate_id, start_date, end_date, is_ongoing
       FROM candidate_experience WHERE candidate_id IN (?)`,
      [candidateIds],
      (err2, expRows) => {
        if (err2) {
          console.error(err2);
          return res.status(500).json({ error: "Database error" });
        }

        connection.query(
          `SELECT min_experience FROM job_posts WHERE id = ?`,
          [jobId],
          (err3, jobRows) => {
            if (err3) return res.status(500).json({ error: "Database error" });
            const minExp = parseInt(jobRows[0]?.min_experience) || 0;

            const filtered = results
              .map((c) => {
                const exp = calculateTotalExperience(
                  expRows.filter((e) => e.candidate_id === c.id),
                );
                return { ...c, total_experience: exp };
              })
              .filter((c) => c.total_experience >= minExp);

            res.json(filtered);
          },
        );
      },
    );
  });
};

const getBoostAnalytics = (req, res) => {
  const sql = `
   SELECT 
      COUNT(*) as total_orders,
      SUM(CASE WHEN bo.status = 'active' THEN 1 ELSE 0 END) as active_boosts,
      SUM(CASE WHEN bo.status = 'pending' THEN 1 ELSE 0 END) as pending_boosts,
      SUM(p.price) as total_revenue
    FROM boost_orders bo
    JOIN packages p ON p.id = bo.package_id
    WHERE bo.status = 'active'
  `;

  connection.query(sql, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "DB error" });
    }

    res.json({ success: true, data: result[0] });
  });
};

const getMatchingJobsForCandidate = async (req, res) => {
  try {
    const accountId = req.user.userId;

    // ── STEP 1: Fetch candidate profile ──
    const candidate = await new Promise((resolve, reject) =>
      connection.query(
        `SELECT ci.id, ci.skills, ci.city,
                ci.expected_salary, ci.otherPreferredCities, ci.is_boosted
         FROM candidate_info ci
         WHERE ci.account_id = ?
         LIMIT 1`,
        [accountId],
        (err, rows) => (err ? reject(err) : resolve(rows[0])),
      ),
    );

    if (!candidate)
      return res.status(404).json({ error: "Candidate not found" });

    // ── STEP 2: Parse candidate skills ──
    let candSkillIds = [];
    try {
      candSkillIds =
        typeof candidate.skills === "string"
          ? JSON.parse(candidate.skills)
          : candidate.skills || [];
    } catch {
      candSkillIds = [];
    }

    // ── STEP 3: Parse candidate cities ──
    let candOtherCityIds = [];
    try {
      const parsed =
        typeof candidate.otherPreferredCities === "string"
          ? JSON.parse(candidate.otherPreferredCities)
          : candidate.otherPreferredCities || [];
      candOtherCityIds = parsed.map((c) =>
        typeof c === "object" ? Number(c.id) : Number(c),
      );
    } catch {
      candOtherCityIds = [];
    }

    const candCityId = Number(candidate.city);

    // ── STEP 4: Fetch candidate experience (for speciality) ──
    const experienceRows = await new Promise((resolve, reject) =>
      connection.query(
        `SELECT e.speciality_id FROM candidate_experience e WHERE e.candidate_id = ?`,
        [candidate.id],
        (err, rows) => (err ? reject(err) : resolve(rows)),
      ),
    );
    const candSpecialityIds = experienceRows
      .map((e) => Number(e.speciality_id))
      .filter(Boolean);

    // ── STEP 5: Fetch candidate education ──
    const educationRows = await new Promise((resolve, reject) =>
      connection.query(
        `SELECT ed.degree_id, df.degree_type_id
         FROM candidate_education ed
         LEFT JOIN degreefields df ON ed.degree_id = df.id
         WHERE ed.candidate_id = ?`,
        [candidate.id],
        (err, rows) => (err ? reject(err) : resolve(rows)),
      ),
    );
    // ✅ FIX: hasDegree must check actual field values, not just row count.
    // A LEFT JOIN or stray row can produce a row with null degree_id/degree_type_id,
    // which previously made `educationRows.length > 0` true with no real data.
    const hasDegree = educationRows.some(
      (e) => e.degree_id != null || e.degree_type_id != null,
    );
    const candDegreeTypeIds = educationRows
      .map((e) => Number(e.degree_type_id))
      .filter(Boolean);
    const candDegreeFieldIds = educationRows
      .map((e) => Number(e.degree_id))
      .filter(Boolean);

    // ── STEP 6: Fetch candidate availability ──
    const availabilityRows = await new Promise((resolve, reject) =>
      connection.query(
        `SELECT * FROM candidate_availability WHERE candidate_id = ?`,
        [candidate.id],
        (err, rows) => (err ? reject(err) : resolve(rows)),
      ),
    );

    // ── STEP 7: Fetch ALL active approved jobs (no skill gate) ──
    const jobsRaw = await new Promise((resolve, reject) =>
      connection.query(
        `SELECT
           jp.id, jp.job_title, jp.job_description,
           jp.skill_ids, jp.speciality_id,
           jp.min_salary, jp.max_salary,
           jp.min_experience, jp.max_experience,
           jp.degree_id, jp.degreefields_id,
           jp.city_id, jp.job_location_type,
           jp.time_from, jp.time_to,
           jp.created_at, jp.is_sponsored,
           jt.name AS job_type,
           ccy.code AS currency,
           ci.company_name, ci.logo,
           CASE WHEN EXISTS (
  SELECT 1 FROM applications a
  WHERE a.job_id = jp.id AND a.candidate_id = ?
  AND a.status != 'Cancelled' AND a.source = 'candidate'
) THEN 1 ELSE 0 END AS already_applied,
(SELECT a.status FROM applications a 
 WHERE a.job_id = jp.id AND a.candidate_id = ?
 AND a.status != 'Cancelled' AND a.source = 'candidate'
 ORDER BY a.id DESC LIMIT 1) AS application_status,
(SELECT a.status FROM applications a 
 WHERE a.job_id = jp.id AND a.candidate_id = ?
 AND a.status != 'Cancelled' AND a.source = 'employer'
 ORDER BY a.id DESC LIMIT 1) AS pipeline_status
         FROM job_posts jp
         LEFT JOIN company_info ci  ON ci.account_id  = jp.account_id
         LEFT JOIN jobtypes jt      ON jt.id          = jp.job_type_id
         LEFT JOIN currencies ccy   ON ccy.id         = jp.currency_id
         WHERE jp.status          = 'Active'
           AND jp.approval_status = 'Approved'
           AND jp.application_deadline >= CURDATE()
         ORDER BY jp.is_sponsored DESC, jp.created_at DESC
         LIMIT 100`,
        [candidate.id, candidate.id, candidate.id],
        (err, rows) => (err ? reject(err) : resolve(rows)),
      ),
    );

    if (!jobsRaw.length) {
      return res.json({
        success: true,
        summary: { total: 0, strong: 0, good: 0, weak: 0 },
        data: [],
      });
    }

    // ── STEP 8: Score each job against the candidate ──
    const candExp = calculateTotalExperience(experienceRows);
    const candSalary = parseFloat(candidate.expected_salary || 0);
    const tierOrder = { strong: 0, good: 1, weak: 2 };

    const tieredJobs = jobsRaw
      .map((job) => {
        const matched = [];
        const missing = [];
        let score = 0;

        // ── Parse job skill IDs ──
        let jobSkillIds = [];
        try {
          jobSkillIds =
            typeof job.skill_ids === "string"
              ? JSON.parse(job.skill_ids).map(Number)
              : (job.skill_ids || []).map(Number);
        } catch {
          jobSkillIds = [];
        }

        // ── Parse job city IDs ──
        let jobCityIds = [];
        try {
          const parsed =
            typeof job.city_id === "string"
              ? JSON.parse(job.city_id)
              : job.city_id;
          jobCityIds = Array.isArray(parsed) ? parsed.map(Number) : [];
        } catch {
          jobCityIds = [];
        }

        const isRemote =
          job.job_location_type === "remote" || jobCityIds.length === 0;

        // ── Location (10pts) ──
        let locationScore = 0;
        let location_type = "pipeline";

        if (isRemote) {
          locationScore = 10;
          location_type = "remote";
        } else {
          const mainCityMatch = jobCityIds.includes(candCityId);
          const preferredCityMatch = jobCityIds.some((id) =>
            candOtherCityIds.includes(id),
          );
          locationScore = mainCityMatch ? 10 : preferredCityMatch ? 6 : 0;
          location_type = mainCityMatch
            ? "main_city"
            : preferredCityMatch
              ? "preferred_city"
              : "pipeline";
        }
        score += locationScore;

        // ── Skills (30pts) ──
        let skillScore = 0;
        if (jobSkillIds.length === 0) {
          skillScore = 30;
          matched.push("Skills");
        } else if (candSkillIds.length === 0) {
          skillScore = 0;
          missing.push("Skills (none matched)");
        } else {
          const matchedCount = jobSkillIds.filter((id) =>
            candSkillIds.includes(id),
          ).length;
          skillScore = Math.round((matchedCount / jobSkillIds.length) * 30);
          if (skillScore >= 20)
            matched.push(`Skills (${matchedCount}/${jobSkillIds.length})`);
          else if (skillScore > 0)
            missing.push(
              `Skills (${matchedCount}/${jobSkillIds.length} matched)`,
            );
          else missing.push("Skills (none matched)");
        }
        score += skillScore;

        // ── Experience (25pts) ──
        // ✅ FIX: "matched" is now based on whether the candidate's experience
        // actually meets the job's minimum — not on whether the fuzzy score
        // happened to clear an arbitrary >=20 cutoff. Previously a 0-vs-1-year
        // gap only cost 4 points (25 - 4 = 21), which cleared 20 and falsely
        // counted as matched.
        const jobMinExp = parseInt(job.min_experience) || 0;
        const jobMaxExp = parseInt(job.max_experience) || 50;
        let expScore = 0;
        if (jobMinExp === 0 && jobMaxExp === 0) {
          expScore = 25;
        } else if (candExp >= jobMinExp && candExp <= jobMaxExp) {
          expScore = 25;
        } else if (candExp < jobMinExp) {
          expScore = Math.max(0, 25 - (jobMinExp - candExp) * 4);
        } else {
          expScore = 20;
        }
        score += expScore;

        const expMatched = candExp >= jobMinExp;
        if (expMatched) {
          matched.push("Experience");
        } else {
          missing.push(
            `Experience (you have ${candExp} yrs, job needs ${jobMinExp}-${jobMaxExp})`,
          );
        }

        // ── Speciality (20pts) ──
        // ✅ FIX: "no requirement on the job" is no longer treated as a match.
        // It only gets neutral points now. A match is only claimed when the
        // candidate actually has speciality data AND it satisfies the job's
        // requirement. If the job requires one and the candidate has none,
        // that's now explicitly flagged as missing (not set).
        let specScore = 0;
        let specMatched = false;
        if (!job.speciality_id) {
          specScore = 20; // no requirement — neutral score, no claimed match
        } else if (candSpecialityIds.length === 0) {
          specScore = 0;
          missing.push("Speciality (not set)");
        } else if (candSpecialityIds.includes(Number(job.speciality_id))) {
          specScore = 20;
          specMatched = true;
          matched.push("Speciality");
        } else {
          missing.push("Speciality");
        }
        score += specScore;

        // ── Degree (10pts) ──
        // hasDegree now correctly reflects real data (see STEP 5 fix above),
        // so this block's existing logic is now accurate without further changes.
        const jobDegreeTypeId = job.degree_id ? Number(job.degree_id) : null;
        const jobDegreeFieldId = job.degreefields_id
          ? Number(job.degreefields_id)
          : null;
        let degreeScore = 0;

        if (!jobDegreeTypeId && !jobDegreeFieldId) {
          degreeScore = hasDegree ? 10 : 0;
          if (hasDegree) matched.push("Education");
          else missing.push("Education");
        } else {
          const degreeTypeMatch = candDegreeTypeIds.includes(jobDegreeTypeId);
          const degreeFieldMatch =
            candDegreeFieldIds.includes(jobDegreeFieldId);
          if (jobDegreeFieldId && jobDegreeTypeId) {
            if (degreeFieldMatch && degreeTypeMatch) {
              degreeScore = 10;
              matched.push("Education (degree & field match)");
            } else if (degreeTypeMatch || degreeFieldMatch) {
              degreeScore = 5;
              matched.push(
                `Education (partial: ${degreeTypeMatch ? "type" : "field"} matched)`,
              );
            } else if (hasDegree) {
              degreeScore = 2;
              missing.push("Education (wrong degree type & field)");
            } else {
              degreeScore = 0;
              missing.push("Education (none)");
            }
          } else if (jobDegreeFieldId) {
            if (degreeFieldMatch) {
              degreeScore = 10;
              matched.push("Education (field match)");
            } else if (hasDegree) {
              degreeScore = 3;
              missing.push("Education (wrong field)");
            } else {
              degreeScore = 0;
              missing.push("Education (none)");
            }
          } else if (jobDegreeTypeId) {
            if (degreeTypeMatch) {
              degreeScore = 10;
              matched.push("Education (degree type match)");
            } else if (hasDegree) {
              degreeScore = 3;
              missing.push("Education (wrong degree type)");
            } else {
              degreeScore = 0;
              missing.push("Education (none)");
            }
          }
        }
        score += degreeScore;
        const degreeMatched = degreeScore >= 5;

        // ── Salary (15pts) ──
        const jobMinSalary = parseFloat(job.min_salary || 0);
        const jobMaxSalary = parseFloat(job.max_salary || 0);
        let salaryScore = 15;
        let salaryOver = false;
        if (jobMinSalary || jobMaxSalary) {
          if (candSalary >= jobMinSalary && candSalary <= jobMaxSalary) {
            salaryScore = 15;
            matched.push("Salary");
          } else if (candSalary < jobMinSalary) {
            salaryScore = 10;
            matched.push("Salary (you expect less)");
          } else {
            const overage = ((candSalary - jobMaxSalary) / jobMaxSalary) * 100;
            salaryScore = overage > 50 ? 0 : overage > 25 ? 5 : 8;
            salaryOver = true;
            missing.push("Salary (your expectation exceeds job budget)");
          }
        } else {
          matched.push("Salary");
        }
        score += salaryScore;

        // ── Availability (10pts) ──
        // ✅ FIX: "job has no time window" is no longer treated as a candidate
        // match. It only gets neutral points now. A match is only claimed when
        // the candidate actually has availability rows AND they overlap with
        // the job's window.
        let availScore = 0;
        if (!job.time_from || !job.time_to) {
          availScore = 10; // job has no time constraint — neutral score, no claimed match
        } else if (availabilityRows.length === 0) {
          availScore = 5;
          missing.push("Availability (you haven't set availability)");
        } else {
          const hasOverlap = availabilityRows.some(
            (slot) =>
              slot.time_from <= job.time_to && slot.time_to >= job.time_from,
          );
          if (hasOverlap) {
            availScore = 10;
            matched.push("Availability");
          } else {
            availScore = 0;
            missing.push(
              `Availability (your hours don't overlap with ${job.time_from}–${job.time_to})`,
            );
          }
        }
        score += availScore;

        // ── Tier (same logic as getAllApplicants) ──
        const skillsMatched = skillScore >= 20;
        // expMatched and specMatched are already declared above with the fixed logic
        const coreCriteriaCount = [
          skillsMatched,
          expMatched,
          specMatched,
          degreeMatched,
        ].filter(Boolean).length;

        // filter out jobs where nothing at all matched
        if (coreCriteriaCount === 0) return null;

        let tier, tier_label, tier_color;
        if (coreCriteriaCount === 4) {
          tier = "strong";
          tier_label = "Strong Match";
          tier_color = "green";
        } else if (coreCriteriaCount >= 2) {
          tier = "good";
          tier_label = "Good Match";
          tier_color = "blue";
        } else {
          tier = "weak";
          tier_label = "Partial Match";
          tier_color = "amber";
        }

        if (salaryOver && tier === "strong") {
          tier = "good";
          tier_label = "Good Match";
          tier_color = "blue";
        }

        return {
          id: job.id,
          job_title: job.job_title,
          job_description: job.job_description,
          job_type: job.job_type,
          currency: job.currency,
          min_salary: job.min_salary,
          max_salary: job.max_salary,
          min_experience: job.min_experience,
          max_experience: job.max_experience,
          company_name: job.company_name,
          logo: job.logo ? job.logo.toString("base64") : null,
          created_at: job.created_at,
          already_applied: !!job.already_applied,
          application_status: job.application_status || null,
          pipeline_status: job.pipeline_status || null,
          is_sponsored: !!job.is_sponsored,
          location_type,
          ai_score: Math.min(100, score),
          tier,
          tier_label,
          tier_color,
          matched,
          missing,
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        if (tierOrder[a.tier] !== tierOrder[b.tier])
          return tierOrder[a.tier] - tierOrder[b.tier];
        const locOrder = {
          remote: 0,
          main_city: 0,
          preferred_city: 1,
          pipeline: 2,
        };
        if (locOrder[a.location_type] !== locOrder[b.location_type])
          return locOrder[a.location_type] - locOrder[b.location_type];
        if (b.is_sponsored !== a.is_sponsored) return b.is_sponsored ? 1 : -1;
        return b.ai_score - a.ai_score;
      });

    // ── STEP 9: Summary + response ──
    const summary = {
      total: tieredJobs.length,
      strong: tieredJobs.filter((j) => j.tier === "strong").length,
      good: tieredJobs.filter((j) => j.tier === "good").length,
      weak: tieredJobs.filter((j) => j.tier === "weak").length,
    };

    return res.json({ success: true, summary, data: tieredJobs });
  } catch (err) {
    console.error("getMatchingJobsForCandidate error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

const getAllCandidatesForEmployer = (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const offset = (page - 1) * limit;

  const search = (req.query.search || "").trim();
  const cityId = (req.query.city_id || "").trim();
  const experience = (req.query.experience || "").trim();
  const skillId = (req.query.skill_id || "").trim();

  let whereConditions = [
    `a.accountType = 'candidate'`,
    `a.isActive = 'Active'`,
    `ci.profile_completed = 1`,
  ];
  let values = [];

  if (search) {
    whereConditions.push(`ci.full_name LIKE ?`);
    values.push(`%${search}%`);
  }

  if (cityId) {
    whereConditions.push(`ci.city = ?`);
    values.push(cityId);
  }

  if (skillId) {
    whereConditions.push(`JSON_CONTAINS(ci.skills, JSON_ARRAY(?))`);
    values.push(parseInt(skillId));
  }

  const whereClause = `WHERE ${whereConditions.join(" AND ")}`;

  const query = `
    SELECT
      ci.id                   AS candidate_id,
      ci.full_name,
      ci.skills,
      ci.is_boosted,
      ci.boost_expires_at,
      ci.gender,
      ci.passport_photo,
      city.name               AS city_name,
      ctry.name               AS country_name,
      UPPER(LEFT(ci.full_name, 1)) AS initial,
      CASE 
        WHEN EXISTS (
          SELECT 1 FROM candidate_availability ca 
          WHERE ca.candidate_id = ci.id 
          AND ca.startTime IS NOT NULL
          LIMIT 1
        ) THEN 'Available'
        ELSE 'Availability not set'
      END AS availability_status
    FROM account a
    LEFT JOIN candidate_info ci  ON a.id = ci.account_id
    LEFT JOIN cities city        ON ci.city = city.id
    LEFT JOIN countries ctry     ON ci.country = ctry.id
    ${whereClause}
    ORDER BY
      ci.is_boosted DESC,
      ci.updated_at DESC
    LIMIT ? OFFSET ?
  `;

  const queryParams = [...values, limit, offset];

  connection.query(query, queryParams, (err, results) => {
    if (err) {
      console.error("❌ getAllCandidatesForEmployer error:", err.sqlMessage);
      return res.status(500).json({ error: "Database error" });
    }

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM account a
      LEFT JOIN candidate_info ci ON a.id = ci.account_id
      ${whereClause}
    `;

    const candidateIdsForExp = results.map((c) => c.candidate_id);

    connection.query(countQuery, values, (err2, countResult) => {
      if (err2) {
        console.error("❌ Count error:", err2.sqlMessage);
        return res.status(500).json({ error: "Database error" });
      }

      const expQuery = candidateIdsForExp.length
        ? `SELECT candidate_id, start_date, end_date, is_ongoing FROM candidate_experience WHERE candidate_id IN (?)`
        : null;

      const fetchExp = expQuery
        ? new Promise((resolve, reject) =>
            connection.query(expQuery, [candidateIdsForExp], (e, rows) =>
              e ? reject(e) : resolve(rows),
            ),
          )
        : Promise.resolve([]);

      fetchExp
        .then((expRows) => {
          let candidates = results.map((c) => {
            let skillIds = [];
            try {
              const parsed =
                typeof c.skills === "string"
                  ? JSON.parse(c.skills)
                  : c.skills || [];
              skillIds = Array.isArray(parsed) ? parsed : [];
            } catch {
              skillIds = [];
            }

            let photoUrl = null;
            if (c.passport_photo) {
              photoUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/$/, "")}${c.passport_photo}`;
            }

            const candExp = calculateTotalExperience(
              expRows.filter((e) => e.candidate_id === c.candidate_id),
            );

            return {
              candidate_id: c.candidate_id,
              full_name: c.full_name || "Anonymous",
              initial: c.initial || "?",
              total_experience: candExp,
              city_name: c.city_name || null,
              country_name: c.country_name || null,
              is_boosted: !!c.is_boosted,
              gender: c.gender || null,
              skills_count: skillIds.length,
              availability_status: c.availability_status || "Not specified",
              passport_photo: photoUrl,
            };
          });

          if (experience === "fresh") {
            candidates = candidates.filter((c) => c.total_experience === 0);
          } else if (experience === "1-3") {
            candidates = candidates.filter(
              (c) => c.total_experience >= 1 && c.total_experience <= 3,
            );
          } else if (experience === "3-5") {
            candidates = candidates.filter(
              (c) => c.total_experience >= 3 && c.total_experience <= 5,
            );
          } else if (experience === "5+") {
            candidates = candidates.filter((c) => c.total_experience >= 5);
          }

          const statsQuery = `
            SELECT
              COUNT(*) AS total_candidates,
              SUM(CASE WHEN a.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) AS new_this_week,
              SUM(CASE WHEN ci.is_boosted = 1 THEN 1 ELSE 0 END) AS boosted_count
            FROM account a
            LEFT JOIN candidate_info ci ON a.id = ci.account_id
            WHERE a.accountType = 'candidate'
              AND a.isActive = 'Active'
              AND ci.profile_completed = 1
          `;

          connection.query(statsQuery, (err3, statsResult) => {
            if (err3) {
              return res.status(200).json({
                total: countResult[0].total,
                page,
                limit,
                candidates,
                stats: null,
              });
            }

            return res.status(200).json({
              total: countResult[0].total,
              page,
              limit,
              candidates,
              stats: {
                total_candidates: statsResult[0].total_candidates || 0,
                new_this_week: statsResult[0].new_this_week || 0,
                boosted_count: statsResult[0].boosted_count || 0,
              },
            });
          });
        })
        .catch((expErr) => {
          console.error("❌ Experience fetch error:", expErr.message);
          return res.status(500).json({ error: "Database error" });
        });
    });
  });
};
const parseCVAndSave = async (req, res) => {
  try {
    const accountId = req.user?.userId;
    if (!accountId) return res.status(400).json({ error: "Invalid account" });

    const file = req.cvFile;
    if (!file) return res.status(400).json({ error: "No CV uploaded" });

    const resumePath = file.path
      .replace(/\\/g, "/")
      .replace(/^.*uploads/, "/uploads");

    // ✅ CV text extract
    let cvText = "";
    try {
      const fs = require("fs");
      const fileBuffer = fs.readFileSync(file.path);

      if (
        file.mimetype === "application/pdf" ||
        file.originalname?.toLowerCase().endsWith(".pdf")
      ) {
        const pdfData = await pdfParse(fileBuffer);
        cvText = pdfData.text || "";
      } else {
        const result = await mammoth.extractRawText({ path: file.path });
        cvText = result.value || "";
      }
    } catch (parseErr) {
      console.error("CV parse error:", parseErr.message);
      cvText = "";
    }

    // ✅ FREE regex-based extraction (no AI, no cost)
    function extractFieldsFree(text, skillsListFromDB) {
      const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
      const phoneMatch = text.match(/(03\d{2}[-\s]?\d{7})/);
      const expMatch = text.match(/(\d+)\+?\s*years?/i);

      const foundSkills = skillsListFromDB.filter(skill =>
        new RegExp(`\\b${skill.name}\\b`, "i").test(text)
      );

      const firstLine = text.split("\n").map(l => l.trim()).find(l => l.length > 2) || null;

      return {
        full_name: firstLine,
        email: emailMatch ? emailMatch[0] : null,
        phone: phoneMatch ? phoneMatch[0] : null,
        total_experience: expMatch ? expMatch[1] : null,
        skills_text: foundSkills.map(s => s.name),
        is_fresher: !expMatch,
      };
    }

    let extracted = { full_name: null, total_experience: null, skills_text: [], is_fresher: false };

    if (cvText.length > 50) {
      const allSkills = await new Promise((resolve) => {
        connection.query(`SELECT id, name FROM skills WHERE status = 'Active'`, (err, rows) => {
          resolve(err ? [] : rows);
        });
      });
      extracted = extractFieldsFree(cvText, allSkills);
    }

    // ✅ Skills DB match (still fine to keep — refines the match)
    let skillIds = [];
    if (extracted.skills_text?.length) {
      const skillNames = extracted.skills_text.map((s) => s.toLowerCase().trim());
      const placeholders = skillNames.map(() => "LOWER(name) LIKE ?").join(" OR ");
      const skillValues = skillNames.map((s) => `%${s}%`);

      await new Promise((resolve) => {
        connection.query(
          `SELECT id, name FROM skills WHERE (${placeholders}) AND status = 'Active'`,
          skillValues,
          (err, rows) => {
            if (!err && rows) skillIds = rows.map((r) => r.id);
            resolve();
          },
        );
      });
    }

    // ✅ Save to DB
    const sql = `
      INSERT INTO candidate_info (
        account_id, full_name, skills,
        resume, registration_type, is_fresher, profile_completed
      )
      VALUES (?, ?, ?, ?, 'cv_only', ?, 1)
      ON DUPLICATE KEY UPDATE
        full_name        = IF(VALUES(full_name) IS NOT NULL, VALUES(full_name), full_name),
        skills           = IF(VALUES(skills) IS NOT NULL, VALUES(skills), skills),
        resume           = VALUES(resume),
        registration_type = 'cv_only',
        is_fresher       = VALUES(is_fresher),
        profile_completed = 1
    `;

    connection.query(
      sql,
      [
        accountId,
        extracted.full_name || null,
        skillIds.length ? JSON.stringify(skillIds) : null,
        resumePath,
        extracted.is_fresher ? 1 : 0,
      ],
      (err) => {
        if (err) {
          console.error("CV DB save error:", err);
          return res.status(500).json({ error: err.message });
        }

        return res.json({
          success: true,
          message: "CV uploaded and parsed successfully",
          extracted: {
            full_name: extracted.full_name,
            total_experience: extracted.total_experience,
            skills_found: skillIds.length,
            is_fresher: extracted.is_fresher,
          },
        });
      },
    );
  } catch (error) {
    console.error("parseCVAndSave error:", error);
    return res.status(500).json({ error: error.message });
  }
};

const toggleSaveJob = (req, res) => {
  const accountId = req.user.userId;
  const { job_id } = req.body;

  if (!job_id) return res.status(400).json({ error: "job_id is required" });

  connection.query(
    "SELECT id FROM saved_jobs WHERE account_id = ? AND job_id = ?",
    [accountId, job_id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "Database error" });

      if (rows.length > 0) {
        connection.query(
          "DELETE FROM saved_jobs WHERE account_id = ? AND job_id = ?",
          [accountId, job_id],
          (err2) => {
            if (err2) return res.status(500).json({ error: "Database error" });
            res.json({ success: true, saved: false });
          },
        );
      } else {
        connection.query(
          "INSERT INTO saved_jobs (account_id, job_id) VALUES (?, ?)",
          [accountId, job_id],
          (err2) => {
            if (err2) return res.status(500).json({ error: "Database error" });
            res.json({ success: true, saved: true });
          },
        );
      }
    },
  );
};

const getSavedJobs = (req, res) => {
  const accountId = req.user.userId;

  connection.query(
    `SELECT 
      sj.job_id,
      jp.job_title,
      jp.min_salary, jp.max_salary,
      jp.min_experience, jp.max_experience,
      jp.status, jp.created_at,
      jt.name AS job_type,
      ccy.code AS currency,
      ci.company_name, ci.logo,
      c.name AS city_name
    FROM saved_jobs sj
    JOIN job_posts jp ON jp.id = sj.job_id
    LEFT JOIN company_info ci ON ci.account_id = jp.account_id
    LEFT JOIN cities c ON c.id = jp.city_id
    LEFT JOIN jobtypes jt ON jt.id = jp.job_type_id
    LEFT JOIN currencies ccy ON ccy.id = jp.currency_id
    WHERE sj.account_id = ?
    ORDER BY sj.id DESC`,
    [accountId],
    (err, results) => {
      if (err) return res.status(500).json({ error: "Database error" });

      const jobs = results.map((job) => ({
        ...job,
        logo: job.logo ? job.logo.toString("base64") : null,
      }));

      res.json({ success: true, data: jobs });
    },
  );
};

// ============ JOB PREFERENCES FUNCTIONS ============

const saveJobPreferences = (req, res) => {
  const accountId = req.user.userId;

  const {
    desired_job_titles,
    job_type,
    min_salary,
    max_salary,
    currency_id,
    preferred_country_id,
    preferred_city_ids,
    experience_level,
    notice_period,
    joining_date,
    shift_preference,
    willing_to_relocate,
    alerts_enabled,
  } = req.body;

  connection.query(
    `SELECT id FROM candidate_info WHERE account_id = ? LIMIT 1`,
    [accountId],
    (err, rows) => {
      if (err) {
        console.error("Error fetching candidate_id:", err);
        return res.status(500).json({ error: "Database error" });
      }

      if (!rows.length) {
        return res.status(404).json({ error: "Candidate not found" });
      }

      const candidateId = rows[0].id;

      const sql = `
        INSERT INTO job_preferences (
          candidate_id,
          desired_job_titles,
          job_type,
          min_salary,
          max_salary,
          currency_id,
          preferred_country_id,
          preferred_city_ids,
          experience_level,
          notice_period,
          joining_date,
          shift_preference,
          willing_to_relocate,
          alerts_enabled
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          desired_job_titles   = VALUES(desired_job_titles),
          job_type             = VALUES(job_type),
          min_salary           = VALUES(min_salary),
          max_salary           = VALUES(max_salary),
          currency_id          = VALUES(currency_id),
          preferred_country_id = VALUES(preferred_country_id),
          preferred_city_ids   = VALUES(preferred_city_ids),
          experience_level     = VALUES(experience_level),
          notice_period        = VALUES(notice_period),
          joining_date         = VALUES(joining_date),
          shift_preference     = VALUES(shift_preference),
          willing_to_relocate  = VALUES(willing_to_relocate),
          alerts_enabled       = VALUES(alerts_enabled)
      `;

      const params = [
        candidateId,
        JSON.stringify(desired_job_titles || []),
        JSON.stringify(job_type || []),
        min_salary || null,
        max_salary || null,
        currency_id || null,
        preferred_country_id || null,
        JSON.stringify(preferred_city_ids || []),
        experience_level || null,
        notice_period || null,
        joining_date || null,
        JSON.stringify(shift_preference || []),
        willing_to_relocate ? 1 : 0,
        alerts_enabled !== undefined ? (alerts_enabled ? 1 : 0) : 1,
      ];

      connection.query(sql, params, (err2) => {
        if (err2) {
          console.error("Error saving job preferences:", err2);
          return res.status(500).json({ error: "Database error" });
        }

        return res.status(200).json({
          success: true,
          message: "Job preferences saved successfully",
        });
      });
    },
  );
};

const getJobPreferences = (req, res) => {
  const accountId = req.user.userId;

  const sql = `
    SELECT
      jp.*,
      co.name AS preferred_country_name,
      cur.code AS currency_code
    FROM job_preferences jp
    JOIN candidate_info ci ON ci.id = jp.candidate_id
    LEFT JOIN countries co ON co.id = jp.preferred_country_id
    LEFT JOIN currencies cur ON cur.id = jp.currency_id
    WHERE ci.account_id = ?
    LIMIT 1
  `;

  connection.query(sql, [accountId], (err, rows) => {
    if (err) {
      console.error("Error fetching job preferences:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (!rows.length) {
      return res.status(200).json({
        success: true,
        data: null,
        message: "No preferences set yet",
      });
    }

    const pref = rows[0];

    const parseJSON = (val) => {
      if (!val) return [];
      try {
        return typeof val === "string" ? JSON.parse(val) : val;
      } catch {
        return [];
      }
    };

    const response = {
      id: pref.id,
      candidate_id: pref.candidate_id,
      desired_job_titles: parseJSON(pref.desired_job_titles),
      job_type: parseJSON(pref.job_type),
      min_salary: pref.min_salary || null,
      max_salary: pref.max_salary || null,
      currency: {
        id: pref.currency_id || null,
        code: pref.currency_code || null,
      },
      preferred_country: {
        id: pref.preferred_country_id || null,
        name: pref.preferred_country_name || null,
      },
      preferred_city_ids: parseJSON(pref.preferred_city_ids),
      experience_level: pref.experience_level || null,
      notice_period: pref.notice_period || null,
      joining_date: pref.joining_date
        ? pref.joining_date.toISOString().slice(0, 10)
        : null,
      shift_preference: parseJSON(pref.shift_preference),
      willing_to_relocate: !!pref.willing_to_relocate,
      alerts_enabled: !!pref.alerts_enabled,
      created_at: pref.created_at,
      updated_at: pref.updated_at,
    };

    return res.status(200).json({
      success: true,
      data: response,
    });
  });
};

const getJobAlerts = (req, res) => {
  const accountId = req.user.userId;

  const sql = `
    SELECT
      ja.id AS alert_id,
      ja.is_read,
      ja.sent_at,
       ja.alert_type,        
      ja.message,  
      jp.id AS job_id,
      jp.job_title,
      jp.min_salary,
      jp.max_salary,
      jp.status AS job_status,
      jt.name AS job_type,
      ccy.code AS currency,
      ci.company_name,
      ci.logo,
      c.name AS city_name
    FROM job_alerts ja
    JOIN job_posts jp ON jp.id = ja.job_id
    JOIN candidate_info can_info ON can_info.id = ja.candidate_id
    LEFT JOIN company_info ci ON ci.account_id = jp.account_id
    LEFT JOIN cities c ON c.id = jp.city_id
    LEFT JOIN jobtypes jt ON jt.id = jp.job_type_id
    LEFT JOIN currencies ccy ON ccy.id = jp.currency_id
    WHERE can_info.account_id = ?
    ORDER BY ja.sent_at DESC
    LIMIT 20
  `;

  connection.query(sql, [accountId], (err, results) => {
    if (err) {
      console.error("getJobAlerts error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    const alerts = results.map((alert) => ({
      ...alert,
      logo: alert.logo ? alert.logo.toString("base64") : null,
      alert_type: alert.alert_type || "job_match", // ← add this
      message: alert.message || null,
    }));

    return res.status(200).json({
      success: true,
      data: alerts,
      unread_count: alerts.filter((a) => !a.is_read).length,
    });
  });
};

const markJobAlertRead = (req, res) => {
  const accountId = req.user.userId;
  const { alert_id } = req.params;

  const sql = `
    UPDATE job_alerts ja
    JOIN candidate_info ci ON ci.id = ja.candidate_id
    SET ja.is_read = 1
    WHERE ja.id = ? AND ci.account_id = ?
  `;

  connection.query(sql, [alert_id, accountId], (err) => {
    if (err) {
      console.error("markJobAlertRead error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    return res
      .status(200)
      .json({ success: true, message: "Alert marked as read" });
  });
};

const markAllJobAlertsRead = (req, res) => {
  const accountId = req.user.userId;

  const sql = `
    UPDATE job_alerts ja
    JOIN candidate_info ci ON ci.id = ja.candidate_id
    SET ja.is_read = 1
    WHERE ci.account_id = ? AND ja.is_read = 0
  `;

  connection.query(sql, [accountId], (err) => {
    if (err) {
      console.error("markAllJobAlertsRead error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    return res
      .status(200)
      .json({ success: true, message: "All alerts marked as read" });
  });
};

// ============ PROFILE VIEW STATISTICS FUNCTIONS (using candidate_search_impressions) ============

const getProfileViewStats = (req, res) => {
  const accountId = req.user.userId;
  const { period = "28days" } = req.query;

  const getCandidateIdSql = `SELECT id FROM candidate_info WHERE account_id = ? LIMIT 1`;

  connection.query(getCandidateIdSql, [accountId], (err, candidateRows) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (!candidateRows.length)
      return res.json({
        success: true,
        data: [],
        current_total: 0,
        previous_total: 0,
      });

    const candidateInfoId = candidateRows[0].id;

    let currentInterval, previousInterval, groupFormat, labelFormat;

    if (period === "28days") {
      currentInterval = "INTERVAL 28 DAY";
      previousInterval = "INTERVAL 56 DAY";
      groupFormat = "%Y-%m-%d"; // group by day
    } else if (period === "weekly") {
      currentInterval = "INTERVAL 8 WEEK";
      previousInterval = "INTERVAL 16 WEEK";
      groupFormat = "%x-%v"; // ISO year-week
    } else {
      // monthly
      currentInterval = "INTERVAL 6 MONTH";
      previousInterval = "INTERVAL 12 MONTH";
      groupFormat = "%Y-%m";
    }

    // Fetch current period data
    const currentSql = `
      SELECT 
        DATE_FORMAT(searched_at, ?) AS period_key,
        COUNT(*) AS count
      FROM candidate_search_impressions
      WHERE candidate_id = ?
        AND searched_at >= DATE_SUB(NOW(), ${currentInterval})
      GROUP BY period_key
      ORDER BY period_key ASC
    `;

    // Fetch previous period total (for % change)
    const previousSql = `
      SELECT COUNT(*) AS total
      FROM candidate_search_impressions
      WHERE candidate_id = ?
        AND searched_at >= DATE_SUB(NOW(), ${previousInterval})
        AND searched_at <  DATE_SUB(NOW(), ${currentInterval})
    `;

    connection.query(
      currentSql,
      [groupFormat, candidateInfoId],
      (err2, currentRows) => {
        if (err2) return res.status(500).json({ error: "Database error" });

        connection.query(previousSql, [candidateInfoId], (err3, prevRows) => {
          if (err3) return res.status(500).json({ error: "Database error" });

          const previousTotal = prevRows[0]?.total || 0;
          const currentTotal = currentRows.reduce((sum, r) => sum + r.count, 0);

          let filledData = [];

          if (period === "28days") {
            for (let i = 27; i >= 0; i--) {
              const d = new Date();
              d.setDate(d.getDate() - i);
              const key = d.toISOString().slice(0, 10); // "2026-05-18"

              // Label: "5 May", "6 May" etc
              const label = d.toLocaleDateString("en-US", {
                day: "numeric",
                month: "short",
              });

              const found = currentRows.find((r) => r.period_key === key);
              filledData.push({ label, count: found ? found.count : 0 });
            }
          } else if (period === "weekly") {
            filledData = currentRows.map((r) => {
              const [year, week] = r.period_key.split("-").map(Number);
              const jan4 = new Date(year, 0, 4);
              const dow = jan4.getDay() || 7;
              const mon = new Date(jan4);
              mon.setDate(jan4.getDate() - (dow - 1) + (week - 1) * 7);
              const sun = new Date(mon);
              sun.setDate(mon.getDate() + 6);
              const fmt = (d) =>
                d.toLocaleDateString("en-US", {
                  day: "numeric",
                  month: "short",
                });
              return { label: `${fmt(mon)} – ${fmt(sun)}`, count: r.count };
            });
          } else {
            // monthly
            filledData = currentRows.map((r) => {
              const [year, month] = r.period_key.split("-");
              const label = new Date(
                year,
                parseInt(month) - 1,
                1,
              ).toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              });
              return { label, count: r.count };
            });
          }

          return res.json({
            success: true,
            data: filledData,
            current_total: currentTotal,
            previous_total: previousTotal,
            period,
          });
        });
      },
    );
  });
};

// Helper function to get week number
function getWeekNumber(date) {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

// Track profile view - now using candidate_search_impressions
const trackProfileView = (req, res) => {
  const param = req.params.candidateId;
  const recruiterId = req.user.userId;
  const { job_id } = req.body;

  console.log("📌 Backend received:", { param, recruiterId, job_id });

  // param account_id bhi ho sakta hai ya candidate_info.id bhi
  const sql = `
    SELECT id FROM candidate_info 
    WHERE account_id = ? OR id = ?
    LIMIT 1
  `;

  connection.query(sql, [param, param], (err, rows) => {
    if (err || !rows.length) {
      return res.status(200).json({ success: true }); // silently fail
    }

    const candidateInfoId = rows[0].id;

    // Insert into candidate_search_impressions instead of profile_views
    connection.query(
      `INSERT INTO candidate_search_impressions (candidate_id, company_id, job_id, searched_at)
       VALUES (?, ?, ?, NOW())`,
      [
        candidateInfoId,
        recruiterId, // company_id is the recruiter's account_id
        job_id || null,
      ],
      (err2) => {
        if (err2) console.error("Track view error:", err2);
        res.status(200).json({ success: true });
      },
    );
  });
};

const getCandidatePackages = (req, res) => {
  const accountId = req.params.userId;

  const sql = `
    SELECT 
      bo.id AS subscription_id,
      bo.status,
      bo.start_date,
      bo.end_date,
      bo.created_at,
      p.id AS package_id,
      p.name AS package_name,
      p.price,
      p.pricing_model,
      p.boost_type,
      p.boost_duration_days,
      p.duration_days,
      p.description,
      COALESCE(c.code, 'PKR') AS currency
    FROM boost_orders bo
    JOIN candidate_info ci ON ci.id = bo.candidate_id
    JOIN packages p ON p.id = bo.package_id
    LEFT JOIN currencies c ON c.id = p.currency_id
    WHERE ci.account_id = ?
    ORDER BY bo.created_at DESC
  `;

  connection.query(sql, [accountId], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });

    const packages = results.map((p) => ({
      subscription_id: p.subscription_id,
      package_name: p.package_name,
      pricing_model: p.pricing_model,
      boost_type: p.boost_type,
      status: p.status,
      start_date: p.start_date,
      end_date: p.end_date,
      purchased_at: p.created_at,
      price: p.price,
      currency: p.currency,
      duration_days: p.boost_duration_days || p.duration_days || 0,
      description: p.description,
      is_active: p.status === "active",
    }));

    res.json({ success: true, data: packages });
  });
};

module.exports = {
  getAllCandidates,
  updateStatus,
  createCandidateTable,
  createCandidatePreferredCitiesTable,
  createCandidateSpecialityTable,
  createsaveJobsTableQuery,
  addCandidateInfo,
  getCandidateInfo,
  editCandidateInfo,
  getCandidateInfobyId,
  getCandidatepassport_photobyId,
  getCandidateFullProfilebyId,
  getCandidateInfobyAccountType,
  addResume,

  createBoostPackagesTable,
  createBoostOrdersTable,
  addBoostColumnsToCandidateInfo,
  getBoostPackages,
  placeBoostOrder,
  getMyBoostStatus,
  getBoostOrders,
  activateBoost,
  rejectBoost,
  getCandidatesForJob,
  getBoostAnalytics,
  getMatchingJobsForCandidate,
  getAllCandidatesForEmployer,
  parseCVAndSave,
  toggleSaveJob,
  getSavedJobs,
  createJobPreferencesTable,
  createJobAlertsTable,
  saveJobPreferences,
  getJobPreferences,
  getJobAlerts,
  markJobAlertRead,
  markAllJobAlertsRead,
  createProfileViewsTable,
  getProfileViewStats,
  trackProfileView,
  getCandidatePackages,
};
