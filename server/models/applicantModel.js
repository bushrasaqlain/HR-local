
const express = require("express");
const router = express.Router();
const connection = require("../connection");

const createApplicantsTable = () => {
  const applicantsTable = `
    CREATE TABLE IF NOT EXISTS applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_id INT,
    message TEXT NOT NULL,
    cv_data LONGBLOB NOT NULL,
    cv_filename VARCHAR(255) NOT NULL,
    account_id INT,
    status VARCHAR(50) DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES job_posts(id),
    FOREIGN KEY (Account_ID) REFERENCES account(id)
);`;

  // Execute the query to create the table
  connection.query(applicantsTable, function (err, results, fields) {
    if (err) {
      return console.error(err.message);
    }
    console.log("applications table created successfully");
  });
}
const getAllApplicants = (req, res) => {
  const employer_id = req.params.userId;
  const status = req.params.status;

  let applicantsQuery = `
    SELECT 
      applications.id AS application_id,
      applications.status AS candidateStatus,
      account.username AS candidate_name,
      account.id AS candidate_id,
      job_posts.job_title AS job_title,
      ctry.name AS country_name, 
      d.name AS district_name, 
      city.name AS city_name,
      candidate_info.phone,
      candidate_info.date_of_birth,
      candidate_info.gender,
      candidate_info.marital_status,
      candidate_info.license_type,
      candidate_info.license_number,
      candidate_info.total_experience AS total_experience,
      candidate_info.address AS Complete_Address
    FROM applications
    INNER JOIN account ON applications.account_id = account.id
    LEFT JOIN candidate_info ON applications.account_id = candidate_info.account_id
    INNER JOIN job_posts ON applications.job_id = job_posts.id
    LEFT JOIN countries ctry ON candidate_info.country = ctry.id
    LEFT JOIN districts d ON candidate_info.district= d.id
    LEFT JOIN cities city ON candidate_info.city= city.id
    
    WHERE job_posts.account_id = ?
  `;

  const queryParams = [employer_id];

  // 👉 Apply status filter ONLY if not "all"
  if (status !== "all") {
    applicantsQuery += ` AND applications.status = ?`;
    queryParams.push(status);
  }

  connection.query(applicantsQuery, queryParams, (err, applicantsResults) => {
    if (err) {
      console.error("Error fetching applicants:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    // Convert image to base64 (safe check)
    applicantsResults.forEach((applicant) => {
      if (applicant.candidate_image) {
        applicant.candidate_image = Buffer.from(
          applicant.candidate_image,
          "binary"
        ).toString("base64");
      }
    });

    res.status(200).json(applicantsResults);
  });
};


const updateApplcantStatus = (req, res) => {
  try {
    const { applicationId, status } = req.params; // Get the application ID from the request parameters

    // Update the status of the application to 'shortlisted' in the database
    const updateQuery = `
      UPDATE applications
      SET status = ?
      WHERE id = ?;
    `;
    connection.query(updateQuery, [status, applicationId]);

    // Send a success response
    res
      .status(200)
      .json({
        message: `Application status updated to ${status} successfully`,
      });
  } catch (error) {
    console.error("Error updating application status:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }

}

module.exports = {
  createApplicantsTable,
  getAllApplicants,
  updateApplcantStatus,

}