const connection = require("../connection");
const logAudit = require("../utils/auditLogger");

// Create table with unique constraint on candidate + company + designation + start_date
const createExperienceTable = () => {
  const ExperienceTable = `
    CREATE TABLE IF NOT EXISTS candidate_experience (
        id INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
        candidate_id INT NOT NULL,
        speciality_id INT NULL,
        company_name VARCHAR(255) NOT NULL,
        designation VARCHAR(255) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE,
        is_ongoing BOOLEAN NOT NULL DEFAULT FALSE,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (candidate_id) REFERENCES candidate_info(id),
        FOREIGN KEY (speciality_id) REFERENCES speciality(id),
        UNIQUE KEY uniq_candidate_company_designation_start (candidate_id, company_name, designation, start_date)
    );
  `;

  connection.query(ExperienceTable, function (err) {
    if (err) {
      console.error("Error creating Experience table:", err.message);
    } else {
      console.log("Experience table created successfully");
    }
  });
};

// Add candidate experience (duplicates ignored)
const addcandidateExperience = (req, res) => {
  const account_id = req.user.userId;
  const experiences = req.body.experience;

  if (!Array.isArray(experiences)) {
    return res.status(400).json({ msg: "Invalid payload" });
  }

  const cleanExperiences = experiences.filter(
    e => e.companyName && e.designation && e.startDate
  );

  const candidateQuery = `SELECT id FROM candidate_info WHERE account_id = ?`;

  connection.query(candidateQuery, [account_id], (err, result) => {
    if (err) return res.status(500).json({ msg: "SERVER_ERROR" });
    if (!result.length) return res.status(404).json({ msg: "Candidate not found" });

    const candidate_id = result[0].id;

    const values = cleanExperiences.map(e => [
      candidate_id,
      e.speciality_id || null, // <-- speciality added
      e.companyName,
      e.designation,
      e.startDate,
      e.ongoing ? null : e.endDate,
      !!e.ongoing
    ]);

    const insertQuery = `
      INSERT IGNORE INTO candidate_experience
      (candidate_id, speciality_id, company_name, designation, start_date, end_date, is_ongoing)
      VALUES ?
    `;

    connection.query(insertQuery, [values], (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ msg: "SERVER_ERROR" });
      }
      res.json({ msg: "Experience saved (duplicates ignored)" });
    });
  });
};

// Update candidate experience
const updatecandidateExperience = (req, res) => {
  const { companyName, designation, startDate, endDate, ongoing } = req.body;
  const id = req.params.id;

  const query = `
    UPDATE candidate_experience
    SET
      company_name = ?,
      designation = ?,
      start_date = ?,
      end_date = ?,
      is_ongoing = ?
      speciality_id = ? -- update speciality
    WHERE id = ?
  `;

  connection.query(
    query,
    [
      companyName,
      designation,
      startDate,
      ongoing ? null : endDate,
      !!ongoing,
      speciality_id || null,
      id,
    ],
    (err, result) => {
      if (err) return res.status(500).json({ msg: "SERVER_ERROR" });
      if (result.affectedRows === 0) {
        return res.status(404).json({ msg: "Experience not found" });
      }
      res.json({ msg: "Experience updated" });
    }
  );
};

// Get all experiences for candidate
const getcandidateExperience = (req, callback) => {
  const account_id = req.user.userId;

  const sql = `
    SELECT exp.*, exp.speciality_id
    FROM candidate_experience exp
    INNER JOIN candidate_info ci ON ci.id = exp.candidate_id
    WHERE ci.account_id = ?
  `;

  connection.query(sql, [account_id], (err, results) => {
    if (err) return callback(err);
    callback(null, { success: true, data: results });
  });
};

// Delete experience
const deletecandidateExperience = (req, res) => {
  const workExperienceId = req.params.id;
  const query = 'DELETE FROM candidate_experience WHERE id = ?';

  connection.query(query, [workExperienceId], (err, result) => {
    if (err) {
      console.error('Error deleting work experience:', err.message);
      res.status(500).send({ msg: 'SERVER_ERROR' });
    } else {
      res.status(200).send({ msg: 'Work experience deleted successfully' });
    }
  });
};

module.exports = {
  createExperienceTable,
  addcandidateExperience,
  updatecandidateExperience,
  getcandidateExperience,
  deletecandidateExperience
};