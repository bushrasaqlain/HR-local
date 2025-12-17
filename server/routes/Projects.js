const express = require("express");
const router = express.Router();
const multer = require("multer");
const connection = require("../connection");



// Create the projects table in the database
const createProjectsTable =()=>{
const cv_projects = `
CREATE TABLE IF NOT EXISTS cv_projects (
  id INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
  user_id INT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES account(id), -- Add foreign key constraint
  project_title VARCHAR(255) NOT NULL,
  role VARCHAR(255) NOT NULL,
  project_description TEXT,
  skills_used JSON NOT NULL,
  project_link VARCHAR(255),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
`;

// Execute the queries to create the tables
connection.query(cv_projects, function (err, results, fields) {
  if (err) {
    console.error("Error creating Projects table:", err.message);
  } else {
    console.log("Projects table created successfully");
  }
});
}

// // Route to fetch data from the projects table for a specific user
router.get("/projects/:user_id", (req, res) => {
  const { user_id } = req.params;

  const sql = `
    SELECT * 
    FROM cv_projects
    WHERE user_id = ?
  `;

  connection.query(sql, [user_id], (err, results) => {
    if (err) {
      console.error("Error fetching data:", err);
      res.status(500).json({ error: "Error fetching data", details: err.message });
    } else {
     
      res.status(200).json(results);
    }
  });
});

// Route to fetch data from the projects table for a specific user
// http://localhost:8080/projects/${id}
router.get("/project-get/:id", (req, res) => {
  const id = req.params.id;

  const sql =
    "SELECT * FROM cv_projects WHERE id = ?";

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

// POST API endpoint for adding projects record
router.post('/projects', (req, res) => {
  const { user_id, ProjectTitle, role, projectDescription, skillsUsed, projectLink } = req.body;

  const query = `
    INSERT INTO cv_projects (user_id, project_title, role, project_description, skills_used, project_link)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  connection.query(
    query,
    [user_id, ProjectTitle, role, projectDescription, skillsUsed, projectLink],
    (err, result) => {
      if (err) {
        console.error('Error adding projects record:', err.message);
        return res.status(500).send({ msg: 'SERVER_ERROR' });
      }

      const insertedId = result.insertId;

      // Fetch the inserted record and return it
      const fetchQuery = `SELECT * FROM cv_projects WHERE id = ?`;
      connection.query(fetchQuery, [insertedId], (fetchErr, rows) => {
        if (fetchErr) {
          console.error('Error fetching inserted project record:', fetchErr.message);
          return res.status(500).send({ msg: 'SERVER_ERROR' });
        }
        res.status(200).send(rows[0]); // send the created record
      });
    }
  );
});


// PUT API endpoint for editing projects record by ID
router.put('/projects/:id', (req, res) => {
  const { ProjectTitle, role, projectDescription, skillsUsed, projectLink } = req.body;
  const projectId = req.params.id;

  const query = `
    UPDATE cv_projects
    SET project_title = ?, role = ?, project_description = ?, skills_used = ?, project_link = ?
    WHERE id = ?
  `;

  connection.query(
    query,
    [ProjectTitle, role, projectDescription, skillsUsed, projectLink, projectId],
    (err, result) => {
      if (err) {
        console.error('Error updating project record:', err.message);
        return res.status(500).send({ msg: 'SERVER_ERROR' });
      }

      // Fetch the updated record and return it
      const fetchQuery = `SELECT * FROM cv_projects WHERE id = ?`;
      connection.query(fetchQuery, [projectId], (fetchErr, rows) => {
        if (fetchErr) {
          console.error('Error fetching updated project record:', fetchErr.message);
          return res.status(500).send({ msg: 'SERVER_ERROR' });
        }
        res.status(200).send(rows[0]); // send the updated record
      });
    }
  );
});

// DELETE API endpoint for deleting projects record by ID
router.delete('/projects/delete/:id', (req, res) => {
  const projectId = req.params.id;

  const query = 'DELETE FROM cv_projects WHERE id = ?';

  connection.query(query, [projectId], (err, result) => {
    if (err) {
      console.error('Error deleting projects record:', err.message);
      res.status(500).send({ msg: 'SERVER_ERROR' });
    } else {
      res.status(200).send({ msg: 'projects record deleted successfully' });
    }
  });
});

module.exports = router;
