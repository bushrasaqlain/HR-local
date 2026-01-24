const connection = require("../connection");

const createEducationTable = () => {
  const cv_education = `
    CREATE TABLE IF NOT EXISTS candidate_education (
      id INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
      user_id INT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES account(id),
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

  connection.query(cv_education, (err, results) => {
    if (err) {
      console.error("Error creating Education table:", err.message);
    } else {
      console.log("Education table created successfully");
    }
  });
};

const getEducationByUserId = ({ user_id }, callback) => {
  const query = `
    SELECT ed.*,
    d.name AS degree_title
    FROM cv_education ed 
    LEFT JOIN degreetypes d ON ed.degree_title_id = d.id
    WHERE user_id = ?
  `;

  connection.query(query, [user_id], (err, results) => {
    if (err) return callback(err);
    callback(null, results);
  });
};

const getEducationById = ({ id }, callback) => {
  const query = `
    SELECT ed.*,
    d.name AS degree_title
    FROM cv_education ed 
    LEFT JOIN degreetypes d ON ed.degree_title_id = d.id
    WHERE ed.id = ?
  `;

  connection.query(query, [id], (err, results) => {
    if (err) return callback(err);
    callback(null, results);
  });
};


const addEducation = ({ user_id, degreeTitle, instituteName, startDate, endDate, educationDescription }, callback) => {
  const insertQuery = `
    INSERT INTO cv_education (user_id, degree_title_id, institute_name, start_date, end_date, education_description)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  connection.query(
    insertQuery,
    [user_id, degreeTitle, instituteName, startDate, endDate, educationDescription],
    (err, result) => {
      if (err) return callback(err);

      const insertedId = result.insertId;

      // Fetch the newly inserted record
      const fetchQuery = "SELECT * FROM cv_education WHERE id = ?";
      connection.query(fetchQuery, [insertedId], (fetchErr, rows) => {
        if (fetchErr) return callback(fetchErr);
        callback(null, rows[0]);
      });
    }
  );
};


const updateEducation = ({ id, degreeTitle, instituteName, startDate, endDate, educationDescription }, callback) => {
  const updateQuery = `
    UPDATE cv_education
    SET degree_title_id = ?, institute_name = ?, start_date = ?, end_date = ?, education_description = ?
    WHERE id = ?
  `;

  connection.query(
    updateQuery,
    [degreeTitle, instituteName, startDate, endDate, educationDescription, id],
    (err, result) => {
      if (err) return callback(err);

      if (result.affectedRows === 0) {
        return callback({ status: 404, message: "Education record not found" });
      }


      const fetchQuery = `
        SELECT ed.*,
        d.name AS degree_title
        FROM cv_education ed 
        LEFT JOIN degreetypes d ON ed.degree_title_id = d.id
        WHERE ed.id = ?
      `;
      connection.query(fetchQuery, [id], (fetchErr, rows) => {
        if (fetchErr) return callback(fetchErr);
        callback(null, rows[0]);
      });
    }
  );
};


const deleteEducation = ({ id }, callback) => {
  const query = "DELETE FROM cv_education WHERE id = ?";

  connection.query(query, [id], (err, result) => {
    if (err) return callback(err);
    callback(null, { msg: "Education record deleted successfully" });
  });
};

module.exports = {
  createEducationTable,
  getEducationByUserId,
  getEducationById,
  addEducation,
  updateEducation,
  deleteEducation,
};