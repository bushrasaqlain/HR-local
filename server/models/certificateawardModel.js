const connection = require("../connection");

// Create the certificate awards table
const createCertificateAwardTable = () => {
  const CertificateAwards = `
    CREATE TABLE IF NOT EXISTS CV_certificateAwards (
      id INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
      user_id INT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES account(id),
      title VARCHAR(255) NOT NULL,
      institute_name VARCHAR(255) NOT NULL,
      passing_year INT NOT NULL,
      description TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `;

  connection.query(CertificateAwards, (err, results) => {
    if (err) {
      console.error("Error creating CV_certificateAwards table:", err.message);
    } else {
      console.log("CV_certificateAwards table created successfully");
    }
  });
};

// Get all certificate awards by user_id
const getCertificateAwardsByUserId = ({ user_id }, callback) => {
  const query = "SELECT * FROM CV_certificateAwards WHERE user_id = ?";

  connection.query(query, [user_id], (err, results) => {
    if (err) return callback(err);
    callback(null, results);
  });
};

// Get certificate award by id
const getCertificateAwardById = ({ id }, callback) => {
  const query = "SELECT * FROM CV_certificateAwards WHERE id = ?";

  connection.query(query, [id], (err, results) => {
    if (err) return callback(err);
    callback(null, results);
  });
};

// Add new certificate award
const addCertificateAward = ({ user_id, title, instituteName, passingYear, description }, callback) => {
  const insertQuery = `
    INSERT INTO CV_certificateAwards (user_id, title, institute_name, passing_year, description)
    VALUES (?, ?, ?, ?, ?)
  `;

  connection.query(
    insertQuery,
    [user_id, title, instituteName, passingYear, description],
    (err, result) => {
      if (err) return callback(err);

      const insertedId = result.insertId;

      // Fetch the inserted record
      const fetchQuery = `SELECT * FROM CV_certificateAwards WHERE id = ?`;
      connection.query(fetchQuery, [insertedId], (fetchErr, rows) => {
        if (fetchErr) return callback(fetchErr);
        callback(null, rows[0]);
      });
    }
  );
};

// Update certificate award by id
const updateCertificateAward = ({ id, title, instituteName, passingYear, description }, callback) => {
  const updateQuery = `
    UPDATE CV_certificateAwards
    SET title = ?, institute_name = ?, passing_year = ?, description = ?
    WHERE id = ?
  `;

  connection.query(
    updateQuery,
    [title, instituteName, passingYear, description, id],
    (err, result) => {
      if (err) return callback(err);

      // Fetch the updated record
      const fetchQuery = `SELECT * FROM CV_certificateAwards WHERE id = ?`;
      connection.query(fetchQuery, [id], (fetchErr, rows) => {
        if (fetchErr) return callback(fetchErr);
        callback(null, rows[0]);
      });
    }
  );
};

// Delete certificate award by id
const deleteCertificateAward = ({ id }, callback) => {
  const query = "DELETE FROM CV_certificateAwards WHERE id = ?";

  connection.query(query, [id], (err, result) => {
    if (err) return callback(err);
    callback(null, { msg: "CertificateAwards record deleted successfully" });
  });
};

module.exports = {
  createCertificateAwardTable,
  getCertificateAwardsByUserId,
  getCertificateAwardById,
  addCertificateAward,
  updateCertificateAward,
  deleteCertificateAward,
};