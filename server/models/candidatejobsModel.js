const connection = require("../connection");

// Toggle saved job (save or unsave)
const toggleSavedJob = ({ job_id, account_id }, callback) => {
  // Check if the job is already saved
  const checkQuery = "SELECT * FROM saved_jobs WHERE job_id = ? AND account_id = ?";
  
  connection.query(checkQuery, [job_id, account_id], (err, results) => {
    if (err) return callback(err);

    if (results.length > 0) {
      // If already saved, remove it (unsave)
      const deleteQuery = "DELETE FROM saved_jobs WHERE job_id = ? AND account_id = ?";
      connection.query(deleteQuery, [job_id, account_id], (err2) => {
        if (err2) return callback(err2);
        callback(null, { message: "Job unsaved successfully!", action: "unsaved" });
      });
    } else {
      // Otherwise, insert new saved job
      const insertQuery = "INSERT INTO saved_jobs (job_id, account_id) VALUES (?, ?)";
      connection.query(insertQuery, [job_id, account_id], (err2) => {
        if (err2) return callback(err2);
        callback(null, { message: "Job saved successfully!", action: "saved" });
      });
    }
  });
};

// Get all saved jobs for a user
const getSavedJobsByUser = ({ userId }, callback) => {
  const query = "SELECT * FROM saved_jobs WHERE account_id = ?";
  
  connection.query(query, [userId], (err, results) => {
    if (err) return callback(err);
    callback(null, results);
  });
};

// Get saved jobs count for a user
const getSavedJobsCount = ({ userId }, callback) => {
  const query = "SELECT COUNT(*) AS savedJobsCount FROM saved_jobs WHERE account_id = ?";
  
  connection.query(query, [userId], (err, results) => {
    if (err) return callback(err);
    callback(null, { count: results[0].savedJobsCount });
  });
};

// Get saved jobs with details (joined with job_posts and candidate_info)
const getSavedJobsWithDetails = ({ accountId }, callback) => {
  const query = `
    SELECT sj.*, jp.*, ci.logo
    FROM saved_jobs AS sj
    JOIN job_posts AS jp ON jp.id = sj.job_id
    JOIN candidate_info AS ci ON ci.account_id = jp.account_id
    WHERE sj.account_id = ?
  `;
  
  connection.query(query, [accountId], (err, results) => {
    if (err) return callback(err);

    // Convert logo to base64
    const resultsWithBase64Image = results.map((result) => {
      if (result.logo) {
        return { ...result, logo: Buffer.from(result.logo).toString("base64") };
      }
      return result;
    });

    callback(null, { jobDetails: resultsWithBase64Image });
  });
};

// Get available jobs (jobs not applied by the user)
const getAvailableJobs = ({ accountId }, callback) => {
  const query = `
    SELECT jp.*
    FROM job_posts AS jp
    JOIN account AS acc ON jp.account_id = acc.id
    LEFT JOIN applications AS app ON jp.id = app.job_id AND app.account_id = ?
    WHERE app.job_id IS NULL
    AND jp.status = 'Active'
  `;
  
  connection.query(query, [accountId], (err, results) => {
    if (err) return callback(err);

    // Convert Image to base64
    const resultsWithBase64Image = results.map((result) => {
      if (result.Image) {
        return { ...result, Image: Buffer.from(result.Image).toString("base64") };
      }
      return result;
    });

    callback(null, { jobDetails: resultsWithBase64Image });
  });
};

// Get user applications (job IDs)
const getUserApplications = ({ userId }, callback) => {
  const query = "SELECT job_id FROM applications WHERE account_id = ?";
  
  connection.query(query, [userId], (err, results) => {
    if (err) return callback(err);

    // Extract job IDs and send as an array
    const appliedJobs = results.map((row) => row.job_id);
    callback(null, appliedJobs);
  });
};


// Get new jobs (latest 3 active jobs)
const getNewJobs = (callback) => {
  const query = `
    SELECT job_title, current_date_time
    FROM job_posts
    WHERE status = 'Active'
      AND DATE(current_date_time)
    ORDER BY current_date_time DESC
    LIMIT 3
  `;
  
  connection.query(query, (err, results) => {
    if (err) return callback(err);
    callback(null, results);
  });
};

module.exports = {
  toggleSavedJob,
  getSavedJobsByUser,
  getSavedJobsCount,
  getSavedJobsWithDetails,
  getAvailableJobs,
  getUserApplications,
  getNewJobs,
};