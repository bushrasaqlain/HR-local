const express = require("express");
const router = express.Router();
const multer = require("multer");
const connection = require("../connection");

// Configure multer to handle file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const createEducationTable =()=>{
const cv_education = `
CREATE TABLE IF NOT EXISTS candidate_education (
  id INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
  user_id INT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES account(id), -- Add foreign key constraint
  degree_title_id INT NOT NULL,
  institute_name VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  education_description TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (degree_title_id) REFERENCES degreetypes(id)
);
  `;

// Execute the queries to create the tables
connection.query(cv_education, function (err, results, fields) {
  if (err) {
    console.error("Error creating Education table:", err.message);
  } else {
    console.log("Education table created successfully");
  }
});
}

// Route to fetch data from the education table for a specific user
// http://localhost:8080/education/${userId}
router.get("/education/:user_id", (req, res) => {
  const user_id = req.params.user_id;

  const sql =
    `SELECT ed.*,
    d.name AS degree_title
    FROM cv_education ed 
    LEFT JOIN degreetypes d ON ed.degree_title_id = d.id
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
// Route to fetch data from the education table for a specific user
// http://localhost:8080/education/${id}
router.get("/education-get/:id", (req, res) => {
  const id = req.params.id;

  const sql =
    `SELECT ed.*,
    d.name AS degree_title
    FROM cv_education ed 
    LEFT JOIN degreetypes d ON ed.degree_title_id = d.id
    WHERE ed.id = ?`

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


// POST API endpoint for adding or updating education records
router.post('/education', (req, res) => {
  const {user_id, degreeTitle, fieldOfStudy, instituteName, startDate, endDate, educationDescription } = req.body;

  const query = `
    INSERT INTO cv_education (user_id, degree_title_id, institute_name, start_date, end_date, education_description)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  connection.query(query, [user_id, degreeTitle, instituteName, startDate, endDate, educationDescription], (err, result) => {
    if (err) {
      console.error('Error adding education record:', err.message);
      res.status(500).send({ msg: 'SERVER_ERROR' });
    } else {
       const insertedId = result.insertId;

      // Fetch the newly inserted record
      connection.query(
        "SELECT * FROM cv_education WHERE id = ?",
        [insertedId],
        (err2, rows) => {
          if (err2) {
            console.error("Error fetching inserted record:", err2.message);
            return res.status(500).send({ msg: "SERVER_ERROR" });
          }

          res.status(200).json(rows[0]); // return the actual inserted row
        }
      );
    }
  });
});
// Update API endpoint for editing education record by ID
router.put('/education/:id', (req, res) => {
  const { degreeTitle, fieldOfStudy, instituteName, startDate, endDate, educationDescription } = req.body;
  const educationId = req.params.id;

  const updateQuery = `
    UPDATE cv_education
    SET degree_title_id = ?, institute_name = ?, start_date = ?, end_date = ?, education_description = ?
    WHERE id = ?
  `;

  connection.query(
    updateQuery,
    [degreeTitle, instituteName, startDate, endDate, educationDescription, educationId],
    (err, result) => {
      if (err) {
        console.error('Error updating education record:', err.message);
        return res.status(500).send({ msg: 'SERVER_ERROR' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).send({ msg: 'Education record not found' });
      }

      // Fetch the updated record and return it
      const fetchQuery = `SELECT ed.*,
    d.name AS degree_title
    FROM cv_education ed 
    LEFT JOIN degreetypes d ON ed.degree_title_id = d.id
    WHERE ed.id = ?`;
      connection.query(fetchQuery, [educationId], (err, rows) => {
        if (err) {
          console.error('Error fetching updated education record:', err.message);
          return res.status(500).send({ msg: 'SERVER_ERROR' });
        }

        res.status(200).json(rows[0]); // send back the updated row
      });
    }
  );
});

// DELETE API endpoint for deleting education record by ID
router.delete('/education/delete/:id', (req, res) => {
  const educationId = req.params.id;

  const query = 'DELETE FROM cv_education WHERE id = ?';

  connection.query(query, [educationId], (err, result) => {
    if (err) {
      console.error('Error deleting education record:', err.message);
      res.status(500).send({ msg: 'SERVER_ERROR' });
    } else {
      res.status(200).send({ msg: 'Education record deleted successfully' });
    }
  });
});

module.exports = router;