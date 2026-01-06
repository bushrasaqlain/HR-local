// const multer = require('multer');
// const express = require('express');
// const router = express.Router();
// router.use(express.json());
// const connection = require("../connection");

// const storage = multer.memoryStorage();
// const upload = multer({ storage: storage });
// const nodemailer = require('nodemailer');
// const { default: axios } = require('axios');
// const authMiddleware = require('../middleware/auth');

// // Create a Nodemailer transporter using SMTP
// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: 'maryamhassan.pma@gmail.com',
//     pass: 'qaig ggzb wyiz ueey'
//   }
// });



// // Create the CVs table in the database
// const createCVsTable =()=>{
// const cvTable = `
// CREATE TABLE IF NOT EXISTS applications (
//     id INT AUTO_INCREMENT PRIMARY KEY,
//     job_id INT,
//     message TEXT NOT NULL,
//     cv_data LONGBLOB NOT NULL,
//     cv_filename VARCHAR(255) NOT NULL,
//     Account_ID INT,
//     status VARCHAR(50) DEFAULT 'applied',
//     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//     FOREIGN KEY (job_id) REFERENCES job_posts(id),
//     FOREIGN KEY (Account_ID) REFERENCES account(id)
// );`;

// // Execute the query to create the table
// connection.query(cvTable, function (err, results, fields) {
//   if (err) {
//     return console.error(err.message);
//   }
//   console.log("applications table created successfully");
// });
// }


// router.post("/", upload.single("cv_data"), (req, res) => {
//   const { message } = req.body;
//   const cvFilename = req.file.originalname;
//   const cvData = req.file.buffer;
//   const accountId = parseInt(req.body.account_id);
//   const jobId = req.body.job_id;

//   if (isNaN(accountId)) {
//     return res.status(400).json({ error: "Invalid account_id" });
//   }

//   // Check if a record already exists for the given account_id and job_id
//   connection.query(
//     "SELECT * FROM applications WHERE Account_ID = ? AND job_id = ?",
//     [accountId, jobId],
//     (error, results, fields) => {
//       if (error) {
//         console.error("Error checking database:", error);
//         res.status(500).json({ error: "Internal server error" });
//         return;
//       }

//       if (results.length > 0) {
//         // If a record exists, update it
//         connection.query(
//           "UPDATE applications SET message = ?, cv_filename = ?, cv_data = ? WHERE Account_ID = ? AND job_id = ?",
//           [message, cvFilename, cvData, accountId, jobId],
//           (updateError, updateResults) => {
//             if (updateError) {
//               console.error("Error updating database:", updateError);
//               res.status(500).json({ error: "Internal server error" });
//             } else {
            
//               const senderId = accountId; // Set senderId to the accountId
//               // Fetch receiverId dynamically from job_posts table
//               connection.query(
//                 "SELECT account_id FROM job_posts WHERE id = ?",
//                 [jobId],
//                 (receiverError, receiverResults) => {
//                   if (receiverError || receiverResults.length === 0) {
//                     console.error("Error fetching receiverId from job_posts table:", receiverError || "No matching job post found");
//                     res.status(500).json({ error: "Internal server error" });
//                   } else {
//                     const receiverId = receiverResults[0].account_id;
//                     // Insert message into the messages table
//                     connection.query(
//                       "INSERT INTO messages (senderId, receiverId, message, timestamp) VALUES (?, ?, ?, NOW())",
//                       [senderId, receiverId, message],
//                       (messageError, messageResults) => {
//                         if (messageError) {
//                           console.error("Error inserting message into database:", messageError);
//                           res.status(500).json({ error: "Internal server error" });
//                         } else {
                        
//                           // Fetch email dynamically from account table
//                           connection.query(
//                             "SELECT account.email, account.full_name, job_posts.job_title FROM account INNER JOIN job_posts ON job_posts.id = ? WHERE account.id = job_posts.account_id",
//                             [jobId],
//                             (emailError, emailResults) => {
//                               if (emailError) {
//                                 console.error("Error fetching email from account table:", emailError);
//                                 res.status(500).json({ error: "Internal server error" });
//                               } else {
//                                 const { email, full_name, job_title } = emailResults[0];
//                                 // Send email here with dynamically fetched email address
//                                 sendEmail(email, full_name, job_title, message, cvFilename);
//                                 res.status(200).json({ message: "Application updated successfully" });
//                               }
//                             }
//                           );
//                         }
//                       }
//                     );
//                   }
//                 }
//               );
//             }
//           }
//         );
//       } else {
//         // If no record exists, insert a new one
//         connection.query(
//           "INSERT INTO applications (message, cv_filename, cv_data, Account_ID, job_id) VALUES (?, ?, ?, ?, ?)",
//           [message, cvFilename, cvData, accountId, jobId],
//           (insertError, insertResults) => {
//             if (insertError) {
//               console.error("Error inserting into database:", insertError);
//               res.status(500).json({ error: "Internal server error" });
//             } else {
           
