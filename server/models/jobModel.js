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
  district_id INT,
  city_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  approval_status ENUM( 'Pending','Pending Payment','Approved','UnApproved') DEFAULT 'Pending',
  status ENUM('Active', 'InActive') DEFAULT 'Active',
  FOREIGN KEY (account_id) REFERENCES account(id),
  FOREIGN KEY (job_type_id) REFERENCES jobtypes(id), 
  FOREIGN KEY (speciality_id) REFERENCES speciality(id),
  FOREIGN KEY (degree_id) REFERENCES degreetypes(id),
  FOREIGN KEY (currency_id) REFERENCES currencies(id),
  FOREIGN KEY (package_id) REFERENCES packages(id),
  FOREIGN KEY (country_id) REFERENCES countries(id),
  FOREIGN KEY (district_id) REFERENCES districts(id),
  FOREIGN KEY (city_id) REFERENCES cities(id)

  );
`;

  // Execute the queries to create the tables
  connection.query(createjob_postsTableQuery, function (err, results, fields) {
    if (err) {
      return console.error(err.message);
    }
    console.log("job description  table created successfully");
  })
}

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
    jp.min_salary,
    jp.max_salary,
    ccy.code AS currency,
    jp.min_experience,
    jp.max_experience,
    spec.name AS speciality,
    deg.name AS degree,
    jp.no_of_positions,
    jp.industry,
   CONCAT(pkg.price, ' ', pkgccy.code) AS package_amount,
    co.name AS country,
    d.name AS district,
    ci.name AS city,
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
  LEFT JOIN currencies pkgccy ON pkg.currency = pkgccy.id  -- added
  LEFT JOIN speciality spec ON jp.speciality_id = spec.id
  LEFT JOIN degreetypes deg ON jp.degree_id = deg.id
  LEFT JOIN countries co ON jp.country_id = co.id
  LEFT JOIN districts d ON jp.district_id = d.id
  LEFT JOIN cities ci ON jp.city_id = ci.id
  WHERE jp.account_id = ?
  ORDER BY jp.created_at DESC
`;
  connection.query(jobPostsQuery, [userId], async (err, results) => {
    if (err) {
      console.error('Error fetching job posts:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    // Fetch skills for each job post
    const transformedResults = await Promise.all(results.map(async (job) => {
      let skillNames = [];
      
      if (job.skill_ids) {
        // Convert skill_ids to array if it's a string
        const skillIdsArray = typeof job.skill_ids === 'string' 
          ? job.skill_ids.split(',').map(id => parseInt(id.trim()))
          : job.skill_ids;

        if (skillIdsArray.length > 0) {
          // Query to get skill names
          const skillQuery = `SELECT name FROM skills WHERE id IN (?)`;
          
          try {
            const skillResults = await new Promise((resolve, reject) => {
              connection.query(skillQuery, [skillIdsArray], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
              });
            });
            
            skillNames = skillResults.map(row => row.name);
          } catch (error) {
            console.error('Error fetching skills for job', job.id, error);
          }
        }
      }

      return {
        ...job,
        skill_ids: typeof job.skill_ids === 'string' 
          ? job.skill_ids.split(',').map(id => parseInt(id.trim()))
          : job.skill_ids || [],
        skills: skillNames
      };
    }));

    res.status(200).json(transformedResults);
  });
};

