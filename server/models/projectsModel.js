const connection = require("../connection");

// Create the projects table
const createProjectsTable = () => {
  const cv_projects = `
    CREATE TABLE IF NOT EXISTS cv_projects (
      id INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
      user_id INT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES account(id),
      project_title VARCHAR(255) NOT NULL,
      role VARCHAR(255) NOT NULL,
      project_description TEXT,
      skills_used JSON NOT NULL,
      project_link VARCHAR(255),
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `;

  connection.query(cv_projects, (err, results) => {
    if (err) {
      console.error("Error creating Projects table:", err.message);
    } else {
      console.log("Projects table created successfully");
    }
  });
};

// Get all projects by user_id
const getProjectsByUserId = ({ user_id }, callback) => {
  const query = `
    SELECT * 
    FROM cv_projects
    WHERE user_id = ?
  `;

  connection.query(query, [user_id], (err, results) => {
    if (err) return callback(err);
    callback(null, results);
  });
};

// Get project by id
const getProjectById = ({ id }, callback) => {
  const query = "SELECT * FROM cv_projects WHERE id = ?";

  connection.query(query, [id], (err, results) => {
    if (err) return callback(err);
    callback(null, results);
  });
};

// Add new project
const addProject = ({ user_id, ProjectTitle, role, projectDescription, skillsUsed, projectLink }, callback) => {
  const insertQuery = `
    INSERT INTO cv_projects (user_id, project_title, role, project_description, skills_used, project_link)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  connection.query(
    insertQuery,
    [user_id, ProjectTitle, role, projectDescription, skillsUsed, projectLink],
    (err, result) => {
      if (err) return callback(err);

      const insertedId = result.insertId;

      // Fetch the inserted record
      const fetchQuery = `SELECT * FROM cv_projects WHERE id = ?`;
      connection.query(fetchQuery, [insertedId], (fetchErr, rows) => {
        if (fetchErr) return callback(fetchErr);
        callback(null, rows[0]);
      });
    }
  );
};

// Update project by id
const updateProject = ({ id, ProjectTitle, role, projectDescription, skillsUsed, projectLink }, callback) => {
  const updateQuery = `
    UPDATE cv_projects
    SET project_title = ?, role = ?, project_description = ?, skills_used = ?, project_link = ?
    WHERE id = ?
  `;

  connection.query(
    updateQuery,
    [ProjectTitle, role, projectDescription, skillsUsed, projectLink, id],
    (err, result) => {
      if (err) return callback(err);

      // Fetch the updated record
      const fetchQuery = `SELECT * FROM cv_projects WHERE id = ?`;
      connection.query(fetchQuery, [id], (fetchErr, rows) => {
        if (fetchErr) return callback(fetchErr);
        callback(null, rows[0]);
      });
    }
  );
};

// Delete project by id
const deleteProject = ({ id }, callback) => {
  const query = "DELETE FROM cv_projects WHERE id = ?";

  connection.query(query, [id], (err, result) => {
    if (err) return callback(err);
    callback(null, { msg: "projects record deleted successfully" });
  });
};

module.exports = {
  createProjectsTable,
  getProjectsByUserId,
  getProjectById,
  addProject,
  updateProject,
  deleteProject,
};
