const express = require("express");
const router = express.Router();
const connection = require("../connection");
const authMiddleware = require("../middleware/auth");
const logAudit = require("../utils/auditLogger");

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

  skills JSON,
  categories JSON,
  speciality JSON,

  
  current_salary DECIMAL(10,2),
  expected_salary DECIMAL(10,2),

  Links JSON, 

  country INT,
  district INT,
  city INT,
  address TEXT,
  otherPreferredCities JSON,



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
    }
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
const updateStatus = (id, status, res) => {
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
      action: "UPDATED",
      data: { status },
      changedBy: id,
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
      Age,
      Education,
      categories,
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

    const skillsArr = parseJSON(skills);
    const linksArr = parseJSON(Links);
    const educationArr = parseJSON(Education);
    const categoriesArr = parseJSON(categories);
    const otherCitiesArr = parseJSON(otherPreferredCities);

    // 🔹 Passport photo
    const passportPhotoPath = req.file
      ? `/uploads/passportPhotos/${req.file.filename}`
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
          email,
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
          \`Links\`,
          current_salary,
          expected_salary,
          Age,
          speciality,
          otherPreferredCities,
          categories,
          passport_photo,
          profile_completed
        )
        VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
        ON DUPLICATE KEY UPDATE
          email = VALUES(email),
          full_name = VALUES(full_name),
          phone = VALUES(phone),
          date_of_birth = VALUES(date_of_birth),
          gender = VALUES(gender),
          marital_status = VALUES(marital_status),
          total_experience = VALUES(total_experience),
          license_type = VALUES(license_type),
          license_number = VALUES(license_number),
          address = VALUES(address),
          country = VALUES(country),
          district = VALUES(district),
          city = VALUES(city),
          skills = VALUES(skills),
          \`Links\` = VALUES(\`Links\`),
          current_salary = VALUES(current_salary),
          expected_salary = VALUES(expected_salary),
          Age = VALUES(Age),
          speciality = VALUES(speciality),
          otherPreferredCities = VALUES(otherPreferredCities),
          categories = VALUES(categories),
          passport_photo = VALUES(passport_photo),
          profile_completed = VALUES(profile_completed)
      `;

      const params = [
        accountId,
        email,
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
        Age,
        speciality,
        otherCitiesArr ? JSON.stringify(otherCitiesArr) : null,
        categoriesArr ? JSON.stringify(categoriesArr) : null,
        passportPhotoPath,
        profileCompleted,
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

  const sql = `
    SELECT
      a.id AS account_id,
      a.email,
      ci.full_name,
      ci.phone,
      ci.date_of_birth,
      ci.gender,
      ci.marital_status,
      ci.total_experience,
      ci.license_type,
      ci.license_number,
      ci.otherPreferredCities,
      ci.speciality,
      ci.address,
      ci.country,
      ci.district,
      ci.city,
      ci.skills,
      ci.categories,
      ci.Links,
      ci.current_salary,
      ci.expected_salary,
      ci.Age,
      ci.profile_completed,
      ci.passport_photo
    FROM account a
    LEFT JOIN candidate_info ci ON a.id = ci.account_id
    WHERE a.id = ?
    LIMIT 1
  `;

  connection.query(sql, [accountId], (err, result) => {
    if (err) {
      console.error("DB Error:", err);
      return res.status(500).json({ error: err.message });
    }

    if (!result.length) {
      // Should not happen, account exists if logged in
      return res.status(404).json({ error: "Account not found" });
    }

    const candidate = result[0];

    // Helper to parse JSON fields
    const parseJSON = (value) => {
      if (!value) return [];
      try {
        return typeof value === "string" ? JSON.parse(value) : value;
      } catch {
        return [];
      }
    };

    const response = {
      account_id: candidate.account_id || candidate.id,
      email: candidate.email || "",
      full_name: candidate.full_name || "",
      phone: candidate.phone || "",
      date_of_birth: candidate.date_of_birth || "",
      gender: candidate.gender || "",
      marital_status: candidate.marital_status || "",
      total_experience: candidate.total_experience || "",
      license_type: candidate.license_type || "",
      license_number: candidate.license_number || "",
      address: candidate.address || "",
      country: candidate.country || "",
      district: candidate.district || "",
      city: candidate.city || "",
      speciality: candidate.speciality || "",
      otherPreferredCities: parseJSON(candidate.otherPreferredCities),
      skills: parseJSON(candidate.skills),
      categories: parseJSON(candidate.categories),
      Education: parseJSON(candidate.Education),
      Links: parseJSON(candidate.Links),
      current_salary: candidate.current_salary || "",
      expected_salary: candidate.expected_salary || "",
      Age: candidate.Age || "",
      profile_completed: !!candidate.profile_completed,
      passport_photo: candidate.passport_photo || null,
    };

    res.json(response);
  });
};


const editCandidateInfo = (req, res) => {
  const accountId = parseInt(req.params.accountId) || req.user.userId;
  if (isNaN(accountId))
    return res.status(400).json({ error: "Invalid account_id" });

  const passport_photoPath = req.file
    ? `/uploads/passport_photos/${req.file.filename}`
    : null;

  const fieldMap = {
    phone: "phone",
    date_of_birth: "date_of_birth",
    gender: "gender",
    marital_status: "marital_status",
    Experience: "Experience",
    total_experience: "Experience",
    license_type: "license_type",
    license_number: "license_number",
    address: "address",
    Complete_Address: "Complete_Address",
    country: "country",
    district: "district",
    city: "city",
    skills: "skills",
    Description: "Description",
    Links: "Links",
    profile_completed: "profile_completed",
    currentSalary: "current_salary",
    expectedSalary: "expected_salary",
    Age: "Age",
    Education: "Education",
    categories: "categories",
  };

  const infoFields = [];
  const infoValues = [];

  Object.entries(fieldMap).forEach(([key, col]) => {
    if (req.body[key] !== undefined) {
      let val = req.body[key];
      if (["skills", "Links", "categories"].includes(key)) {
        if (typeof val === "string") {
          try {
            val = JSON.parse(val);
          } catch (e) { }
        }
        val = JSON.stringify(val);
      }
      infoFields.push(`${col} = ?`);
      infoValues.push(val);
    }
  });

  if (passport_photoPath) {
    infoFields.push("passport_photo = ?");
    infoValues.push(passport_photoPath);
  }

  if (infoFields.length === 0)
    return res.json({ message: "No fields to update" });

  const sql = `UPDATE candidate_info SET ${infoFields.join(
    ", "
  )} WHERE account_id = ?`;
  infoValues.push(accountId);

  connection.query(sql, infoValues, (err, result) => {
    if (err) {
      console.error("Candidate update error:", err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: "Candidate info updated successfully", result });
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
          "base64"
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
        [accountId]
      ),
      queryPromise(
        `SELECT  City, Phone as phone, skills, Links
         FROM candidate_info WHERE Account_ID = ?`,
        [accountId]
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

// router.get('/availablejobs', (req, res) => {
//   const jobPostsQuery = `
//     SELECT *
//     FROM job_posts AS jp
//     JOIN company_info AS ci ON jp.account_id = ci.account_id;
//   `;

//   connection.query(jobPostsQuery, (err, jobPostsResults) => {
//     if (err) {
//       console.error('Error fetching all job posts:', err);
//       return res.status(500).json({ error: 'Internal Server Error' });
//     }
//     res.status(200).json(resultsWithIndustryIDs);
//   });
// });
// Add more routes as needed

// Route to fetch data from the candidate_info table for a specific user
// router.get("/", (req, res) => {
//   // Assuming you have a way to get the logged-in user's ID, replace 'loggedInUserId' with the actual user ID
//   const loggedInUserId = req.user.id; // Replace this with your actual way of getting the user ID

//   const sql = "SELECT * FROM candidate_info WHERE ID = ?";

//   connection.query(sql, [loggedInUserId], (err, results) => {
//       if (err) {
//           console.error("Error fetching data:", err);
//           res.status(500).json({ error: "Error fetching data", details: err.message });
//       } else {
//
//           res.status(200).json({ data: results });
//       }
//   });
// });

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
};