const getJobbyRegAdmin = (req, res) => {
  const { page = 1, limit = 10, status, search, name } = req.query;
  const offset = (page - 1) * limit;

  let whereClause = "WHERE jp.approval_status !='Pending Payment'";
  let params = [];

  // Status filter
  if (status) {
    if (['Approved', 'Pending', 'UnApproved'].includes(status)) {
      whereClause += " AND jp.approval_status = ?";
    } else {
      whereClause += " AND jp.status = ?";
    }
    params.push(status);
  }

  // Generic filter: allow any field from frontend
  if (search && name) {
    let column;

    switch (name) {
      case "packageprice":
        column = "pkg.price";
        break;
      case "currency":
        column = "pkg.currency";
        break;
      case "duration_unit":
        column = "pkg.duration_unit";
        break;
      case "duration_value":
        column = "pkg.duration_value";
        break;
      case "status":
        column = "jp.status"; // ✅ fix ambiguous column
        break;
      default:
        column = name; // e.g., jp.job_title, a.username
    }

    // numeric check
   if (name === "packageprice") {
  const num = Number(search);
  
  if (!isNaN(num) && search.trim() !== '') {
    // Numeric search: search in both currency and price
    whereClause += ` AND (pkg_ccy.code LIKE ? OR pkg.price LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  } else {
    // Text search: prefix match on currency code (starts with)
    whereClause += ` AND pkg_ccy.code LIKE ?`;
    params.push(`${search}%`); // Only trailing wildcard
  }
}
else if (name === "duration_unit") {
     whereClause += ` AND pkg.duration_unit LIKE ?`;
     params.push(`${search}%`); // Prefix match
   }
   else if (name === "duration_value") {
     const num = Number(search);
     
     if (!isNaN(num) && search.trim() !== '') {
       // Search both duration value and unit
       whereClause += ` AND (pkg.duration_value LIKE ? OR pkg.duration_unit LIKE ?)`;
       params.push(`%${search}%`, `${search}%`);
     } else {
       // Search only duration unit with prefix match
       whereClause += ` AND pkg.duration_unit LIKE ?`;
       params.push(`${search}%`);
     }
   } else if (["jp.status", "jp.approval_status"].includes(column)) {
      // Prefix match for status fields (starts with, case-insensitive)
      whereClause += ` AND LOWER(${column}) LIKE LOWER(?)`;
      params.push(`${search}%`); // Only trailing wildcard
    } else {
      whereClause += ` AND ${column} LIKE ?`;
      params.push(`%${search}%`);
    }
  }


  const jobPostsQuery = `
    SELECT 
      jp.id As jobpost_id,
      jp.account_id,
      a.username,
      jp.job_title,
      jp.job_description,
      jp.skill_ids,
      GROUP_CONCAT(s.name) AS skills,
      jp.time_from,
      jp.time_to,
      jt.name AS job_type,
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
      pkg.duration_value,
      pkg.duration_unit,
      co.name AS country,
      d.name AS district,
      ci.name AS city,
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
    LEFT JOIN currencies pkg_ccy ON pkg.currency = pkg_ccy.id 
    LEFT JOIN speciality spec ON jp.speciality_id = spec.id
    LEFT JOIN degreetypes deg ON jp.degree_id = deg.id
    LEFT JOIN countries co ON jp.country_id = co.id
    LEFT JOIN districts d ON jp.district_id = d.id
    LEFT JOIN cities ci ON jp.city_id = ci.id
    LEFT JOIN skills s ON FIND_IN_SET(s.id, jp.skill_ids)
    ${whereClause}
    GROUP BY 
  jp.id,
  jp.account_id,
  a.username,
  jp.job_title,
  jp.job_description,
  jp.skill_ids,
  jp.time_from,
  jp.time_to,
  jt.name,
  jp.min_salary,
  jp.max_salary,
  ccy.code,
  jp.min_experience,
  jp.max_experience,
  spec.name,
  deg.name,
  jp.no_of_positions,
  jp.industry,
  pkg.price,
  pkg_ccy.code,
  pkg.duration_value,
  pkg.duration_unit,
  co.name,
  d.name,
  ci.name,
  jp.application_deadline,
  jp.created_at,
  jp.updated_at,
  jp.status,
  jp.approval_status
    ORDER BY jp.created_at DESC
    LIMIT ? OFFSET ?
  `;

  const queryParams = [...params, Number(limit), Number(offset)];

  connection.query(jobPostsQuery, queryParams, (err, results) => {
    if (err) {
      console.error("Error fetching job posts:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
 
    // Count total records
    const countQuery = `
      SELECT COUNT(DISTINCT jp.id) AS total
      FROM job_posts jp
      LEFT JOIN account a ON jp.account_id = a.id
      LEFT JOIN packages pkg ON jp.package_id = pkg.id
       LEFT JOIN currencies pkg_ccy ON pkg.currency = pkg_ccy.id
      ${whereClause}
    `;

    connection.query(countQuery, params, (countErr, countResult) => {
      if (countErr) {
        console.error("Count error:", countErr);
        return res.status(500).json({ error: "Count failed" });
      }

      res.status(200).json({
        data: results,
        totalRecords: countResult[0].total,
        currentPage: Number(page),
        totalPages: Math.ceil(countResult[0].total / limit),
      });
    });
  });
};


const updateJobPostStatus = (req, res) => {
  const { id, status } = req.params;

  if (!id || !status) {
    return res.status(400).json({
      error: "Job post ID and status are required",
    });
  }

  const normalizedStatus = status.trim();

  const isActiveStatus =
    normalizedStatus === "Active" || normalizedStatus === "InActive";

  const columnToUpdate = isActiveStatus ? "status" : "approval_status";

  // 1️⃣ Get previous value
  const selectSql = `
    SELECT ${columnToUpdate}
    FROM job_posts
    WHERE id = ?
  `;

  connection.query(selectSql, [id], (selectErr, rows) => {
    if (selectErr) {
      console.error("Error fetching job post:", selectErr);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    if (rows.length === 0) {
      return res.status(404).json({ error: "Job post not found" });
    }

    const previousValue = rows[0][columnToUpdate];

    // 2️⃣ Update job post
    const updateSql = `
      UPDATE job_posts
      SET ${columnToUpdate} = ?
      WHERE id = ?
    `;

    connection.query(updateSql, [normalizedStatus, id], (err, result) => {
      if (err) {
        console.error("Error updating job post status:", err);
        return res.status(500).json({ error: "Internal Server Error" });
      }

      // 3️⃣ Store history
       logAudit({
        tableName: "history",
        entityType: "job",
        entityId: result.insertId,
        action: "UPDATED",
        data: {
          previousValue,
          normalizedStatus
        },
        changedBy: userId,
      });

      res.status(200).json({
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
  const deleteJobQuery = 'DELETE FROM job_posts WHERE id = ? AND account_id = ?';

  // Finally, delete the job post
  connection.query(deleteJobQuery, [jobId, userId], (err, jobResult) => {
    if (err) {
      console.error('Error deleting job:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    if (jobResult.affectedRows === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    return res.status(200).json({ message: 'Job deleted successfully' });
  });
}

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
    min_experience,
    max_experience,
    speciality_id,
    degree_id,
    application_deadline,
    no_of_positions,
    industry,
    currency_id,
    country_id,
    city_id,
    district_id,
    package_id,
   
  } = req.body;
  const sql = `
      INSERT INTO job_posts (
        account_id, job_title, job_description, skill_ids, time_from, time_to,
          job_type_id, min_salary, max_salary, currency_id,
          min_experience, max_experience, speciality_id, degree_id,
          application_deadline, no_of_positions, industry, package_id, country_id,
           district_id, city_id,status,approval_status
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?)
    `;
  const params = [
    userId,
    job_title,
    job_description,
    JSON.stringify(skill_ids),  // store as JSON ["Ship Engineers","Commercial Pilots"]
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
    "Active",
    "Pending Payment",

  ];

  connection.query(sql, params, (error, result) => {
    if (error) {
      console.error("ERROR adding job post:", error);
      return res.status(500).json({ error: "database error " });
    } else {
      logAudit({
        tableName: "history",
        entityType: "job",
        entityId: result.insertId,
        action: "ADDED",
        data: {
          userId: userId,
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
          status: "Active",
          approval_status:'Pending Payment',

        },
        changedBy: userId,
      });

      return res.status(201).json({ message: "job post created successfully", job_id: result.insertId });
    }
  })

}

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
    min_experience,
    max_experience,
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
      updated_at = NOW()
    WHERE id = ? AND account_id = ?
  `;

  const params = [
    job_title,
    job_description,
    JSON.stringify(skill_ids), // store as JSON
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
    jobId,
    userId
  ];

  connection.query(sql, params, (error, result) => {
    if (error) {
      console.error("ERROR updating job post:", error);
      return res.status(500).json({ error: "database error" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Job not found or unauthorized" });
    }

    // ---- AUDIT LOG ----
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
        status: "Active"
      },
      changedBy: userId,
    });

    return res.status(200).json({
      message: "Job updated successfully",
      job_id: jobId
    });
  });
};


const subcribePackage = (req, res) => {
  const { packageId, jobId, userId } = req.body;
  connection.query(`UPDATE job_posts SET package_id = ? WHERE id = ? AND account_id = ?`, [packageId, jobId, userId], (error, result) => {
    if (error) {
      console.error("ERROR subscribing package:", error);
      return res.status(500).json({ error: "database error " });
    } else {
      logAudit({
        tableName: "history",
        entityType: "job",
        entityId: jobId,
        action: "UPDATED",
        data: { packageId: packageId },
        changedBy: userId,
      });
      return res.status(200).json({ message: "Subscribed Successfully" });
    }
  })
}

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

const popularCategory=(req,res)=>{
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
      if (err){
        console.log(err)
        return reject(err);
      }
      resolve(results);
    });
  });
};



module.exports = {
  createJobPostTable,
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
  getTotalJobPosts

}