const express = require("express");
const router = express.Router();
const connection = require("../connection");
const multer = require("multer");

// Set up multer storage
const storage = multer.memoryStorage(); // Use memory storage for handling base64
const logo = multer({ storage: storage });
// API endpoint to count the total number of job applications for a specific job
router.get("/jobscount/:jobId", (req, res) => {
  const jobId = req.params.jobId;

  const sql = `SELECT COUNT(*) AS totalApplications FROM applications WHERE job_id = ?`;

  connection.query(sql, jobId, (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ totalApplications: result[0].totalApplications });
    }
  });
});
//////////////////update the applicatns status to shortlisted////
router.put("/ShortListedApplicants/:applicationId", async (req, res) => {
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
});
///////////////update the applicatns status to rejected//////////
router.put("/RejectedApplicatns/:applicationId", async (req, res) => {
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
});
router.put("/ApprovedApplicatns/:applicationId", async (req, res) => {
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
});
router.delete("/deleteApplicant/:applicationId", (req, res) => {
  const applicationId = req.params.applicationId;

  const deleteQuery = `
    DELETE FROM applications
    WHERE id = ?;
  `;

  connection.query(deleteQuery, [applicationId], (err, results) => {
    if (err) {
      console.error("Error deleting applicant:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    } else {
      res.status(200).json({ message: "Applicant deleted successfully" });
    }
  });
});

//******************************Manage job api***************************************** */
// router.get('/managejob/:userId', (req, res) => { // Define ':userId' as a route parameter
//   const userId = req.params.userId;

//   // Fetch job posts for the given userId
//   const jobPostsQuery = `
//     SELECT id, account_id, job_title, city, application_deadline
//     FROM job_posts
//     WHERE account_id = ?
//   `;

//   // Execute job posts query with the accountId as a parameter
//   connection.query(jobPostsQuery, [userId], (err, jobPostsResults) => {
//     if (err) {
//       console.error('Error fetching job posts:', err);
//       return res.status(500).json({ error: 'Internal Server Error' });
//     }

//     // Send the job descriptions only
//     res.status(200).json(jobPostsResults);
//   });
// });
const dateFormatOptions = {
  year: "numeric",
  month: "long",
  day: "numeric",
};
router.get("/jobApplicants/:applicationId", (req, res) => {
  const applicationId = req.params.applicationId;

  const jobApplicantQuery = `
    SELECT 
      account.username AS candidate_name
    FROM 
      applications
    INNER JOIN 
      account ON applications.Account_ID = account.id
    WHERE 
      applications.id = ?;
  `;

  connection.query(jobApplicantQuery, [applicationId], (err, results) => {
    if (err) {
      console.error("Error fetching job applicant:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    // Convert the BLOB image data to base64 encoded string
    results.forEach((applicant) => {
      if (applicant.candidate_image) {
        applicant.candidate_image = Buffer.from(
          applicant.candidate_image,
          "binary"
        ).toString("base64");
      }
    });

    res.status(200).json(results[0]); // Return the first applicant (assuming there's only one)
  });
});

router.get("/totalJobsApplied/:userId", (req, res) => {
  const employer_id = req.params.userId;
  const countQuery = `
    SELECT 
      COUNT(*) AS total_jobs_applied
    FROM 
      applications
    INNER JOIN 
      job_posts ON applications.job_id = job_posts.id
    WHERE 
      job_posts.account_id = ?;
  `;
  //////// AND
  // applications.status = 'applied'
  connection.query(countQuery, [employer_id], (err, countResults) => {
    if (err) {
      console.error("Error fetching total count of jobs:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    const total_jobs_applied = countResults[0].total_jobs_applied;
    res.status(200).json({ total_jobs_applied });
  });
});
router.get("/totalshortlistedJobs/:userId", (req, res) => {
  const employer_id = req.params.userId;
  const countQuery = `
    SELECT 
      COUNT(*) AS jobshortlistCount
    FROM 
      applications
    INNER JOIN 
      job_posts ON applications.job_id = job_posts.id
    WHERE 
      job_posts.account_id = ? AND
      applications.status = 'shortlisted';
  `;

  connection.query(countQuery, [employer_id], (err, countResults) => {
    if (err) {
      console.error("Error fetching total count of jobs:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    const jobshortlistCount = countResults[0].jobshortlistCount;
    res.status(200).json({ jobshortlistCount });
  });
});

/////////////////get api to fetch the candiate that applied for the job on employer dashboard//////
// candidate_info.Expected_Salary,
// candidate_info.skills,
// candidate_info.Complete_Address,
// INNER JOIN
//   candidate_info ON applications.Account_ID = candidate_info.Account_ID


router.get("/applicantsDatanew/:userId", (req, res) => {
  const employer_id = req.params.userId;
  const applicantsQuery = `
SELECT 
    applications.id AS application_id,
    account.username AS candidate_name,
    account.id AS candidate_id,
    job_posts.job_title AS job_title,
    candidate_info.skills,
    candidate_info.Complete_Address,
    candidate_info.logo AS candidate_logo
FROM 
    applications
INNER JOIN 
    account ON applications.Account_ID = account.id
INNER JOIN 
    job_posts ON applications.job_id = job_posts.id
LEFT JOIN 
    candidate_info ON applications.Account_ID = candidate_info.Account_ID
WHERE 
    job_posts.account_id = ? 
    AND applications.status = 'applied';

  `;

  connection.query(applicantsQuery, [employer_id], (err, applicantsResults) => {
    if (err) {
      console.error("Error fetching applicants:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    } else {
      // Convert the BLOB image data to base64 encoded string
      applicantsResults.forEach((applicant) => {
        if (applicant.candidate_image) {
          applicant.candidate_image = Buffer.from(
            applicant.candidate_image,
            "binary"
          ).toString("base64");
        }
      });

      res.status(200).json(applicantsResults);
    }
  });
});

router.get("/applicantsData/:userId", (req, res) => {
  const employer_id = req.params.userId;
  const applicantsQuery = `
  SELECT 
      applications.id AS application_id,
      account.username AS candidate_name,
      account.id AS candidate_id,
      job_posts.job_title AS job_title,
      
      candidate_info.skills,
      candidate_info.Complete_Address
  FROM 
      applications
  INNER JOIN 
      account ON applications.Account_ID = account.id
  INNER JOIN 
      job_posts ON applications.job_id = job_posts.id
  LEFT JOIN 
      candidate_info ON applications.Account_ID = candidate_info.Account_ID
  WHERE 
      job_posts.account_id = ? AND
      applications.status = 'applied';
  `;

  connection.query(applicantsQuery, [employer_id], (err, applicantsResults) => {
    if (err) {
      console.error("Error fetching applicants:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    } else {
      // Convert the BLOB image data to base64 encoded string
      applicantsResults.forEach((applicant) => {
        if (applicant.candidate_image) {
          applicant.candidate_image = Buffer.from(
            applicant.candidate_image,
            "binary"
          ).toString("base64");
        }
      });

      res.status(200).json(applicantsResults);
    }
  });
});
router.get("/applicantsApproved/:userId", (req, res) => {
  const employer_id = req.params.userId;
  const applicantsQuery = `
  SELECT 
      applications.id AS application_id,
      account.username AS candidate_name,
      account.id AS candidate_id,
      job_posts.job_title AS job_title,
      
      candidate_info.skills,
      candidate_info.Complete_Address
  FROM 
      applications
  INNER JOIN 
      account ON applications.Account_ID = account.id
  INNER JOIN 
      job_posts ON applications.job_id = job_posts.id
  LEFT JOIN 
      candidate_info ON applications.Account_ID = candidate_info.Account_ID
  WHERE 
      job_posts.account_id = ? AND
      applications.status = 'Approve';
  `;

  connection.query(applicantsQuery, [employer_id], (err, applicantsResults) => {
    if (err) {
      console.error("Error fetching applicants:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    } else {
      // Convert the BLOB image data to base64 encoded string
      applicantsResults.forEach((applicant) => {
        if (applicant.candidate_image) {
          applicant.candidate_image = Buffer.from(
            applicant.candidate_image,
            "binary"
          ).toString("base64");
        }
      });

      res.status(200).json(applicantsResults);
    }
  });
});
router.get("/applicantsShortlisted/:userId", (req, res) => {
  const employer_id = req.params.userId;
  const applicantsQuery = `
  SELECT 
      applications.id AS application_id,
      account.username AS candidate_name,
      account.id AS candidate_id,
      job_posts.job_title AS job_title,

      
      candidate_info.skills,
      candidate_info.Complete_Address
  FROM 
      applications
  INNER JOIN 
      account ON applications.Account_ID = account.id
  INNER JOIN 
      job_posts ON applications.job_id = job_posts.id
  LEFT JOIN 
      candidate_info ON applications.Account_ID = candidate_info.Account_ID
  WHERE 
      job_posts.account_id = ? AND
      applications.status = 'shortlisted';
  `;

  connection.query(applicantsQuery, [employer_id], (err, applicantsResults) => {
    if (err) {
      console.error("Error fetching applicants:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    } else {
      // Convert the BLOB image data to base64 encoded string
      applicantsResults.forEach((applicant) => {
        if (applicant.candidate_image) {
          applicant.candidate_image = Buffer.from(
            applicant.candidate_image,
            "binary"
          ).toString("base64");
        }
      });

      res.status(200).json(applicantsResults);
    }
  });
});
router.get("/applicantsRejected/:userId", (req, res) => {
  const employer_id = req.params.userId;
  const applicantsQuery = `
  SELECT 
      applications.id AS application_id,
      account.username AS candidate_name,
      account.id AS candidate_id,
      job_posts.job_title AS job_title,
     
      candidate_info.skills,
      candidate_info.Complete_Address
  FROM 
      applications
  INNER JOIN 
      account ON applications.Account_ID = account.id
  INNER JOIN 
      job_posts ON applications.job_id = job_posts.id
  LEFT JOIN 
      candidate_info ON applications.Account_ID = candidate_info.Account_ID
  WHERE 
      job_posts.account_id = ? AND
      applications.status = 'Rejected';
  `;

  connection.query(applicantsQuery, [employer_id], (err, applicantsResults) => {
    if (err) {
      console.error("Error fetching applicants:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    } else {
      // Convert the BLOB image data to base64 encoded string
      applicantsResults.forEach((applicant) => {
        if (applicant.candidate_image) {
          applicant.candidate_image = Buffer.from(
            applicant.candidate_image,
            "binary"
          ).toString("base64");
        }
      });

      res.status(200).json(applicantsResults);
    }
  });
});
router.get("/checkUserPackageStatus/:userId", (req, res) => {
  try {
    const userId = req.params.userId;

    // Perform a database query to check the user's package status
    const query =
      'SELECT status FROM cart WHERE account_id = ? AND status = "active"';

    connection.query(query, [userId], (err, results) => {
      if (err) {
        console.error("Error fetching package status:", err);
        return res.status(500).json({ error: "Internal Server Error" });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: "Package status not found" });
      }

      // Assuming results[0] contains the package status data
      const packageStatus = results[0].status;

      // You can modify this part based on what exactly you want to return
      res.status(200).json({ userId, packageStatus });
    });
  } catch (error) {
    console.error("Error in checkUserPackageStatus route:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/managejob/:userId", (req, res) => {
  const userId = req.params.userId;

  const jobPostsQuery = `
    SELECT jp.id AS job_id,jp.address, jp.job_title, jp.city, jp.application_deadline, jp.current_date_time, jp.status,
           a.id AS account_id
    FROM job_posts jp
    JOIN account a ON jp.account_id = a.id
    WHERE a.id = ?
  `;

  connection.query(jobPostsQuery, [userId], (err, jobPostsResults) => {
    if (err) {
      console.error("Error fetching job posts:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    // Convert the image data to Base64
    const resultsWithBase64Image = jobPostsResults.map((result) => {
      const base64Image = Buffer.from(result.accountImage).toString("base64");
      return { ...result, accountImage: base64Image };
    });

    // Format the dates and concatenate them into a single string
    const formattedJobPosts = resultsWithBase64Image.map((job) => ({
      address: job.address,
      id: job.job_id,
      job_title: job.job_title,
      city: job.city,
      created_and_expired_date: `${new Intl.DateTimeFormat(
        "en-US",
        dateFormatOptions
      ).format(new Date(job.current_date_time))} To ${new Intl.DateTimeFormat(
        "en-US",
        dateFormatOptions
      ).format(new Date(job.application_deadline))}`,
      status: job.status,
      account_id: job.account_id,
      accountImage: job.accountImage,
    }));

    res.status(200).json(formattedJobPosts);
  });
});

///***************************************fetch image api******************************* */
router.get("/logo/:userId", (req, res) => {
  // Define ':userId' as a route parameter
  const userId = req.params.userId;
  const companyLogoQuery = `
      SELECT Image
      FROM account
      WHERE id = ?
    `;
  connection.query(companyLogoQuery, [userId], (err, result) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    if (result.length === 0 || !result[0].logo) {
      return res.status(404).json({ error: "Image not found" });
    }
    const image = result[0].logo;
    res.writeHead(200, {
      "Content-Type": "image/jpeg",
      "Content-Length": image.length,
    });
    res.end(image);
  });
});
//*************************************fetch the posted jobs on dashboard */
router.get("/job-posts/:userId", (req, res) => {
  const userId = req.params.userId;

  // Fetch count of job posts associated with the provided userId from the database
  const sql = "SELECT COUNT(*) AS jobCount FROM job_posts WHERE account_id = ?";

  connection.query(sql, [userId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
    const jobCount = results[0].jobCount || 0; // Extract job count from the results
    return res.json({ userId, jobPostsCount: jobCount });
  });
});

////////////////////////////////////////////////////////////////////////
router.get("/alljobposts", (req, res) => {
  const jobPostsQuery = `
    SELECT 
      jp.id,
      jp.job_title,
      jp.city,
      jp.application_deadline,
      jp.current_date_time,
      jp.salary,
      jp.industry,
      jp.job_type
      
    FROM job_posts AS jp
    JOIN account AS a ON jp.account_id = a.id
    WHERE jp.status = 'Active';
  `;

  connection.query(jobPostsQuery, (err, jobPostsResults) => {
    if (err) {
      console.error("Error fetching all job posts:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    // Convert logo buffer to base64
    const resultsWithBase64Logo = jobPostsResults.map((result) => {
      const base64Image = Buffer.from(result.Image).toString("base64");
      return { ...result, Image: base64Image };
    });

    // Map industry names to their IDs using industryMapping
    const resultsWithIndustryIDs = resultsWithBase64Logo.map((result) => {
      let industryID;
      switch (result.industry) {
        case "All":
          industryID = 1;
          break;
        case "Pathologist":
          industryID = 2;
          break;
        case "Histotechnologist":
          industryID = 3;
          break;
        case "Cytotechnologist":
          industryID = 4;
          break;
        case "Medical Laboratory Technician":
          industryID = 5;
          break;
        case "Pathology Assistant":
          industryID = 6;
          break;
        case "Clinical Pathologist":
          industryID = 7;
          break;
        case "Health":
          industryID = 8;
          break;

        default:
          industryID = null; // Set default value if not found in mapping
      }
      return { ...result, industry_id: industryID };
    });

    res.status(200).json(resultsWithIndustryIDs);
  });
});

router.get("/company-info/:userId", (req, res) => {
  const userId = req.params.userId;

  //  SQL query to fetch data based on the user ID
  // const query = `SELECT * FROM company_info WHERE account_id = ?`;
  const query = `SELECT  company_name, email,department, phone,Image,  NTN, city,complete_address FROM company_info WHERE id = ?   `;

  connection.query(query, [userId], (err, results) => {
    if (err) {
      console.error("Error fetching company profile:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Company profile not found" });
    }

    // Assuming results[0] contains the company profile data
    const companyProfileData = results[0];
    res.status(200).json(companyProfileData);
  });
});
router.get("/get-image-name/:userId", (req, res) => {
  const userId = req.params.userId;

  const query = `SELECT logo FROM company_info WHERE account_id = ?`;
  connection.query(query, [userId], (err, results) => {
    if (err) {
      console.error("Error fetching company profile:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Company profile not found" });
    }

    // Assume the user ID or some identifier is used as the image name
    const imageName = `user_${userId}_logo`;

    // Send response with derived image name and other details
    res.status(200).json({ image_name: imageName, logo: results[0].logo });
  });
});

///////////////////////////////////////////////////////////
router.get("/singlejob/:id", (req, res) => {
  const jobId = req.params.id; // Ensure the parameter name matches the route


  const singlejobquery = `
    SELECT
    GROUP_CONCAT(jp.specialisms) AS specialisms,  -- Concatenate multiple specialisms into a single string
      jp.job_title,
      jp.city,
      jp.application_deadline,
      jp.job_description,
      jp.salary,
      jp.industry,
      jp.job_type,
      jp.status,
      jp.current_date_time,
      a.Image
    FROM job_posts AS jp
    LEFT JOIN account AS a ON jp.account_id = a.id
    WHERE jp.id=?
  `;

  // Execute the query with the jobId value as an argument
  connection.query(singlejobquery, [jobId], (err, results) => {
    if (err) {
      console.error("Error fetching job post:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    
    // Convert logo buffer to base64 only if it is not null
    const resultsWithBase64Logo = results.map((result) => {
      if (result.Image) {
        const base64Image = Buffer.from(result.Image).toString("base64");
        return { ...result, Image: base64Image };
      }
      return result;
    });

    // Send the fetched job details with base64 logo in the response
    res.json({ jobDetails: resultsWithBase64Logo });
  });
});

router.get("/jobsByIndustry/:industry/:id", (req, res) => {
  const industry = req.params.industry;
  const jobId = req.params.id;

  const jobsByIndustryQuery = `
    SELECT
      jp.id,
      jp.job_title,
      jp.city,
      jp.application_deadline,
      jp.salary,
      jp.industry,
      jp.job_type,
      jp.status,
      a.Image
    FROM job_posts AS jp
    LEFT JOIN account AS a ON jp.account_id = a.id
    WHERE jp.industry = ? AND jp.status = 'Active' AND jp.id != ?;
  `;

  connection.query(jobsByIndustryQuery, [industry, jobId], (err, results) => {
    if (err) {
      console.error("Error fetching jobs by industry:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    // Convert logo buffer to base64
    const resultsWithBase64Logo = results.map((result) => {
      const base64Image = Buffer.from(result.Image).toString("base64");
      return { ...result, Image: base64Image };
    });

    res.json({ relatedJobs: resultsWithBase64Logo });
  });
});

/////////////////////////////////////////
router.get("/job/:jobIdFromUrl", (req, res) => {
  const jobId = req.params.jobIdFromUrl; // Ensure the parameter name matches the route

  const singlejobquery = `
  SELECT
  jp.job_title,
  jp.email,
  jp.username,
  jp.career,
  jp.experience,
  jp.city,
  jp.application_deadline,
  jp.job_description,
  jp.gender,
  jp.salary,
  jp.industry,
  jp.specialisms,
  jp.job_type,
  jp.qualification,
  jp.address
FROM job_posts AS jp
  WHERE jp.id = ?;
  `;

  // Execute the query with the jobId value as an argument
  connection.query(singlejobquery, [jobId], (err, results) => {
    if (err) {
      console.error("Error fetching job post:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }


    res.json({ results });
  });
});
//////////////////////////////////////get packages
router.get("/pricing", async (req, res) => {
  try {
    const pricingData = await getAllPackages();
    return res.json(pricingData);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// Function to get all packages from the database
const getAllPackages = () => {
  return new Promise((resolve, reject) => {
    const getAllSql = "SELECT * FROM packages";
    connection.query(getAllSql, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};
module.exports = router;
