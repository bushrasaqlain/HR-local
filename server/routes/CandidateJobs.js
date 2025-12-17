const multer = require("multer");
const express = require("express");
const router = express.Router();
const connection = require("../connection");
const authMiddleware = require("../middleware/auth");

const storage = multer.memoryStorage();
const logo = multer({ storage: storage });

router.post("/savedjobs", async (req, res) => {
  try {
    const { job_id, account_id } = req.body;

    // Check if the job is already saved
    const [existingSavedJob] = await connection.promise().query(
      "SELECT * FROM saved_jobs WHERE job_id = ? AND account_id = ?",
      [job_id, account_id]
    );

    if (existingSavedJob.length > 0) {
      // If already saved, remove it (unsave)
      await connection.promise().query(
        "DELETE FROM saved_jobs WHERE job_id = ? AND account_id = ?",
        [job_id, account_id]
      );

      return res.status(200).json({ message: "Job unsaved successfully!" });
    }

    // Otherwise, insert new saved job
    await connection.promise().query(
      "INSERT INTO saved_jobs (job_id, account_id) VALUES (?, ?)",
      [job_id, account_id]
    );

    res.status(201).json({ message: "Job saved successfully!" });
  } catch (error) {
    console.error("Error saving job:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});
router.get("/checkingsavedjobs/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    const [savedJobs] = await connection.promise().query(
      "SELECT * FROM saved_jobs WHERE account_id = ?",
      [userId]
    );

    res.status(200).json(savedJobs);
  } catch (error) {
    console.error("Error fetching saved jobs:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// count the number of saved jobs for a user
router.get("/savedjobscount/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    const [result] = await connection
      .promise()
      .query(
        "SELECT COUNT(*) AS savedJobsCount FROM saved_jobs WHERE account_id = ?",
        [userId]
      );

    res.status(200).json({ count: result[0].savedJobsCount });
  } catch (error) {
    console.error("Error fetching saved jobs count:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get("/getsavedjobs/",authMiddleware , (req, res) => {
  const accountId = req.user.userId;

  const getsavedjobsquery = `
    SELECT sj.*, jp.*, ci.logo
    FROM saved_jobs AS sj
    JOIN job_posts AS jp ON jp.id = sj.job_id
    JOIN candidate_info AS ci ON ci.account_id = jp.account_id
    WHERE sj.account_id = ?;
`;
  connection.query(getsavedjobsquery, [accountId], (err, results) => {
    if (err) {
      console.error("Error fetching data:", err);
      return res.status(500).json({ error: "Error fetching data", details: err.message });
    }

    

    // Convert the Image (if exists) to base64
    const resultsWithBase64Image = results.map((result) => {
      if (result.logo) {
        return { ...result, logo: Buffer.from(result.logo).toString("base64") };
      }
      return result;
    });

    // Send the response with base64 images
    res.status(200).json({ jobDetails: resultsWithBase64Image });
  });
});


router.get("/availablejobs/", authMiddleware ,(req, res) => {
  const accountId = req.user.accountId; // Get the logged-in user's account ID

  const jobPostsQuery = `
    SELECT jp.*
    FROM job_posts AS jp
    JOIN account AS acc ON jp.account_id = acc.id
    LEFT JOIN applications AS app ON jp.id = app.job_id AND app.account_id = ?
    WHERE app.job_id IS NULL
    AND jp.status = 'Active';
  `;

  connection.query(jobPostsQuery, [accountId], (err, results) => {
    if (err) {
      console.error("Error fetching data:", err);
      return res.status(500).json({ error: "Error fetching data", details: err.message });
    }

    

    // Convert the Image (if exists) to base64
    const resultsWithBase64Image = results.map((result) => {
      if (result.Image) {
        return { ...result, Image: Buffer.from(result.Image).toString("base64") };
      }
      return result;
    });

    // Send the response with base64 images
    res.status(200).json({ jobDetails: resultsWithBase64Image });
  });
});

router.get("/user-applications/:userId", (req, res) => {
  const userId = req.params.userId;

  const query = `
    SELECT job_id FROM applications WHERE account_id = ?
  `;

  connection.query(query, [userId], (err, results) => {
    if (err) {
      console.error("Error fetching applications:", err);
      return res.status(500).json({ error: "Error fetching applications" });
    }

    // Extract job IDs and send as an array
    const appliedJobs = results.map((row) => row.job_id);
    res.status(200).json(appliedJobs);
  });
});

router.get("/NewJobs", (req, res) => {
  const sql = `
    SELECT job_title, current_date_time
    FROM job_posts
    WHERE status = 'Active'
      AND DATE(current_date_time)
    ORDER BY current_date_time DESC
    LIMIT 3
  `;

  connection.query(sql, (error, results) => {
    if (error) {
      console.error("Error fetching new jobs:", error);
      return res.status(500).json({ error: "An error occurred while fetching new jobs." });
    }

    res.status(200).json(results);
  });
});

module.exports = router;