//               const senderId = accountId; // Set senderId to the accountId
//               // Fetch receiverId dynamically from job_posts table
//               connection.query(
//                 "SELECT account_id FROM job_posts WHERE id = ?",
//                 [jobId],
//                 (receiverError, receiverResults) => {
//                   if (receiverError || receiverResults.length === 0) {
//                     console.error("Error fetching receiverId from job_posts table:", receiverError || "No matching job post found");
//                     res.status(500).json({ error: "Internal server error" });
//                   } else {
//                     const receiverId = receiverResults[0].account_id;
//                     // Insert message into the messages table
//                     connection.query(
//                       "INSERT INTO messages (senderId, receiverId, message, timestamp) VALUES (?, ?, ?, NOW())",
//                       [senderId, receiverId, message],
//                       (messageError, messageResults) => {
//                         if (messageError) {
//                           console.error("Error inserting message into database:", messageError);
//                           res.status(500).json({ error: "Internal server error" });
//                         } else {
                       
//                           // Fetch email dynamically from account table
//                           connection.query(
//                             "SELECT account.email, account.full_name, job_posts.job_title FROM account INNER JOIN job_posts ON job_posts.id = ? INNER JOIN applications ON applications.Account_ID = account.id WHERE applications.Account_ID = ? AND applications.job_id = ?",
//                             [jobId, accountId, jobId],
//                             (emailError, emailResults) => {
//                               if (emailError) {
//                                 console.error("Error fetching email from account table:", emailError);
//                                 res.status(500).json({ error: "Internal server error" });
//                               } else {
//                                 const { email, full_name, job_title } = emailResults[0];
//                                 // Send email here with dynamically fetched email address
//                                 sendEmail(email, full_name, job_title, message, cvFilename);
//                                 res.status(200).json({ message: "Application submitted successfully" });
//                               }
//                             }
//                           );
//                         }
//                       }
//                     );
//                   }
//                 }
//               );
//             }
//           }
//         );
//       }
//     }
//   );
// });



// // Function to send email
// function sendEmail(emailAddress, fullName, jobTitle, message, cvFilename) {
//   // Construct email message
//   const mailOptions = {
//     from: 'maryamhassan.pma@gmail.com',
//     to: emailAddress,
//     subject: 'New Job Application Submitted',
//     text: ` New Application submitted for the job titled: ${jobTitle}\n\nMessage: ${message}\n\nCV Filename: ${cvFilename}`
//   };

//   // Send email
//   transporter.sendMail(mailOptions, (error, info) => {
//     if (error) {
//       console.error('Error sending email:', error);
//     } 
//   });
// }



// // Handle GET request to retrieve jobs applied by a specific user
// router.get("/", authMiddleware , (req, res) => {
//   const accountId = req.user.userId;

//   if (isNaN(accountId)) {
//     return res.status(400).json({ error: "Invalid account ID" });
//   }

//   const sql = `
//     SELECT job_posts.*, applications.job_id AS job_id, applications.cv_filename,applications.status, applications.created_at, company_info.company_name
//     FROM applications
//     JOIN job_posts ON applications.job_id = job_posts.id
//     JOIN account ON job_posts.account_id = account.id
//     JOIN company_info ON job_posts.account_id = company_info.account_id
//     WHERE applications.Account_ID = ?
//     `;
//   connection.query(sql, [accountId], (error, results, fields) => {
//     if (error) {
//       console.error("Error retrieving job applications:", error);
//       res.status(500).json({ error: "Internal server error" });
//       return;
//     }
//     // Convert logo buffer to base64 only if it is not null
//     const resultsWithBase64Logo = results.map((result) => {
//       if (result.Image) {
//         const base64Image = Buffer.from(result.Image).toString("base64");
//         return { ...result, Image: base64Image };
//       }
//       return result;
//     });

//     // Send the fetched job details with base64 logo in the response
//     res.json({ jobDetails: resultsWithBase64Logo });
//     //   res.status(200).json(resultsWithBase64Logo);
//     // res.status(200).json(results);
//   });
// });


// // Handle GET request to retrieve count of jobs applied by a specific user
// router.get("/jobCount/:accountId", (req, res) => {
//   const accountId = parseInt(req.params.accountId);

//   if (isNaN(accountId)) {
//     return res.status(400).json({ error: "Invalid account ID" });
//   }

//   const sql = `
//     SELECT COUNT(*) AS appliedJobCount
//     FROM applications
//     WHERE Account_ID = ?
//     `;
//   connection.query(sql, [accountId], (error, results, fields) => {
//     if (error) {
//       console.error("Error retrieving applied job count:", error);
//       res.status(500).json({ error: "Internal server error" });
//       return;
//     }

//     // Extract the applied job count from the result
//     const appliedJobCount = results[0].appliedJobCount;

//     res.status(200).json({ count: appliedJobCount });
//   });
// });
// router.get("/alertCount/:accountId", (req, res) => {
//   const accountId = parseInt(req.params.accountId);

//   if (isNaN(accountId)) {
//     return res.status(400).json({ error: "Invalid account ID" });
//   }

