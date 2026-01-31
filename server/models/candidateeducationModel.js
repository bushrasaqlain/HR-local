const connection = require("../connection");
const logAudit = require("../utils/auditLogger");

const createEducationTable = () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS candidate_education (
      id INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
      candidate_id INT NOT NULL,
      degree_id INT NOT NULL,
      institute_id INT NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE,
      is_ongoing BOOLEAN NOT NULL DEFAULT FALSE,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (candidate_id) REFERENCES candidate_info(id) ON DELETE CASCADE,
      FOREIGN KEY (degree_id) REFERENCES degreefields(id),
      FOREIGN KEY (institute_id) REFERENCES institute(id) ON DELETE CASCADE
    );
  `;

  connection.query(createTableQuery, (err) => {
    if (err) {
      console.error("❌ Error creating candidate_education table:", err.message);
    } else {
      console.log("✅ candidate_education table created successfully");
    }
  });
};

const getallcandidateeducation = (req, callback) => {
  const user_id = req.user.userId;

  const sql = `
    SELECT 
      ed.id,
      ed.candidate_id,
      ed.is_ongoing,
      ed.start_date,
      ed.end_date,
      d.id AS degree_id,
      d.name AS degreetype,
      df.id AS degreefield_id,
      df.name AS degreefield,
      ins.name AS institute,
      ins.id AS institute_id
    FROM candidate_education ed
    INNER JOIN candidate_info ci 
      ON ci.id = ed.candidate_id
    LEFT JOIN institute ins
      ON ins.id = ed.institute_id
    LEFT JOIN degreefields df 
      ON ed.degree_id = df.id
    LEFT JOIN degreetypes d 
      ON df.degree_type_id = d.id
    WHERE ci.account_id = ?
  `;

  connection.query(sql, [user_id], (err, results) => {
    if (err) {
      console.error("❌ Model Error (getallcandidateeducation):", err);
      return callback(err, null);
    }
    callback(null, results);
  });
};


const addcandidateeducation = (req, res) => {
  const account_id = req.user.userId;
  let { education, mode } = req.body;

  if (typeof education === "string") {
    education = JSON.parse(education);
  }

  if (!Array.isArray(education)) {
    return res.status(400).json({ msg: "Invalid education payload" });
  }

  // ✅ HARD FILTER — backend must protect itself
  const cleanEducation = education.filter(
    (edu) =>
      edu.degreeTitle &&
      edu.institutes &&
      edu.startDate &&
      String(edu.startDate).trim() !== ""
  );

  // submit mode requires at least one valid entry
  if (mode === "submit" && cleanEducation.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Profile incomplete. Education data missing",
    });
  }

  // nothing new to insert → silently succeed
  if (cleanEducation.length === 0) {
    return res.status(200).json({ msg: "Nothing to insert" });
  }

  const candidateQuery = `SELECT id FROM candidate_info WHERE account_id = ?`;

  connection.query(candidateQuery, [account_id], (err, result) => {
    if (err) return res.status(500).json({ msg: "SERVER_ERROR" });
    if (!result.length) return res.status(404).json({ msg: "Candidate not found" });

    const candidate_id = result[0].id;

    const insertQuery = `
      INSERT INTO candidate_education
      (candidate_id, degree_id, institute_id, start_date, end_date, is_ongoing)
      VALUES ?
    `;

    const values = cleanEducation.map((edu) => [
      candidate_id,
      edu.degreeTitle,
      edu.institutes,
      edu.startDate,
      edu.ongoing ? null : edu.endDate,
      !!edu.ongoing,
    ]);

    connection.query(insertQuery, [values], (err, result) => {
      if (err) {
        console.error("Education insert error:", err);
        return res.status(500).json({ msg: "SERVER_ERROR" });
      }

      res.status(200).json({
        msg: "Education saved successfully",
        inserted: result.affectedRows,
      });
    });
  });
};

const editcandidateeducation = (req, res) => {
  const { education, mode } = req.body;
  let educationArray = education;
  if (typeof education === "string") {
    educationArray = JSON.parse(education);
  }

  if (!Array.isArray(educationArray) || educationArray.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Profile incomplete. Education data missing",
    });
  }

  // Use async updates for each education
  const updatePromises = educationArray.map((edu) => {
    return new Promise((resolve, reject) => {
      const updateQuery = `
        UPDATE candidate_education
        SET degree_id = ?, institute_id = ?, start_date = ?, end_date = ?, is_ongoing = ?
        WHERE id = ?
      `;
      const values = [
        edu.degreeTitle && Number(edu.degreeTitle) > 0 ? Number(edu.degreeTitle) : null,
        edu.institutes && Number(edu.institutes) > 0 ? Number(edu.institutes) : null,
        edu.startDate || null,
        edu.ongoing ? null : edu.endDate,
        edu.ongoing ? 1 : 0,
        edu.id
      ];

      if (!values[0] || !values[1]) {
        return reject(new Error("degree_id or institute_id is invalid or missing"));
      }


      connection.query(updateQuery, values, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  });

  Promise.all(updatePromises)
    .then(() => {
      res.status(200).json({ success: true, message: "All education records updated" });
    })
    .catch((err) => {
      console.error("Error updating education records:", err.message);
      res.status(500).json({ msg: "SERVER_ERROR" });
    });
};


const deletecandidateeducation = (req, res) => {
  const educationId = req.params.id;

  const query = 'DELETE FROM candidate_education WHERE id = ?';

  connection.query(query, [educationId], (err, result) => {
    if (err) {
      console.error('Error deleting education record:', err.message);
      res.status(500).send({ msg: 'SERVER_ERROR' });
    } else {
      res.status(200).send({ msg: 'Education record deleted successfully' });
    }
  });
};

module.exports = {
  createEducationTable,
  addcandidateeducation,
  editcandidateeducation,
  getallcandidateeducation,
  deletecandidateeducation,
};
