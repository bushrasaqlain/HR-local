const candidatejobsModel = require("../models/candidatejobsModel");

// Toggle saved job (save/unsave)
const toggleSavedJob = (req, res) => {
  const { job_id, account_id } = req.body;

  candidatejobsModel.toggleSavedJob({ job_id, account_id }, (err, result) => {
    if (err) {
      console.error("Error saving/unsaving job:", err);
      return res.status(500).json({ message: "Internal Server Error" });
    }

    const statusCode = result.action === "saved" ? 201 : 200;
    res.status(statusCode).json(result);
  });
};

// Get saved jobs by user
const getSavedJobsByUser = (req, res) => {
  const { userId } = req.params;

  candidatejobsModel.getSavedJobsByUser({ userId }, (err, results) => {
    if (err) {
      console.error("Error fetching saved jobs:", err);
      return res.status(500).json({ message: "Internal Server Error" });
    }

    res.status(200).json(results);
  });
};

// Get saved jobs count
const getSavedJobsCount = (req, res) => {
  const { userId } = req.params;

  candidatejobsModel.getSavedJobsCount({ userId }, (err, result) => {
    if (err) {
      console.error("Error fetching saved jobs count:", err);
      return res.status(500).json({ message: "Internal Server Error" });
    }

    res.status(200).json(result);
  });
};

// Get saved jobs with details
const getSavedJobsWithDetails = (req, res) => {
  const accountId = req.user.userId;

  candidatejobsModel.getSavedJobsWithDetails({ accountId }, (err, result) => {
    if (err) {
      console.error("Error fetching saved jobs with details:", err);
      return res.status(500).json({ 
        error: "Error fetching data", 
        details: err.message 
      });
    }

    res.status(200).json(result);
  });
};

// Get available jobs
const getAvailableJobs = (req, res) => {
  const accountId = req.user.accountId;

  candidatejobsModel.getAvailableJobs({ accountId }, (err, result) => {
    if (err) {
      console.error("Error fetching available jobs:", err);
      return res.status(500).json({ 
        error: "Error fetching data", 
        details: err.message 
      });
    }

    res.status(200).json(result);
  });
};

// Get user applications
const getUserApplications = (req, res) => {
  const { userId } = req.params;

  candidatejobsModel.getUserApplications({ userId }, (err, appliedJobs) => {
    if (err) {
      console.error("Error fetching applications:", err);
      return res.status(500).json({ error: "Error fetching applications" });
    }

    res.status(200).json({ jobDetails: appliedJobs });

  });
};


// Get new jobs
const getNewJobs = (req, res) => {
  candidatejobsModel.getNewJobs((err, results) => {
    if (err) {
      console.error("Error fetching new jobs:", err);
      return res.status(500).json({ 
        error: "An error occurred while fetching new jobs." 
      });
    }

    res.status(200).json(results);
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