//   const sql = `
//     SELECT COUNT(*) AS jobAlertCount
//     FROM job_posts
//     WHERE status = 'Active'

//     `;
//   connection.query(sql, [accountId], (error, results, fields) => {
//     if (error) {
//       console.error("Error retrieving applied job count:", error);
//       res.status(500).json({ error: "Internal server error" });
//       return;
//     }

//     // Extract the applied job count from the result
//     const jobAlertCount = results[0].jobAlertCount;

//     res.status(200).json({ count: jobAlertCount });
//   });
// });





// // Define a route to retrieve job applications by account ID and job_id
// // router.get('/applicantCV/:accountId/:jobId', (req, res) => {
// //   const accountId = parseInt(req.params.accountId);
// //   const jobId = parseInt(req.params.jobId);

// //   if (isNaN(accountId) || isNaN(jobId)) {
// //     return res.status(400).json({ error: "Invalid account ID or job ID" });
// // }

// //   // Query the database for job applications by account ID
// //   connection.query('SELECT cv_filename, TO_BASE64(cv_data) AS cv_data_base64 FROM applications WHERE Account_ID = ? AND job_id = ?', [accountId, jobId], (error, results, fields) => {
// //     if (error) {
// //           console.error('Error retrieving job applications:', error);
// //           res.status(500).json({ error: 'Internal server error' });
// //           return;
// //       }

// //       // Return the job applications as JSON
// //       res.status(200).json(results);
// //   });
// // });

// router.get('/applicantCV/:jobId', (req, res) => {
//   const jobId = parseInt(req.params.jobId);
//   if (isNaN(jobId)) {
//     return res.status(400).json({ error: "Invalid job ID" });
//   }

//   // Query the database for job applications by account ID
//   connection.query('SELECT cv_filename, TO_BASE64(cv_data) AS cv_data_base64 FROM applications WHERE job_id = ?', [jobId], (error, results, fields) => {
//     if (error) {
//       console.error('Error retrieving job applications:', error);
//       res.status(500).json({ error: 'Internal server error' });
//       return;
//     }

//     // Return the job applications as JSON
//     res.status(200).json(results);
//   });
// });

// // router.get("/applicantCV", (req, res) => {
// //   // Query the database for job applications by account ID
// //   connection.query(
// //     "SELECT cv_filename, TO_BASE64(cv_data) AS cv_data_base64 FROM applications",
// //     (error, results, fields) => {
// //       if (error) {
// //         console.error("Error retrieving job applications:", error);
// //         res.status(500).json({ error: "Internal server error" });
// //         return;
// //       }

// //       // Return the job applications as JSON
// //       res.status(200).json(results);
// //     }
// //   );
// // });
// //GET API to get applicants applications
// router.get("/applicantsData/:userId", (req, res) => {
//   const employer_id = req.params.userId;
//   const applicantsQuery = `
//     SELECT 
//         applications.id AS application_id,
//         account.full_name AS candidate_name,
//         account.Image AS candidate_image,
//         job_posts.industry AS job_industry
//     FROM 
//         applications
//     INNER JOIN 
//         account ON applications.Account_ID = account.id
//     INNER JOIN 
//         job_posts ON applications.job_id = job_posts.id
//     WHERE 
//         job_posts.account_id = ? AND
//         applications.status = 'applied';
//     `;

//   connection.query(applicantsQuery, [employer_id], (err, applicantsResults) => {
//     if (err) {
//       console.error("Error fetching applicants:", err);
//       return res.status(500).json({ error: "Internal Server Error" });
//     } else {
//       // Convert the BLOB image data to base64 encoded string
//       applicantsResults.forEach((applicant) => {
//         if (applicant.candidate_image) {
//           applicant.candidate_image = Buffer.from(
//             applicant.candidate_image,
//             "binary"
//           ).toString("base64");
//         }
//       });

//       res.status(200).json(applicantsResults);
//     }
//   });
// });
// // Handle form submissions
// // router.post('/', upload.single('cv_data'), (req, res) => {
// //     const { message } = req.body;
// //     const cvFilename = req.file.originalname;
// //     // const cvData = req.file.buffer;
// //     const cvData = req.file.buffer.toString('base64'); // Convert binary data to base64 string
// //     const accountId = parseInt(req.body.account_id); // Convert accountId to integer
// //     const id = req.body.job_id;
// //     // Validate if accountId is a valid number
// //   if (isNaN(accountId)) {
// //     return res.status(400).json({ error: "Invalid account_id" });
// //   }
// //     // Insert data into MySQL database
// //     const sql = 'INSERT INTO applications (message, cv_filename,cv_data,  Account_ID, job_id) VALUES (?, ?, ?, ?,?)';
// //     connection.query(sql, [message, cvFilename,cvData, accountId, id ], (error, results, fields) => {
// //       if (error) {
// //         console.error('Error inserting into database:', error);
// //         res.status(500).json({ error: 'Internal server error' });
// //       } else {

// //         res.status(200).json({ message: 'Application submitted successfully' });
// //       }
// //     });
// //   });


// module.exports = router;
