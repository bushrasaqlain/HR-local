const connection = require("../connection");
const logAudit = require("../utils/auditLogger");

// Helper to validate at least one of link or file exists
const hasLinkOrFile = (link, file) => {
  return Boolean((link && link.trim() !== "") || file);
};
const createResearchTable = () => {
  const ResearchTable = `
CREATE TABLE IF NOT EXISTS candidate_research (
    id INT AUTO_INCREMENT PRIMARY KEY,

    candidate_id INT NOT NULL,

    research_title VARCHAR(255) NOT NULL,

    research_link VARCHAR(500) NULL,

    document_path VARCHAR(255) NULL,
    document_name VARCHAR(255) NULL,
    document_type VARCHAR(100) NULL,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (candidate_id)
        REFERENCES candidate_info(id)
        ON DELETE CASCADE
);
  `;

  connection.query(ResearchTable, function (err) {
    if (err) {
      console.error("Error creating Research table:", err.message);
    } else {
      console.log("Research table created successfully");
    }
  });
};
// ----------------- Add Candidate Research -----------------
const addcandidateResearch = (req, res) => {
  const account_id = req.user.userId;
  const { research_title, research_link } = req.body;
  const file = req.file || null;

  if (!research_title) {
    return res.status(400).json({ msg: "Research title is required" });
  }

  if (!hasLinkOrFile(research_link, file)) {
    return res.status(400).json({
      msg: "Please provide at least one: research link or document",
    });
  }

  const candidateQuery = `SELECT id FROM candidate_info WHERE account_id = ?`;

  connection.query(candidateQuery, [account_id], (err, result) => {
    if (err) return res.status(500).json({ msg: "SERVER_ERROR" });
    if (!result.length)
      return res.status(404).json({ msg: "Candidate not found" });

    const candidate_id = result[0].id;

    const insertQuery = `
      INSERT INTO candidate_research
      (candidate_id, research_title, research_link, document_path, document_name, document_type)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    connection.query(
      insertQuery,
      [
        candidate_id,
        research_title,
        research_link || null,
        file ? file.path : null,
        file ? file.originalname : null,
        file ? file.mimetype : null,
      ],
      (err, insertResult) => {
        if (err) return res.status(500).json({ msg: "SERVER_ERROR" });

        // Audit log
        logAudit({
          tableName: "candidate_research",
          entityType: "candidate",
          entityId: candidate_id,
          action: "CREATED",
          data: {
            research_id: insertResult.insertId,
            research_title,
          },
          changedBy: account_id,
        });

        res.status(201).json({
          msg: "Research created successfully",
          id: insertResult.insertId,
        });
      }
    );
  });
};

// ----------------- Update Candidate Research -----------------
const editcandidateResearch = (req, res) => {
  const { id } = req.params;
  const { research_title, research_link } = req.body;
  const file = req.file || null;
  const account_id = req.user.userId;

  const selectQuery = `SELECT * FROM candidate_research WHERE id = ?`;

  connection.query(selectQuery, [id], (err, rows) => {
    if (err) return res.status(500).json({ msg: "SERVER_ERROR" });
    if (!rows.length)
      return res.status(404).json({ msg: "Research not found" });

    const existing = rows[0];

    // Validate combined existing + new data
    const finalLink =
      research_link !== undefined ? research_link : existing.research_link;
    const finalFileExists = file || existing.document_path;

    if (!hasLinkOrFile(finalLink, finalFileExists)) {
      return res.status(400).json({
        msg: "Please provide at least one: research link or document",
      });
    }

    // // Save history
    // const historyQuery = `
    //   INSERT INTO candidate_research_history
    //   (research_id, candidate_id, research_title, research_link, document_path, document_name, document_type, action)
    //   VALUES (?, ?, ?, ?, ?, ?, ?, 'UPDATE')
    // `;

    // connection.query(historyQuery, [
    //   existing.id,
    //   existing.candidate_id,
    //   existing.research_title,
    //   existing.research_link,
    //   existing.document_path,
    //   existing.document_name,
    //   existing.document_type,
    // ]);

    // Update research
    const updateQuery = `
      UPDATE candidate_research
      SET research_title = ?, research_link = ?, document_path = ?, document_name = ?, document_type = ?
      WHERE id = ?
    `;

    connection.query(
      updateQuery,
      [
        research_title || existing.research_title,
        finalLink || null,
        file ? file.path : existing.document_path,
        file ? file.originalname : existing.document_name,
        file ? file.mimetype : existing.document_type,
        id,
      ],
      (err) => {
        if (err) return res.status(500).json({ msg: "SERVER_ERROR" });

        // Audit log
        logAudit({
          tableName: "candidate_research",
          entityType: "candidate",
          entityId: existing.candidate_id,
          action: "UPDATED",
          data: {
            research_id: id,
            research_title,
          },
          changedBy: account_id,
        });

        res.json({ msg: "Research updated successfully" });
      }
    );
  });
};

// ----------------- Get Candidate Research -----------------
const getcandidateResearch = (req, callback) => {
  const account_id = req.user.userId;

  const sql = `
    SELECT r.*
    FROM candidate_research r
    JOIN candidate_info c ON r.candidate_id = c.id
    WHERE c.account_id = ?
    ORDER BY r.created_at DESC
  `;

  connection.query(sql, [account_id], (err, results) => {
    if (err) return callback(err);
    callback(null, { success: true, data: results });
  });
};


// ----------------- Delete Candidate Research -----------------
const deletecandidateResearch = (req, res) => {
  const { id } = req.params;
  const account_id = req.user.userId;

  const selectQuery = `SELECT * FROM candidate_research WHERE id = ?`;

  connection.query(selectQuery, [id], (err, rows) => {
    if (err) return res.status(500).json({ msg: "SERVER_ERROR" });
    if (!rows.length)
      return res.status(404).json({ msg: "Research not found" });

    const research = rows[0];

    // Save history
    const historyQuery = `
      INSERT INTO candidate_research_history
      (research_id, candidate_id, research_title, research_link, document_path, document_name, document_type, action)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'DELETE')
    `;

    connection.query(historyQuery, [
      research.id,
      research.candidate_id,
      research.research_title,
      research.research_link,
      research.document_path,
      research.document_name,
      research.document_type,
    ]);

    // Delete research
    connection.query(
      `DELETE FROM candidate_research WHERE id = ?`,
      [id],
      (err) => {
        if (err) return res.status(500).json({ msg: "SERVER_ERROR" });

        // Audit log
        logAudit({
          tableName: "candidate_research",
          entityType: "candidate",
          entityId: research.candidate_id,
          action: "DELETED",
          data: {
            research_id: id,
            research_title: research.research_title,
          },
          changedBy: account_id,
        });

        res.json({ msg: "Research deleted successfully" });
      }
    );
  });
};

module.exports = {
  createResearchTable,
  addcandidateResearch,
  editcandidateResearch,
  getcandidateResearch,
  deletecandidateResearch,
};
