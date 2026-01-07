const express = require("express");
const router = express.Router();
const connection = require("../connection");
const authMiddleware = require("../middleware/auth");
const logAudit = require("../utils/auditLogger");
const checkRole = require("../middleware/checkRole");
// Table creation SQL

router.post('/', authMiddleware, (req, res) => {
  const accountId = req.user.userId;
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
    profession_id,
    degree_id,
    application_deadline,
    no_of_positions,
    industry,
    currency_id,
    country_id,
    city_id,
    district_id,
    package_id,
    bankName,
    cardType,
    cardholder,
    cardNumber,
    expiry,
    cvv
  } = req.body;

  const sql = `
    INSERT INTO job_posts (
      account_id, job_title, job_description, skill_ids, time_from, time_to,
        job_type_id, min_salary, max_salary, currency_id,
        min_experience, max_experience, profession_id, degree_id,
        application_deadline, no_of_positions, industry, package_id, country_id, district_id, city_id
    ) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const params = [
    accountId,
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
    profession_id,
    degree_id,
    application_deadline,
    no_of_positions,
    industry,
    package_id,
    country_id,
    district_id,
    city_id
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
          account_id: accountId,
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
          profession_id,
          degree_id,
          application_deadline,
          no_of_positions,
          industry,
          package_id,
          country_id,
          district_id,
          city_id
        },
        changedBy: accountId,
      });

      const cardSql = `
        INSERT INTO card (
          account_id, bankName, cardType, cardholder, cardNumber, expiry, cvv
        )
        VALUES(?, ?, ?,?, ?, ?, ?)
      `;
      const cartParams = [
        accountId,
        bankName,
        cardType,
        cardholder,
        cardNumber,
        expiry,
        cvv
      ];

      connection.query(cardSql, cartParams, (err, results) => {
        if (error) {
          console.error("ERROR adding cart data:", error);
          return res.status(500).json({ error: "database error " });
        } else {
          logAudit({
            tableName: "history",
            entityType: "cart",
            entityId: results.insertId,
            action: "ADDED",
            data: {
              account_id: accountId,
              bankName,
              cardType,
              cardholder,
              cardNumber,
              expiry,
              cvv
            },
            changedBy: accountId,
          });
        }
      })

      return res.status(201).json({ message: "job post created successfully", job_id: result.insertId });
    }
  })

})

router.put('/updatepackageforjob', authMiddleware, (req, res) => {
 
})

// Get ALL job posts + account info for each post
router.get("/getalljobs", authMiddleware, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 15;
  const offset = (page - 1) * limit;
  const search = req.query.search || "";
  const status = req.query.status || "";

  // Map client-provided column names -> actual DB columns
  const columnMap = {
    job_title: "jp.job_title",
    job_type: "jt.name",
    company_name: "ci.company_name",
    industry: "jp.industry",
    created_at: "jp.created_at", // choose one table explicitly
    status: "jp.status"
  };

  const searchColumn = columnMap[req.query.name] || "jp.job_title"; // fallback

  const query = `
    SELECT
  jp.*,
  pkg.price AS pkg_price,
  pkg.duration_unit AS pkg_duration_unit,
  pkg.duration_value AS pkg_duration_value,
  pkg.currency AS pkg_currency,
  a.username,
  a.email,
  ci.phone,
  ci.company_name,
  cntry.name AS country_name,
  d.name AS district_name,
  city.name AS city_name,
  jt.name AS jobtype_name,
  dt.name AS degree_name,
  c.code AS currency_name,
  p.name AS profession_name,
  GROUP_CONCAT(s.name) AS skill_names
FROM job_posts jp
JOIN packages pkg ON jp.package_id = pkg.id
JOIN account a ON jp.account_id = a.id
JOIN company_info ci ON jp.account_id = ci.account_id
JOIN countries cntry ON jp.country_id = cntry.id
JOIN districts d ON jp.district_id = d.id
JOIN cities city ON jp.city_id = city.id
JOIN jobtypes jt ON jp.job_type_id = jt.id
JOIN currencies c ON jp.currency_id = c.id
JOIN degreetypes dt ON jp.degree_id = dt.id
JOIN professions p ON jp.profession_id = p.id
JOIN JSON_TABLE(jp.skill_ids, '$[*]' COLUMNS(skill_id INT PATH '$')) jskills
  ON TRUE
JOIN skills s ON s.id = jskills.skill_id
WHERE 1=1
  ${status ? "AND jp.status = ?" : ""}
  AND ${searchColumn} LIKE ?
GROUP BY jp.id
ORDER BY jp.id DESC
LIMIT ? OFFSET ?;

  `;

  const queryParams = [];
  if (status) queryParams.push(status);
  queryParams.push(`%${search}%`, limit, offset);

  connection.query(query, queryParams, (err, results) => {
    if (err) {
      console.error("❌ Error fetching jobs:", err.sqlMessage);
      return res.status(500).json({ error: "Database error" });
    }

    // Count query
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM job_posts jp
      JOIN account a ON jp.account_id = a.id
      JOIN company_info ci ON jp.account_id = ci.account_id
      JOIN jobtypes jt ON jp.job_type_id = jt.id
        ${status ? "AND jp.status = ?" : ""}
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
        jobs: results,
      });
    });
  });
});

router.put("/changeJobStatus", authMiddleware, (req, res) => {
  const { jobId, status } = req.body;
  const userId = req.user.userId;

  if (!jobId || !status) {
    return res.status(400).json({ error: "jobId & status are required" });
  }
  connection.query("SELECT job_title from job_posts WHERE id = ?", jobId, (err, result) => {
    if (err) return res.status(500).json({ error: "Database error" });

    const updateSql = "UPDATE job_posts SET status = ? WHERE id = ?";
    connection.query(updateSql, [status, jobId], (err) => {
      if (err) return res.status(500).json({ error: "Database error" });

      logAudit({
        tableName: "history",
        entityType: "job",
        entityId: jobId,
        action: status.toUpperCase(),
        data: { status: status, job_title: result[0].job_title },
        changedBy: userId,
      });

      res
        .status(200)
        .json({ message: `${status} Successfully` });
    });
  })
});



function updateJobStatusForDeadline() {
 
  const currentDate = new Date();

  const updateQuery = `
    UPDATE job_posts
    SET status = 'Inactive'
    WHERE application_deadline <= ? AND  status <> 'Inactive';
  `;

  connection.query(updateQuery, [currentDate], (error, updateResults) => {
    if (error) {
      console.error('Error updating job status:', error);
    } 
 
  });
}




function updateStatus() {
  const currentDate = new Date();
  const updateQuery = `
  UPDATE job_posts
  SET status = 'Inactive'
  WHERE application_deadline <= ? AND  status <> 'Inactive';
  `;

  connection.query(updateQuery, [currentDate], (error, updateResults) => {
    if (error) {
      console.error('Error updating status:', error);
    } 
    // else {
   // }
  });
}
// Run the updateStatus function periodically
setInterval(updateStatus, 60000); // Check every minute


// const interval = setInterval(() => {
//   try {
//     updateJobStatusForDeadline();
//   } catch (error) {
//     console.error('Error occurred during job status update:', error);
//   }
// }, 60 * 60 * 1000); // Run every 60 minutes

function checkPackageLimit(accountId, isUpdate, callback) {
  // Check if the operation is an update and if so, skip the package limit check
  if (isUpdate) {
    return callback(null);
  }

  // Check if the user has an active package
  const queryActivePackage = `
      SELECT
          c.id AS package_id,
          MAX(p.Jobs) AS total_jobs_limit,
          COUNT(jp.id) AS posted_jobs_count
      FROM
          cart c
      LEFT JOIN
          packages p ON c.package_type = p.package_type
      LEFT JOIN
          job_posts jp ON c.id = jp.Pkg_id AND jp.account_id = ?
      WHERE
          c.account_id = ? AND c.status = 'active'
      GROUP BY
          c.id;
  `;

  connection.query(queryActivePackage, [accountId, accountId], (err, result) => {
    if (err) {
      console.error(err);
      return callback({ error: "Internal Server Error" });
    }

      if (result.length === 0) {
          // User does not have an active package, return an error
          return callback({ error: "Before posting a job, subscribe to a package please." });
      }

    const packageInfo = result[0];
    const totalPackageJobs = packageInfo.total_jobs_limit || 0;
    const postedJobsCount = packageInfo.posted_jobs_count || 0;

    // Check if the user has reached the limit for posting new jobs
    if (postedJobsCount >= totalPackageJobs) {
      return callback({ error: "You cannot post new jobs. Reached the limit for this package." });
    }

    callback(null);
  });
}

// function checkPackageLimit(accountId, callback) {
//   // Check if the user has an active package
//   const queryActivePackage = `
//   SELECT
//   c.id AS package_id,
//   MAX(p.Jobs) AS total_jobs_limit,
//   COUNT(jp.id) AS posted_jobs_count
// FROM
//   cart c
// LEFT JOIN
//   packages p ON c.package_type = p.package_type
// LEFT JOIN
//   job_posts jp ON c.id = jp.Pkg_id AND jp.account_id = ?
// WHERE
//   c.account_id = ? AND c.status = 'active'
// GROUP BY
//   c.id;
//   `;


//   connection.query(queryActivePackage, [accountId, accountId], (err, result) => {
//     if (err) {
//       console.error(err);
//       return callback({ error: "Internal Server Error" });
//     }

//     if (result.length === 0) {
//       // User does not have an active package, return an error
//       return callback({ error: "Before posting a job, subscribe to a package." });
//     }

//     const packageInfo = result[0];
//     const totalPackageJobs = packageInfo.total_jobs_limit || 0;
//     const postedJobsCount = packageInfo.posted_jobs_count || 0;

//       // Check if the operation is an update and if the package still has available job postings
//     // if (jobId && postedJobsCount < totalPackageJobs) {
//     //   return callback(null); // No error, proceed with the update
//     // }

//     // Check if the user has reached the limit for posting new jobs
//     if (postedJobsCount >= totalPackageJobs) {
//       return callback({ error: "You cannot post new jobs. Reached the limit for this package." });
//     }

//     // User has an active package, proceed with checking job limits
//     const queryJobPosts = `
//       SELECT
//         COUNT(id) AS posted_jobs_count
//       FROM
//         job_posts
//       WHERE
//         account_id = ? AND status = 'Active';
//     `;

//     const queryPackageJobs = `
//       SELECT 
//         c.account_id,
//         SUM(CASE WHEN p.package_type IN ('basic', 'standard', 'extended') THEN CAST(p.Jobs AS SIGNED) ELSE 0 END) AS total_jobs
//       FROM 
//         cart c
//       JOIN 
//         packages p ON c.package_type = p.package_type
//       WHERE 
//         c.account_id = ?
//         AND c.is_checkout = true
//       GROUP BY 
//         c.account_id;
//     `;

//     connection.query(queryJobPosts, [accountId], (errJobPosts, resultJobPosts) => {
//       if (errJobPosts) {
//         console.error(errJobPosts);
//         return callback({ error: "Internal Server Error" });
//       }

//       const postedJobsCount = resultJobPosts[0] ? resultJobPosts[0].posted_jobs_count : 0;

//       connection.query(queryPackageJobs, [accountId], (errPackageJobs, resultPackageJobs) => {
//         if (errPackageJobs) {
//           console.error(errPackageJobs);
//           return callback({ error: "Internal Server Error" });
//         }

//         const totalPackageJobs = resultPackageJobs[0] ? resultPackageJobs[0].total_jobs : 0;

//         if (postedJobsCount >= totalPackageJobs) {
//           return callback({ error: "You cannot post new jobs. Reached the limit for this package." });
//         }

//         callback(null);
//       });
//     });
//   });
// }




// Define API routes
// router.post("/", (req, res) => {
//   const accountId = parseInt(req.body.account_id);
//   const jobId = req.body.jobId;
//   const isUpdate = !!jobId;
//    // Check the package limit before proceeding with job posting
//    checkPackageLimit(accountId, isUpdate, (error) => {
//     if (error) {
//         // Handle the error message and send it to the client
//         return res.status(400).json({ error: error.error });
//     }
//   const {
//     job_title,
//     job_description,
//     email,
//     company_id,
//     specialisms,
//     job_type,
//     min_salary,
//     max_salary,
//     career,
//     experience,
//     degreetypes,
//     degreefields,
//     gender,
//     industry,
//     application_deadline,
//     city,
//     countries,
//     address,
//   } = req.body;



//   // Validate if accountId is a valid number
//   if (isNaN(accountId)) {
//     return res.status(400).json({ error: "Invalid account_id" });
//   }

//   const department = Array.isArray(specialisms.value) ? specialisms.value.join(', ') : '';
//   // Check if jobId is present in the request (indicating an update)

//   let sql;
//   let values;

//   if (jobId) {
//     // Update an existing job
//     sql = `
//       UPDATE job_posts
//       SET
//         job_title = ?,
//         job_description = ?,
//         email = ?,
//         username = ?,
//         specialisms = ?,
//         job_type = ?,
//         min_salary = ?,
//         max_salary=?,
//         career = ?,
//         experience = ?,
//         gender = ?,
//         industry = ?,
//         qualification = ?,
//         application_deadline = ?,
//         city = ?,
//         address = ?,
//         current_date_time = CURRENT_TIMESTAMP,
//         status = IF(application_deadline >= CURRENT_DATE, 'Active', 'Inactive')
//       WHERE id = ? AND account_id = ?;
//     `;

//     values = [
//       job_title,
//       job_description,
//       email,
//       company_id,
//       department,
//       job_type,
//       min_salary,
//       max_salary,
//       career,
//       experience,
//       gender,
//       industry,
//       qualification,
//       application_deadline,
//       city.value,
//       countries.value,
//       address,
//       jobId,
//       accountId,
//     ];
//   }  else {


// // // Insert a new job
// // Insert a new job
// sql = `
// INSERT INTO job_posts (
//   account_id, job_title, job_description, email, company_id, specialisms,
//   job_type, min_salary, max_salary, career, experience, gender, industry,
//   application_deadline, city, country, address, status, Pkg_id, Package_type, Package_status
// )
// SELECT 
//   ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
//   CASE WHEN ? >= CURRENT_DATE THEN 'Active' ELSE 'Inactive' END,
//   c.id, c.package_type, c.status
// FROM cart c
// WHERE (c.account_id = ? OR (c.is_checkout = true AND c.status = 'active'))
// ORDER BY c.Active_at DESC 
// LIMIT 1
// ON DUPLICATE KEY UPDATE 
//   job_title = VALUES(job_title),
//   job_description = VALUES(job_description),
//   email = VALUES(email),
//   company_id = VALUES(company_id),
//   specialisms = VALUES(specialisms),
//   job_type = VALUES(job_type),
//   min_salary = VALUES(min_salary),
//   max_salary = VALUES(max_salary),
//   career = VALUES(career),
//   experience = VALUES(experience),
//   gender = VALUES(gender),
//   industry = VALUES(industry),
//   application_deadline = VALUES(application_deadline),
//   city = VALUES(city),
//   country = VALUES(country),
//   address = VALUES(address),
//   status = CASE WHEN VALUES(application_deadline) >= CURRENT_DATE THEN 'Active' ELSE 'Inactive' END,
//   Pkg_id = VALUES(Pkg_id),
//   Package_type = VALUES(Package_type),
//   Package_status = VALUES(Package_status);

// `;

// values = [
//   accountId, job_title, job_description, email, company_id, job_type,
//   min_salary,max_salary, career, experience, gender, industry,application_deadline,
//   city.value,countries.value, application_deadline, accountId
// ];

//   }
//     connection.query(sql, values, (err, data) => {
//       if (err) {
//         console.error(err);
//         return res.status(500).json({ error: "Internal Server Error" });
//       }
//       // After inserting or updating a job, call the stored procedure to update status
//       connection.query("CALL updateJobStatusForDeadline()", (err) => {
//         if (err) {
//           console.error(err.message);
//         }
//       });
//       return res.json(data);
//   });
// });
// });



router.get("/allJobPostsWithAccount", (req, res) => {
  const sql = `
    SELECT
      jp.*,
      a.username,
      a.email,
      ci.phone,
      ci.company_name,
      cntry.name AS country_name,
      d.name AS district_name,
      city.name AS city_name
    FROM job_posts jp
    JOIN account a ON jp.account_id = a.id
    JOIN company_info ci ON jp.account_id = ci.account_id
    JOIN countries cntry ON jp.country_id = cntry.id
    JOIN districts d ON jp.district_id = d.id
    JOIN cities city ON jp.city_id = city.id
    ORDER BY jp.id DESC
  `;

  connection.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
    return res.json(results);
  });
});


// Get a single job post + its account info
router.get("/jobWithAccount/:jobPostId", (req, res) => {
  const postId = parseInt(req.params.jobPostId);

  if (isNaN(postId)) {
    return res.status(400).json({ error: "Invalid jobPostId" });
  }

  // join job_posts with the account table using the account_id from the post
  const sql = `
    SELECT 
      jp.*,
      a.name AS account_username,
      a.email AS account_email,
      a.phone AS account_phone,
      a.full_name AS account_company,
      a.Image As image
    FROM job_posts jp
    JOIN account a ON jp.account_id = a.id
    WHERE jp.id = ?
  `;

  connection.query(sql, [postId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Job post not found" });
    }

    // return a single object instead of an array
    return res.json(results[0]);
  });
});

router.get("/popularcategories/:limit?", (req, res) => {
  // optional limit param (default 10)
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
});

router.get("/topCompanies/:limit?", (req, res) => {
  // optional limit param (default 10)
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
});


module.exports = router;

