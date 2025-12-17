const express = require("express");
const router = express.Router();
const connection = require("../connection");
const authMiddleware = require("../middleware/auth");


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
}

const createCandidateTable = () => {

  const createCandidateInfoTable = `
CREATE TABLE IF NOT EXISTS candidate_info (
  ID INT AUTO_INCREMENT PRIMARY KEY,
  account_id INT UNIQUE,
  logo LONGBLOB NULL,             
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
}

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
}

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

  connection.query(createCanPreferredCitiesTable, function (err, results, fields) {
    if (err) {
      return console.error(err.message);
    }
    console.log("Candidate Preferred Cities table created successfully");
  });
}

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
}




const addAvailaibility = (req, res) => {
  const availabilityData = req.body;
  const values = availabilityData.map(item => [
    item.accountId,
    item.day,
    item.shift,
    item.startTime,
    item.endTime
  ]);
  const sql = `
    INSERT INTO candidate_availability (accountId, day, shift, startTime, endTime) VALUES ?
    `;
  connection.query(sql, [values], (err, result) => {
    if (err) {
      console.error("Error inserting availability data:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true, message: "Availability data saved successfully" });
  });
}
const addCandidateInfo = async(req, res) => {
 try {
    const accountId = parseInt(req.body.account_id);

    const {
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
      speciality,
      preferredCities,
    } = req.body;

    // Parse arrays safely
    let specialityArr = [];
    let preferredCitiesArr = [];
    try {
      specialityArr = typeof speciality === "string" ? JSON.parse(speciality) : speciality || [];
      preferredCitiesArr = typeof preferredCities === "string" ? JSON.parse(preferredCities) : preferredCities || [];
    } catch (e) {
      console.warn("Error parsing arrays:", e);
    }

    const logoBuffer = req.file ? req.file.buffer : null;

    // --- Insert/Update candidate_info ---
    let sql = `
      INSERT INTO candidate_info 
        (account_id, phone, date_of_birth, gender, marital_status, total_experience, 
         license_type, license_number, address, country, district, city ${req.file ? ", logo" : ""})
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? ${req.file ? ", ?" : ""})
      ON DUPLICATE KEY UPDATE
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
        city = VALUES(city)
        ${req.file ? ", logo = VALUES(logo)" : ""}
    `;

    const params = [
      accountId,
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
    ];
    if (req.file) params.push(logoBuffer);

    // Promise wrapper for cleaner async flow
    const queryAsync = (sql, params) => {
      return new Promise((resolve, reject) => {
        connection.query(sql, params, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
    };

    const result = await queryAsync(sql, params);
    const candidateId = result.insertId || accountId;

    // --- Insert candidate_speciality ---
    if (Array.isArray(specialityArr) && specialityArr.length > 0) {
      const values = specialityArr.map(spId => [candidateId, spId]);
      await queryAsync(
        `INSERT IGNORE INTO candidate_speciality (candidate_id, speciality_id) VALUES ?`,
        [values]
      );
    }

    // --- Insert candidate_preferred_cities ---
    if (Array.isArray(preferredCitiesArr) && preferredCitiesArr.length > 0) {
      const values = preferredCitiesArr.map(cityId => [candidateId, cityId]);
      await queryAsync(
        `INSERT IGNORE INTO candidate_preferred_cities (candidate_id, city_id) VALUES ?`,
        [values]
      );
    }

    res.json({
      success: true,
      message: "Candidate saved/updated successfully",
      candidateId,
    });
  } catch (err) {
    console.error("Error saving candidate:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

const getCandidateInfo = (req, res) => {
  const accountId = req.user.userId;

  if (isNaN(accountId)) {
    return res.status(400).json({ error: "Invalid account_id" });
  }

  const sql = `
    SELECT 
      a.id,
      a.username as full_name,
      a.email,
      ci.Phone,
      ci.Current_Salary,
      ci.Expected_Salary,
      ci.Experience,
      ci.Age,
      ci.Education,
      ci.categories,
      ci.skills,
      ci.City as city,
      ci.Complete_Address as complete_address,
      ci.Description,
      ci.Links,
      ci.logo
    FROM account a
    LEFT JOIN candidate_info ci ON a.id = ci.account_id
    WHERE a.id = ?
  `;

  connection.query(sql, [accountId], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.length === 0) return res.status(404).json({ error: "Candidate not found" });

    const candidate = {
      ...result[0],
      logo: result[0].logo ? result[0].logo.toString("base64") : null
    };

    res.json(candidate);
  });
}

const editCandidateInfo = (req, res) => {
  const accountId = req.user.userId;

  if (isNaN(accountId)) {
    return res.status(400).json({ error: "Invalid account_id" });
  }

  try {
    // Build dynamic fields for account table
    const fields = [];
    const values = [];
    if (req.body.fullName !== undefined) {
      fields.push("username = ?");
      values.push(req.body.fullName);
    }
    if (req.body.email !== undefined) {
      fields.push("email = ?");
      values.push(req.body.email);
    }



    if (fields.length > 0) {
      const accountUpdateSql = `UPDATE account SET ${fields.join(", ")} WHERE id = ?`;
      values.push(accountId);
      connection.query(accountUpdateSql, values, (err, accountResult) => {
        if (err) {
          console.error("Account update error:", err);
          return res.status(500).json({ error: "Error updating account" });
        }
        updateCandidateInfo();
      });
    } else {
      updateCandidateInfo();
    }

    // --- Candidate Info Update ---
    function updateCandidateInfo() {
      // Build dynamic fields for candidate_info table
      const imageBuffer = req.file ? req.file.buffer : null;

      const infoFields = [];
      const infoValues = [];

      if (imageBuffer) {
        infoFields.push("logo = ?");
        infoValues.push(imageBuffer);
      }
      if (req.body.phone !== undefined) {
        infoFields.push("Phone = ?");
        infoValues.push(req.body.phone);
      }
      if (req.body.city !== undefined) {
        infoFields.push("City = ?");
        infoValues.push(req.body.city);
      }
      if (req.body.address !== undefined) {
        infoFields.push("Complete_Address = ?");
        infoValues.push(req.body.address);
      }
      if (req.body.currentSalary !== undefined) {
        infoFields.push("Current_Salary = ?");
        infoValues.push(req.body.currentSalary);
      }
      if (req.body.expectedSalary !== undefined) {
        infoFields.push("Expected_Salary = ?");
        infoValues.push(req.body.expectedSalary);
      }
      if (req.body.experience !== undefined) {
        infoFields.push("Experience = ?");
        infoValues.push(req.body.experience);
      }
      if (req.body.age !== undefined) {
        infoFields.push("Age = ?");
        infoValues.push(req.body.age);
      }
      if (req.body.education !== undefined) {
        infoFields.push("Education = ?");
        infoValues.push(req.body.education);
      }
      if (req.body.categories !== undefined) {
        let catStr = typeof req.body.categories === "string" ? req.body.categories : JSON.stringify(req.body.categories);
        infoFields.push("categories = ?");
        infoValues.push(catStr);
      }
      if (req.body.skills !== undefined) {
        let skillsStr = typeof req.body.skills === "string" ? req.body.skills : JSON.stringify(req.body.skills);
        infoFields.push("skills = ?");
        infoValues.push(skillsStr);
      }
      if (req.body.description !== undefined) {
        infoFields.push("Description = ?");
        infoValues.push(req.body.description);
      }
      if (req.body.links !== undefined) {
        let linksArr = Array.isArray(req.body.links) ? JSON.stringify(req.body.links) : req.body.links;
        infoFields.push("Links = ?");
        infoValues.push(linksArr);
      }

      if (infoFields.length === 0) {
        // Nothing to update
        return res.json({ message: "Account updated (no candidate_info fields provided)" });
      }

      // Check if candidate_info row exists
      const checkCandidateSql = `SELECT * FROM candidate_info WHERE account_id = ?`;
      connection.query(checkCandidateSql, [accountId], (checkErr, checkResult) => {
        if (checkErr) {
          console.error("Candidate info check error:", checkErr);
          return res.status(500).json({ error: "Error checking candidate_info" });
        }

        if (checkResult.length > 0) {
          // Row exists, perform UPDATE
          const updateSql = `UPDATE candidate_info SET ${infoFields.join(", ")} WHERE account_id = ?`;
          infoValues.push(accountId);
          connection.query(updateSql, infoValues, (updateErr, updateResult) => {
            if (updateErr) {
              console.error("Candidate update error:", updateErr);
              return res.status(500).json({ error: "Error updating candidate_info" });
            }
            return res.json({
              message: "Account and candidate_info updated",
              candidateUpdate: updateResult
            });
          });
        } else {
          // Row does not exist, perform INSERT
          const insertFields = ["account_id"];
          const insertValues = [accountId];
          const placeholders = ["?"];

          if (imageBuffer) {
            insertFields.push("logo");
            insertValues.push(imageBuffer);
            placeholders.push("?");
          }
          if (req.body.phone !== undefined) {
            insertFields.push("Phone");
            insertValues.push(req.body.phone);
            placeholders.push("?");
          }
          if (req.body.city !== undefined) {
            insertFields.push("City");
            insertValues.push(req.body.city);
            placeholders.push("?");
          }
          if (req.body.address !== undefined) {
            insertFields.push("Complete_Address");
            insertValues.push(req.body.address);
            placeholders.push("?");
          }
          if (req.body.currentSalary !== undefined) {
            insertFields.push("Current_Salary");
            insertValues.push(req.body.currentSalary);
            placeholders.push("?");
          }
          if (req.body.expectedSalary !== undefined) {
            insertFields.push("Expected_Salary");
            insertValues.push(req.body.expectedSalary);
            placeholders.push("?");
          }
          if (req.body.experience !== undefined) {
            insertFields.push("Experience");
            insertValues.push(req.body.experience);
            placeholders.push("?");
          }
          if (req.body.age !== undefined) {
            insertFields.push("Age");
            insertValues.push(req.body.age);
            placeholders.push("?");
          }
          if (req.body.education !== undefined) {
            insertFields.push("Education");
            insertValues.push(req.body.education);
            placeholders.push("?");
          }
          if (req.body.categories !== undefined) {
            let catStr = typeof req.body.categories === "string" ? req.body.categories : JSON.stringify(req.body.categories);
            insertFields.push("categories");
            insertValues.push(catStr);
            placeholders.push("?");
          }
          if (req.body.skills !== undefined) {
            let skillsStr = typeof req.body.skills === "string" ? req.body.skills : JSON.stringify(req.body.skills);
            insertFields.push("skills");
            insertValues.push(skillsStr);
            placeholders.push("?");
          }
          if (req.body.description !== undefined) {
            insertFields.push("Description");
            insertValues.push(req.body.description);
            placeholders.push("?");
          }
          if (req.body.links !== undefined) {
            let linksStr = typeof req.body.links === "string" ? req.body.skills : JSON.stringify(req.body.links);
            insertFields.push("Links");
            insertValues.push(linksStr);
            placeholders.push("?");
          }

          const insertSql = `INSERT INTO candidate_info (${insertFields.join(", ")}) VALUES (${placeholders.join(", ")})`;
          connection.query(insertSql, insertValues, (insertErr, insertResult) => {
            if (insertErr) {
              console.error("Candidate insert error:", insertErr);
              return res.status(500).json({ error: "Error inserting candidate_info" });
            }
            return res.json({
              message: "Account updated and candidate_info inserted",
              candidateInsert: insertResult[0]
            });
          });
        }
      });
    }
  } catch (error) {
    console.error("Unexpected error:", error.message);
    return res.status(400).json({ error: error.message });
  }
}

const getCandidateInfobyId = (req, res) => {
  const accountId = req.params.accountId;

  const sql =
    "SELECT * FROM candidate_info WHERE Account_ID = ?";

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
}

const getCandidateLogobyId = (req, res) => {
  const accountId = req.params.accountId;

  const sql = "SELECT  logo FROM candidate_info WHERE Account_ID = ?";

  connection.query(sql, [accountId], (err, results) => {
    if (err) {
      console.error("Error fetching data:", err);
      res
        .status(500)
        .json({ error: "Error fetching data", details: err.message });
    } else {


      // Convert the logo in base64
      const resultsWithBase64Logo = results.map((result) => {
        const base64Image = Buffer.from(result.logo).toString("base64");
        return { ...result, logo: base64Image };
      });

      // Send the response with base64 logos
      res.status(200).json({ jobDetails: resultsWithBase64Logo });
    }
  });
}
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
      projectsResults
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
      )
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
}

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
}
module.exports = {
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
  getCandidateLogobyId,
  getCandidateFullProfilebyId,
  getCandidateInfobyAccountType,
  
};