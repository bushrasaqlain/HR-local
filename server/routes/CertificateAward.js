const express = require("express");
const router = express.Router();
const connection = require("../connection");
const { create } = require("handlebars");

// Create the education table in the database
const createCertificateAwardTable =()=>{
const CertificateAwards = `
CREATE TABLE IF NOT EXISTS CV_certificateAwards (
  id INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
  user_id INT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES account(id), -- Add foreign key constraint
  title VARCHAR(255) NOT NULL,
  institute_name VARCHAR(255) NOT NULL,
  passing_year INT NOT NULL,
  description TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
  `;


// Execute the queries to create the tables
connection.query(CertificateAwards, function (err, results, fields) {
  if (err) {
    console.error("Error creating CV_certificateAwards table:", err.message);
  } else {
    console.log("CV_certificateAwards table created successfully");
  }
});
}

// Route to fetch data from the CV_ table for a specific user
// http://localhost:8080/certificateAwards/${userId}
router.get("/certificateAwards/:user_id", (req, res) => {
  const user_id = req.params.user_id;

  const sql =
    "SELECT * FROM CV_certificateAwards WHERE user_id = ?";

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
// Route to fetch data from the CV_certificateAwards table for a specific user
// http://localhost:8080/certificateAwards/${id}
router.get("/certificateAwards-get/:id", (req, res) => {
  const id = req.params.id;

  const sql =
    "SELECT * FROM CV_certificateAwards WHERE id = ?";

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

// POST API endpoint for adding certificateAwards record
router.post('/certificateAwards', (req, res) => {
  const { user_id, title, instituteName, passingYear, description } = req.body;

  const query = `
    INSERT INTO CV_certificateAwards (user_id, title, institute_name, passing_year, description)
    VALUES (?, ?, ?, ?, ?)
  `;

  connection.query(query, [user_id, title, instituteName, passingYear, description], (err, result) => {
    if (err) {
      console.error('Error adding certificateAwards record:', err.message);
      return res.status(500).send({ msg: 'SERVER_ERROR' });
    }

    const insertedId = result.insertId;

    // ✅ fetch the inserted record
    const fetchQuery = `SELECT * FROM CV_certificateAwards WHERE id = ?`;
    connection.query(fetchQuery, [insertedId], (fetchErr, rows) => {
      if (fetchErr) {
        console.error('Error fetching inserted certificateAwards record:', fetchErr.message);
        return res.status(500).send({ msg: 'SERVER_ERROR' });
      }
      res.status(200).send(rows[0]); // send the newly created record
    });
  });
});


// PUT API endpoint for updating certificateAwards record by ID
router.put('/certificateAwards/:id', (req, res) => {
  const { title, instituteName, passingYear, description } = req.body;
  const certificateAwardsId = req.params.id;

  const query = `
    UPDATE CV_certificateAwards
    SET title = ?, institute_name = ?, passing_year = ?, description = ?
    WHERE id = ?
  `;

  connection.query(
    query,
    [title, instituteName, passingYear, description, certificateAwardsId],
    (err, result) => {
      if (err) {
        console.error('Error updating certificateAwards record:', err.message);
        return res.status(500).send({ msg: 'SERVER_ERROR' });
      }

      // ✅ fetch the updated record
      const fetchQuery = `SELECT * FROM CV_certificateAwards WHERE id = ?`;
      connection.query(fetchQuery, [certificateAwardsId], (fetchErr, rows) => {
        if (fetchErr) {
          console.error('Error fetching updated certificateAwards record:', fetchErr.message);
          return res.status(500).send({ msg: 'SERVER_ERROR' });
        }
        res.status(200).send(rows[0]); // send updated record
      });
    }
  );
});

// DELETE API endpoint for deleting education record by ID
router.delete('/certificateAwards/delete/:id', (req, res) => {
  const certificateAwardsId = req.params.id;

  const query = 'DELETE FROM CV_certificateAwards WHERE id = ?';

  connection.query(query, [certificateAwardsId], (err, result) => {
    if (err) {
      console.error('Error deleting certificateAwards record:', err.message);
      res.status(500).send({ msg: 'SERVER_ERROR' });
    } else {
      res.status(200).send({ msg: 'CertificateAwards record deleted successfully' });
    }
  });
});

module.exports = router;