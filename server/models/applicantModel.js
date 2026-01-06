
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
    Account_ID INT,
    status VARCHAR(50) DEFAULT 'applied',
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
      account.username AS candidate_name,
      account.id AS candidate_id,
      job_posts.job_title AS job_title,
      candidate_info.skills,
      candidate_info.address AS Complete_Address
    FROM applications
    INNER JOIN account ON applications.Account_ID = account.id
    INNER JOIN job_posts ON applications.job_id = job_posts.id
    LEFT JOIN candidate_info ON applications.Account_ID = candidate_info.Account_ID
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


const updateShortListedbyId = (req, res) => {
    try {
        const { applicationId } = req.params; // Get the application ID from the request parameters

        // Update the status of the application to 'shortlisted' in the database
        const updateQuery = `
      UPDATE applications
      SET status = 'shortlisted'
      WHERE id = ?;
    `;
        connection.query(updateQuery, [applicationId]);

        // Send a success response
        res
            .status(200)
            .json({
                message: 'Application status updated to "shortlisted" successfully',
            });
    } catch (error) {
        console.error("Error updating application status:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }

}

const updateApproveApplicant = (req, res) => {
    try {
        const { applicationId } = req.params; // Get the application ID from the request parameters

        // Update the status of the application to 'Rejected' in the database
        const updateQuery = `
      UPDATE applications
      SET status = 'Approve'
      WHERE id = ?;
    `;
        connection.query(updateQuery, [applicationId], (error, results) => {
            if (error) {
                console.error("Error updating application status:", error);
                res.status(500).json({ error: "Internal Server Error" });
            } else {
                // Send a success response
                res
                    .status(200)
                    .json({
                        message: 'Application status updated to "Approve" successfully',
                    });
            }
        });
    } catch (error) {
        console.error("Error updating application status:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

const updateRejectedApplicants=(req,res)=>{
    try {
    const { applicationId } = req.params; // Get the application ID from the request parameters

    // Update the status of the application to 'Rejected' in the database
    const updateQuery = `
      UPDATE applications
      SET status = 'Rejected'
      WHERE id = ?;
    `;
    connection.query(updateQuery, [applicationId], (error, results) => {
      if (error) {
        console.error("Error updating application status:", error);
        res.status(500).json({ error: "Internal Server Error" });
      } else {
        // Send a success response
        res
          .status(200)
          .json({
            message: 'Application status updated to "Rejected" successfully',
          });
      }
    });
  } catch (error) {
    console.error("Error updating application status:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}




module.exports = {
    createApplicantsTable,
    getAllApplicants,
    updateShortListedbyId,
    updateApproveApplicant,
    updateRejectedApplicants
    
}