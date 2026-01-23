const connection = require("../connection");
const logAudit = require("../utils/auditLogger");

const createExperienceTable = () => {
    const ExperienceTable = `
CREATE TABLE IF NOT EXISTS candidate_experience (
    id INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
    candidate_id INT NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    designation VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    is_ongoing BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (candidate_id) REFERENCES candidate_info(id)
  );
  
  `;

    // Execute the queries to create the tables
    connection.query(ExperienceTable, function (err, results, fields) {
        if (err) {
            console.error("Error creating Experience table:", err.message);
        } else {
            console.log("Experience table created successfully");
        }
    });
}

const addcandidateExperience = (req, res) => {
  const account_id = req.user.userId;
  const experiences = req.body.experience; // 👈 array

  if (!Array.isArray(experiences) || experiences.length === 0) {
    return res.status(400).json({ msg: "Experience data missing" });
  }

  const candidateQuery = `
    SELECT id FROM candidate_info WHERE account_id = ?
  `;

  connection.query(candidateQuery, [account_id], (err, candidateResult) => {
    if (err) {
      console.error("Candidate fetch error:", err);
      return res.status(500).json({ msg: "SERVER_ERROR" });
    }

    if (candidateResult.length === 0) {
      return res.status(400).json({ msg: "Candidate not found" });
    }

    const candidate_id = candidateResult[0].id;

    const insertQuery = `
      INSERT INTO candidate_experience
      (candidate_id, company_name, designation, start_date, end_date)
      VALUES ?
    `;

    const values = experiences.map(exp => [
      candidate_id,
      exp.companyName,
      exp.designation,
      exp.startDate,
      exp.ongoing ? null : exp.endDate
    ]);

    connection.query(insertQuery, [values], (err, result) => {
      if (err) {
        console.error("Error adding work experience:", err);
        return res.status(500).json({ msg: "SERVER_ERROR" });
      }

      res.status(200).json({
        msg: "Work experience added successfully",
        insertedRows: result.affectedRows
      });
    });
  });
};

const updatecandidateExperience = (req, res) => {
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
}

const getcandidateExperience = (req, callback) => {
    const account_id = req.user.userId;

    const sql = `
    SELECT exp.*
    FROM candidate_experience exp
    INNER JOIN candidate_info ci ON ci.id = exp.candidate_id
    WHERE ci.account_id = ?
  `;

    connection.query(sql, [account_id], (err, results) => {
        if (err) {
            return callback(err);
        }

        callback(null, {
            success: true,
            data: results
        });
    });
};

const deletecandidateExperience = (req, res) => {
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
}

module.exports = {
    createExperienceTable,
    addcandidateExperience,
    updatecandidateExperience,
    getcandidateExperience,
    deletecandidateExperience
}