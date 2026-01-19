const express = require("express");
const router = express.Router();
const connection = require("../connection");
const authMiddleware = require("../middleware/auth");
const logAudit = require("../utils/auditLogger");

const createCandidateAvailabilityTable = () => {
  const createAvailiabilityTable = `
    CREATE TABLE candidate_availability (
      id INT AUTO_INCREMENT PRIMARY KEY,
      accountId INT,
      day ENUM('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'),
      shift ENUM('Day Shift','Night Shift', 'Both'),
      startTime TIME,
      endTime TIME,
      FOREIGN KEY (accountId) REFERENCES candidate_info(account_id) ON DELETE CASCADE
    );
      `;

  // Execute the queries to create the tables
  connection.query(createAvailiabilityTable, function (err, results, fields) {
    if (err) {
      return console.error(err.message);
    }
    console.log("Candidate Availiablitiy table created successfully");
  });
};

const createCandidateTable = () => {
  const createCandidateInfoTable = `
CREATE TABLE IF NOT EXISTS candidate_info (
  ID INT AUTO_INCREMENT PRIMARY KEY,
  account_id INT UNIQUE,
  passport_photo LONGBLOB NULL,             
  phone VARCHAR(20) NOT NULL,
  date_of_birth DATE NOT NULL,
  gender ENUM('male','female','other') NOT NULL,
  marital_status ENUM('single','married','divorced','widowed') NOT NULL,
  total_experience VARCHAR(20) NOT NULL,
  license_type VARCHAR(50),
  license_number VARCHAR(50),
  address TEXT,
  country INT NOT NULL,
  district INT NOT NULL,
  city INT NOT NULL,
  skills JSON,
  Description TEXT,
  Links Text,
  profile_completed BOOLEAN DEFAULT FALSE, 
  FOREIGN KEY (account_id) REFERENCES account(id),
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
  FOREIGN KEY (speciality_id) REFERENCES professions(id)
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
  const limit = parseInt(req.query.limit) || 15;
  const offset = (page - 1) * limit;
  const search = req.query.search || "";
  const status = req.query.status || "";

  // Map client-provided column names -> actual DB columns
  const columnMap = {
    name: "a.username",
    email: "a.email",
    phone: "c.phone",
    // company_name: "c.company_name",
    created_at: "a.created_at", // choose one table explicitly
    isActive: "a.isActive",
  };

  const searchColumn = columnMap[req.query.name] || "a.email"; // fallback

  const query = `
    SELECT a.*, 
           c.account_id, 
           c.id as candidate_id,
           c.phone,date_of_birth,
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
    WHERE a.accountType = 'candidate'
      ${status ? "AND a.isActive = ?" : ""}
      AND ${searchColumn} LIKE ?
    ORDER BY a.id DESC
    LIMIT ? OFFSET ?
  `;

  const queryParams = [];
  if (status) queryParams.push(status);
  queryParams.push(`%${search}%`, limit, offset);

  connection.query(query, queryParams, (err, results) => {
    if (err) {
      console.error("❌ Error fetching employers:", err.sqlMessage);
      return res.status(500).json({ error: "Database error" });
    }

    // Count query
    const countQuery = `
  SELECT COUNT(*) AS total
  FROM account a
  LEFT JOIN candidate_info c ON a.id = c.account_id
  WHERE a.accountType = 'candidate'
    ${status ? "AND a.isActive = ?" : ""}
    AND ${searchColumn} LIKE ?
`;

    const countParams = [];
    if (status) countParams.push(status);
    countParams.push(`%${search}%`);

    connection.query(countQuery, countParams, (err2, countResult) => {
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

const addAvailaibility = (req, res) => {
  const availabilityData = req.body;
  const values = availabilityData.map((item) => [
    item.accountId,
    item.day,
    item.shift,
    item.startTime,
    item.endTime,
  ]);
  const sql = `
    INSERT INTO candidate_availability (accountId, day, shift, startTime, endTime) VALUES ?
    `;
  connection.query(sql, [values], (err, result) => {
    if (err) {
      console.error("Error inserting availability data:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({
      success: true,
      message: "Availability data saved successfully",
    });
  });
};
const addCandidateInfo = async (req, res) => {
  try {
    const accountId = req.user.userId; // from auth middleware

    if (!accountId) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid account id" });
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
      Description,
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

    // 🔹 Parse JSON safely
    const parseJSON = (value) => {
      if (!value) return null;
      try {
        return typeof value === "string" ? JSON.parse(value) : value;
      } catch {
        return null;
      }
    };

    const skillsArr = parseJSON(skills);
    const linksArr = parseJSON(Links);
    const educationArr = parseJSON(Education);
    const categoriesArr = parseJSON(categories);
    const otherCitiesArr = parseJSON(otherPreferredCities); // ✅ make sure this is here

    // 🔹 Passport photo path
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
        console.error("Failed to fetch account email:", err);
        return res.status(500).json({ success: false, error: err.message });
      }

      const email = result[0]?.email || null;

      // 🔹 Insert / Update candidate_info
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
  Description,
  Links,
  current_salary,
  expected_salary,
  Age,
  Education,
  speciality,
  otherPreferredCities,
  categories,
  passport_photo,
  profile_completed
)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    \`Description\` = VALUES(\`Description\`),
    \`Links\` = VALUES(\`Links\`),
    current_salary = VALUES(current_salary),
    expected_salary = VALUES(expected_salary),
    Age = VALUES(Age),
    Education = VALUES(Education),
    speciality = VALUES(speciality),
    otherPreferredCities = VALUES(otherPreferredCities),
    categories = VALUES(categories),
    passport_photo = VALUES(passport_photo),
    profile_completed = VALUES(profile_completed)
`;

      const params = [
        accountId, // account_id
        email, // email
        full_name || null, // full_name
        phone || null, // phone
        date_of_birth || null, // date_of_birth
        gender || null, // gender
        marital_status || null, // marital_status
        total_experience || null, // total_experience
        license_type || null, // license_type
        license_number || null, // license_number
        address || null, // address
        country || null, // country
        district || null, // district
        city || null, // city
        skillsArr ? JSON.stringify(skillsArr) : null, // skills
        Description || null, // Description
        linksArr ? JSON.stringify(linksArr) : null, // Links
        current_salary || null, // current_salary
        expected_salary || null, // expected_salary
        Age || null, // Age
        educationArr ? JSON.stringify(educationArr) : null, // Education
        speciality || null, // speciality
        otherCitiesArr ? JSON.stringify(otherCitiesArr) : null, // otherPreferredCities
        categoriesArr ? JSON.stringify(categoriesArr) : null, // categories
        passportPhotoPath, // passport_photo
        profileCompleted, // profile_completed
      ];

      connection.query(sql, params, (err2, result2) => {
        if (err2) {
          console.error("DB Error:", err2);
          return res.status(500).json({ success: false, error: err2.message });
        }

        res.json({
          success: true,
          message: "Candidate profile saved successfully",
          profile_completed: profileCompleted,
        });
      });
    });
  } catch (error) {
    console.error("Save Candidate Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const getCandidateInfo = (req, res) => {
  const accountId = req.user.userId;

  const sql = `
    SELECT
      ci.account_id,
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
      ci.Education,
      ci.Description,
      ci.Links,
      ci.current_salary,
      ci.expected_salary,
      ci.Age,
      ci.profile_completed,
      ci.passport_photo
    FROM candidate_info ci
    LEFT JOIN account a ON a.id = ci.account_id
    WHERE ci.account_id = ?
    LIMIT 1
  `;

  connection.query(sql, [accountId], (err, result) => {
    if (err) {
      console.error("DB Error:", err);
      return res.status(500).json({ error: err.message });
    }

    if (!result.length) {
      return res.status(404).json({ error: "Candidate not found" });
    }

    const candidate = result[0];

    // Convert JSON fields back to arrays/objects
    const parseJSON = (value) => {
      if (!value) return [];
      try {
        return typeof value === "string" ? JSON.parse(value) : value;
      } catch {
        return [];
      }
    };

    const response = {
      account_id: candidate.account_id,
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
      speciality: candidate.speciality || "",
      otherPreferredCities: parseJSON(candidate.otherPreferredCities),
      city: candidate.city || "",
      skills: parseJSON(candidate.skills),
      categories: parseJSON(candidate.categories),
      Education: parseJSON(candidate.Education),
      Description: candidate.Description || "",
      Links: parseJSON(candidate.Links),
      current_salary: candidate.current_salary || "",
      expected_salary: candidate.expected_salary || "",
      Age: candidate.Age || "",
      profile_completed: candidate.profile_completed || false,
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
          } catch (e) {}
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
        `SELECT  City, Phone as phone, skills, Description, Links
         FROM candidate_info WHERE Account_ID = ?`,
        [accountId]
      ),
      queryPromise(
        `SELECT id, degree_title, field_of_study, institute_name, start_date, end_date, education_description
         FROM cv_education WHERE user_id = ?`,
        [accountId]
      ),
      queryPromise(
        `SELECT id, company_name, designation, start_date, end_date, description 
         FROM cv_work_experience WHERE user_id = ?`,
        [accountId]
      ),
      queryPromise(
        `SELECT id, title, institute_name, description, passing_year 
         FROM cv_certificateawards WHERE user_id = ?`,
        [accountId]
      ),
      queryPromise(
        `SELECT id, project_title, role, project_description, skills_used, project_link
         FROM cv_projects WHERE user_id = ?`,
        [accountId]
      ),
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
  createCandidateAvailabilityTable,
  createsaveJobsTableQuery,
  addAvailaibility,
  addCandidateInfo,
  getCandidateInfo,
  editCandidateInfo,
  getCandidateInfobyId,
  getCandidatepassport_photobyId,
  getCandidateFullProfilebyId,
  getCandidateInfobyAccountType,
};
