const express = require("express");
const router = express.Router();
const multer = require("multer");
const connection = require("../connection");

// Configure multer to handle file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });



// Create the work_experience table in the database
const createWorkExperienceTable =()=>{
const cv_work_experience = `
CREATE TABLE IF NOT EXISTS cv_work_experience (
    id INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
    user_id INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES account(id), -- Add foreign key constraint
    job_title_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    company_name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (job_title_id) REFERENCES jobtitle(id)
  );
  
  `;

// Execute the queries to create the tables
connection.query(cv_work_experience, function (err, results, fields) {
    if (err) {
      console.error("Error creating work_experience table:", err.message);
    } else {
      console.log("work_experience table created successfully");
    }
  });
}
  // POST API endpoint for adding work experience
router.post('/work-experience', (req, res) => {
  const { user_id, designation, startDate, endDate, company_name, description } = req.body;

  const query = `
    INSERT INTO cv_work_experience (user_id, job_title_id, start_date, end_date, company_name, description)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  connection.query(
    query,
    [user_id, designation, startDate, endDate, company_name, description],
    (err, result) => {
      if (err) {
        console.error('Error adding work experience:', err.message);
        return res.status(500).send({ msg: 'SERVER_ERROR' });
      }

      const insertedId = result.insertId;

      // Fetch the inserted record
      connection.query(
        `SELECT we.*,
    jt.name AS job_title
    FROM cv_work_experience we 
    LEFT JOIN jobtitle jt ON we.job_title_id = jt.id
    WHERE we.id = ?`,
        [insertedId],
        (err2, rows) => {
          if (err2) {
            console.error('Error fetching inserted record:', err2.message);
            return res.status(500).send({ msg: 'SERVER_ERROR' });
          }
          res.status(200).send({
            msg: 'Work experience added successfully',
            record: rows[0]
          });
        }
      );
    }
  );
});


// Update API endpoint for editing work experience by ID
router.put('/work-experience/:id', (req, res) => {
  const { designation, startDate, endDate, company_name, description } = req.body;
  const workExperienceId = req.params.id;

  const query = `
    UPDATE cv_work_experience
    SET job_title_id = ?, start_date = ?, end_date = ?, company_name = ?, description = ?
    WHERE id = ?
  `;

  connection.query(
    query,
    [designation, startDate, endDate, company_name, description, workExperienceId],
    (err, result) => {
      if (err) {
        console.error('Error updating work experience:', err.message);
        return res.status(500).send({ msg: 'SERVER_ERROR' });
      }

      // Fetch the updated record
      connection.query(
        `SELECT we.*,
    jt.name AS job_title
    FROM cv_work_experience we 
    LEFT JOIN jobtitle jt ON we.job_title_id = jt.id
    WHERE we.id = ?`,
        [workExperienceId],
        (err2, rows) => {
          if (err2) {
            console.error('Error fetching updated record:', err2.message);
            return res.status(500).send({ msg: 'SERVER_ERROR' });
          }
          res.status(200).send({
            msg: 'Work experience updated successfully',
            record: rows[0]
          });
        }
      );
    }
  );
});


// POST API endpoint for adding or updating work records
// router.post('/work-experience/update', (req, res) => {
//   const { user_id, designation, workDuration, company_name, description } = req.body;

//   // Check if the record already exists for the user
//   const checkQuery = 'SELECT * FROM work_experience WHERE id = ?';
//   connection.query(checkQuery, [id], (checkErr, checkResults) => {
//     if (checkErr) {
//       console.error('Error checking existing work_experience record:', checkErr.message);
//       return res.status(500).send({ msg: 'SERVER_ERROR' });
//     }

//     if (checkResults.length > 0) {
//       // If the record exists, update it
//       const updateQuery = `
//         UPDATE work_experience
//         SET designation = ?,  duration = ?, company_name = ?,description = ?
//         WHERE id = ?
//       `;
//       connection.query(updateQuery, [designation, workDuration, company_name, description, id], (updateErr, updateResult) => {
//         if (updateErr) {
//           console.error('Error updating education record:', updateErr.message);
//           return res.status(500).send({ msg: 'SERVER_ERROR' });
//         }
//         res.status(200).send({ msg: 'Education record updated successfully' });
//       });
//     } else {
//       // If the record does not exist, insert a new one
//       const insertQuery = `
//         INSERT INTO work_experience (user_id, designation, duration, company_name, description)
//         VALUES (?, ?, ?, ?, ?)
//       `;
//       connection.query(insertQuery, [user_id, designation, workDuration, company_name, description], (insertErr, insertResult) => {
//         if (insertErr) {
//           console.error('Error adding work record:', insertErr.message);
//           return res.status(500).send({ msg: 'SERVER_ERROR' });
//         }
//         res.status(200).send({ id: insertResult.insertId, msg: 'Work record added successfully' });
//       });
//     }
//   });
// });

// Route to fetch data from the work&experience table for a specific user
// http://localhost:8080/work-experience/${id}
router.get("/work-experience-get/:id", (req, res) => {
  const id = req.params.id;

  const sql =
    `SELECT we.*,
    jt.name AS job_title
    FROM cv_work_experience we 
    LEFT JOIN jobtitle jt ON we.job_title_id = jt.id
    WHERE we.id = ?`;

  connection.query(sql, [id], (err, results) => {
    if (err) {
      console.error("Error fetching data:", err);
      res
        .status(500)
        .json({ error: "Error fetching data", details: err.message });
    } else {
      
      res.status(200).json(results);
    }
  });
});

router.get("/work-experience/:user_id", (req, res) => {
  const user_id = req.params.user_id;

  const sql =
    `SELECT we.*,
    jt.name AS job_title
    FROM cv_work_experience we 
    LEFT JOIN jobtitle jt ON we.job_title_id = jt.id
    WHERE user_id = ?`;

  connection.query(sql, [user_id], (err, results) => {
    if (err) {
      console.error("Error fetching data:", err);
      res
        .status(500)
        .json({ error: "Error fetching data", details: err.message });
    } else {
      
      res.status(200).json(results);
    }
  });
});
// DELETE API endpoint for deleting work experience by ID
router.delete('/work-experience/delete/:id', (req, res) => {
  const workExperienceId = req.params.id;

  const query = 'DELETE FROM cv_work_experience WHERE id = ?';

  connection.query(query, [workExperienceId], (err, result) => {
    if (err) {
      console.error('Error deleting work experience:', err.message);
      res.status(500).send({ msg: 'SERVER_ERROR' });
    } else {
      res.status(200).send({ msg: 'Work experience deleted successfully' });
    }
  });
});
module.exports = router;
