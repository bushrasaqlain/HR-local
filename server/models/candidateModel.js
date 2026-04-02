const express = require("express");
const router = express.Router();
const connection = require("../connection");
const authMiddleware = require("../middleware/auth");
const logAudit = require("../utils/auditLogger");
const { get } = require("../routes/accountRoutes");

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

  total_experience VARCHAR(20),

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
    if (err) return console.error("Error creating boost_packages table:", err.message);
    console.log("boost_packages table created successfully");

    const insertSql = `
      INSERT IGNORE INTO boost_packages (id, name, duration_days, price) VALUES
        (1, '7 Day Boost',  7,  299),
        (2, '14 Day Boost', 14, 499),
        (3, '30 Day Boost', 30, 799)
    `;
    connection.query(insertSql, (err2) => {
      if (err2) return console.error("Error inserting default boost packages:", err2.message);
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
      FOREIGN KEY (package_id)   REFERENCES boost_packages(id)
    )
  `;
  connection.query(sql, (err) => {
    if (err) return console.error("Error creating boost_orders table:", err.message);
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
    }
  );

  connection.query(
    `ALTER TABLE candidate_info ADD COLUMN boost_expires_at DATETIME NULL`,
    (err) => {
      if (err && err.code !== "ER_DUP_FIELDNAME") {
        console.error("Error adding boost_expires_at column:", err.message);
      } else {
        console.log("boost_expires_at column ready in candidate_info");
      }
    }
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
           c.id as candidate_id,
           c.full_name,
           c.phone,
           c.date_of_birth,
           c.gender,
           c.marital_status,
           c.total_experience,
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
      action: status === "Active" ? "ACTIVE" : "INACTIVE",  // ✅ fix
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
      total_experience,
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
      ? req.passportPhotoPath.replace(/\\/g, "/").replace(/^.*uploads/, "/uploads")
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
          total_experience,
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
          resume
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
  total_experience = COALESCE(VALUES(total_experience), total_experience),
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
  profile_completed = COALESCE(VALUES(profile_completed), profile_completed)
      `;

      const params = [
        accountId,
        full_name,
        phone,
        date_of_birth,
        gender,
        marital_status,
        total_experience,
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
      ];

      connection.query(sql, params, (err2) => {
        if (err2) {
          console.error("DB Error:", err2);
          return res.status(500).json({
            success: false,
            error: err2.message,
          });
        }

        return res.json({
          success: true,
          message: "Candidate profile saved successfully",
          profile_completed: profileCompleted,
        });
      });
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
      ci.phone,
      ci.date_of_birth,
      ci.gender,
      ci.marital_status,
      ci.total_experience,
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
      "total_experience",
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
        connection.query(
          availabilitySql,
          [candidate.candidate_id],
          (err, rows) => {
            if (err) return reject(err);
            resolve(rows.length > 0);
          },
        );
      }),
      new Promise((resolve, reject) => {
        connection.query(
          certificatesSql,
          [candidate.candidate_id],
          (err, rows) => {
            if (err) return reject(err);
            resolve(rows.length > 0);
          },
        );
      }),
      new Promise((resolve, reject) => {
        connection.query(researchSql, [candidate.candidate_id], (err, rows) => {
          if (err) return reject(err);
          resolve(rows.length > 0);
        });
      }),
    ])
      .then(([hasAvailability, hasCertificates, hasResearch]) => {
        if (hasAvailability) completedCount++;
        if (hasCertificates) completedCount++;
        if (hasResearch) completedCount++;

        const totalFields = fieldsToCheck.length + 3; // +3 for availability, certificates, research
        const profile_completion_percent = Math.round(
          (completedCount / totalFields) * 100,
        ); // ✅ declare & assign here

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
        };

        // -------- Tracking Queries --------
        const searchCountSql = `
        SELECT COUNT(*) AS appeared_in_search,
               COUNT(DISTINCT company_id) AS profile_views
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
          a.status,
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
        AND a.status IN ('Shortlisted', 'Approved')
      `;

        Promise.all([
          new Promise((resolve, reject) => {
            connection.query(
              searchCountSql,
              [candidate.candidate_id],
              (err, rows) => {
                if (err) return reject(err);
                response.appeared_in_search = rows[0]?.appeared_in_search || 0;
                response.profile_views = rows[0]?.profile_views || 0;
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
                  if (r.status === "Shortlisted")
                    response.shortlisted_count = r.count;
                  if (r.status === "Approved")
                    response.approved_count = r.count;
                  if (r.status === "Interview")
                    response.interview_count = r.count;
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
                    accountId: row.account_id,
                    candidate_response: row.candidate_response,
                    company_status: row.company_status,
                    company_id: row.company_id,
                    company_name: row.company_name,
                    logo: row.logo,
                    job_id: row.job_id,
                    job_title: row.job_title,
                    interview_day: row.interview_day || null,
                    interview_time: row.interview_time || null,
                    candidate_id: row.candidate_id,
                    // account_id: row.account_id
                  };
                  if (row.status === "Shortlisted")
                    response.shortlisted_companies.push(companyData);
                  if (row.status === "Approved")
                    response.approved_companies.push(companyData);
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
    ? req.passportPhotoPath.replace(/\\/g, "/").replace(/^.*uploads/, "/uploads")
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
    total_experience: "total_experience",
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
    "SELECT * FROM boost_packages WHERE is_active = 1",
    (err, results) => {
      if (err) {
        console.error("Error fetching boost packages:", err.message);
        return res.status(500).json({ error: "Database error" });
      }
      res.json({ success: true, data: results });
    }
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
      if (err) {
        console.error("Error checking existing boost order:", err.message);
        return res.status(500).json({ error: "Database error" });
      }
      if (existing.length > 0) {
        return res.status(400).json({
          success: false,
          message: "A boost order is already active or pending",
        });
      }

      connection.query(
        "SELECT id FROM candidate_info WHERE account_id = ?",
        [accountId],
        (err2, rows) => {
          if (err2) {
            console.error("Error fetching candidate info id:", err2.message);
            return res.status(500).json({ error: "Database error" });
          }
          if (!rows.length) {
            return res.status(404).json({ success: false, message: "Candidate not found" });
          }

          const candidateInfoId = rows[0].id;

          connection.query(
            "INSERT INTO boost_orders (candidate_id, package_id) VALUES (?, ?)",
            [candidateInfoId, package_id],
            (err3) => {
              if (err3) {
                console.error("Error placing boost order:", err3.message);
                return res.status(500).json({ error: "Database error" });
              }
              console.log("Boost order placed for candidate:", candidateInfoId);
              res.json({
                success: true,
                message: "Boost order placed successfully. Waiting for admin approval.",
              });
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
            bp.name AS package_name, bp.duration_days,
            ci.id as candidate_id,
            ci.is_boosted, ci.boost_expires_at
     FROM candidate_info ci
     LEFT JOIN boost_orders bo
       ON bo.candidate_id = ci.id
       AND bo.status IN ('pending', 'active')
     LEFT JOIN boost_packages bp ON bp.id = bo.package_id
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
            "UPDATE candidate_info SET is_boosted = 0 WHERE id = ?",
            [data.candidate_id]
          );

          data.is_boosted = false;
        }
      }

      res.json({ success: true, data });
    }
  );
};

const getBoostOrders = (req, res) => {
  connection.query(
    `SELECT bo.id, bo.status, bo.created_at,
            ci.id AS candidate_info_id,
            a.email AS candidate_email,
            ci.full_name AS candidate_name,
            bp.name AS package_name,
            bp.duration_days, bp.price
     FROM boost_orders bo
     JOIN candidate_info ci ON ci.id = bo.candidate_id
     JOIN account a ON a.id = ci.account_id
     JOIN boost_packages bp ON bp.id = bo.package_id
     WHERE bo.status = 'pending'
     ORDER BY bo.created_at DESC`,
    (err, results) => {
      if (err) {
        console.error("Error fetching boost orders:", err.message);
        return res.status(500).json({ error: "Database error" });
      }
      res.json({ success: true, data: results });
    }
  );
};

const activateBoost = (req, res) => {
  const { orderId } = req.params;

  connection.query(
    `SELECT bo.*, bp.duration_days, bo.candidate_id
     FROM boost_orders bo
     JOIN boost_packages bp ON bp.id = bo.package_id
     WHERE bo.id = ?`,
    [orderId],
    (err, rows) => {
      if (err) {
        console.error("Error fetching boost order for activation:", err.message);
        return res.status(500).json({ error: "Database error" });
      }
      if (!rows.length) {
        return res.status(404).json({ success: false, message: "Order not found" });
      }

      const order = rows[0];
      const start = new Date();
      const end = new Date();
      end.setDate(end.getDate() + order.duration_days);

      connection.query(
        "UPDATE boost_orders SET status='active', start_date=?, end_date=? WHERE id=?",
        [start, end, orderId],
        (err2) => {
          if (err2) {
            console.error("Error updating boost order status:", err2.message);
            return res.status(500).json({ error: "Database error" });
          }

          connection.query(
            "UPDATE candidate_info SET is_boosted=1, boost_expires_at=? WHERE id=?",
            [end, order.candidate_id],
            (err3) => {
              if (err3) {
                console.error("Error updating candidate boost status:", err3.message);
                return res.status(500).json({ error: "Database error" });
              }
              console.log("Boost activated for candidate:", order.candidate_id);
              res.json({ success: true, message: "Boost activated successfully" });
            }
          );
        }
      );
    }
  );
};

const rejectBoost = (req, res) => {
  const { orderId } = req.params;

  connection.query(
    "UPDATE boost_orders SET status='rejected' WHERE id=?",
    [orderId],
    (err) => {
      if (err) {
        console.error("Error rejecting boost order:", err.message);
        return res.status(500).json({ error: "Database error" });
      }
      console.log("Boost order rejected:", orderId);
      res.json({ success: true, message: "Boost order rejected" });
    }
  );
};

const getCandidatesForJob = (req, res) => {
  const jobId = req.params.jobId;

  const sql = `
    SELECT 
      ci.id,
      ci.full_name,
      ci.total_experience,
      ci.skills,
      ci.is_boosted,
      ci.boost_expires_at
    FROM candidate_info ci
    JOIN job_posts jp ON 1=1
    WHERE jp.id = ?
    
    -- Skills match (important)
    AND JSON_OVERLAPS(ci.skills, jp.skill_ids)

    -- Experience match (optional improve later)
    AND ci.total_experience >= jp.min_experience

    ORDER BY 
      ci.is_boosted DESC,  
      ci.created_at DESC
  `;

  connection.query(sql, [jobId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error" });
    }

    res.json(results);
  });
};

const getBoostAnalytics = (req, res) => {
  const sql = `
    SELECT 
      COUNT(*) as total_orders,
      SUM(CASE WHEN bo.status = 'active' THEN 1 ELSE 0 END) as active_boosts,
      SUM(CASE WHEN bo.status = 'pending' THEN 1 ELSE 0 END) as pending_boosts,
      SUM(bp.price) as total_revenue
    FROM boost_orders bo
    JOIN boost_packages bp ON bp.id = bo.package_id
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
};
