const connection = require("../connection");
const logAudit = require("../utils/auditLogger");

// Helper to validate at least one of title or file exists
const hasTitleAndFile = (title, filePath) => {
  return Boolean(title && title.trim() !== "" && filePath);
};

// ----------------- Create Certificates Table -----------------
const createCertificatesTable = () => {
  const CertificatesTable = `
CREATE TABLE IF NOT EXISTS candidate_certificates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    candidate_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
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

  connection.query(CertificatesTable, function (err) {
    if (err) {
      console.error("Error creating Certificates table:", err.message);
    } else {
      console.log("Certificates table created successfully");
    }
  });
};

// ----------------- Add Candidate Certificate -----------------
const addcandidateCertificate = (req, res) => {
  const account_id = req.user.userId;
  const { title } = req.body;
  const file = req.file || null;

  if (!title) {
    return res.status(400).json({ msg: "Certificate title is required" });
  }

  if (!hasTitleAndFile(title, file)) {
    return res.status(400).json({
      msg: "Please provide at least one: certificate title or file",
    });
  }

  const candidateQuery = `SELECT id FROM candidate_info WHERE account_id = ?`;

  connection.query(candidateQuery, [account_id], (err, result) => {
    if (err) return res.status(500).json({ msg: "SERVER_ERROR" });
    if (!result.length)
      return res.status(404).json({ msg: "Candidate not found" });

    const candidate_id = result[0].id;

    const insertQuery = `
      INSERT INTO candidate_certificates
      (candidate_id, title, document_path, document_name, document_type)
      VALUES (?, ?, ?, ?, ?)
    `;

    connection.query(
      insertQuery,
      [
        candidate_id,
        title,
        file ? file.path : null,
        file ? file.originalname : null,
        file ? file.mimetype : null,
      ],
      (err, insertResult) => {
        if (err) return res.status(500).json({ msg: "SERVER_ERROR" });

        // Audit log
        logAudit({
          tableName: "candidate_certificates",
          entityType: "candidate",
          entityId: candidate_id,
          action: "CREATED",
          data: {
            certificate_id: insertResult.insertId,
            title,
          },
          changedBy: account_id,
        });

        res.status(201).json({
          msg: "Certificate created successfully",
          id: insertResult.insertId,
        });
      }
    );
  });
};

// ----------------- Update Candidate Certificate -----------------
const editcandidateCertificate = (req, res) => {
  const { id } = req.params;
  const { title } = req.body;
  const file = req.file || null; // file may be null
  const account_id = req.user.userId;

  const selectQuery = `SELECT * FROM candidate_certificates WHERE id = ?`;

  connection.query(selectQuery, [id], (err, rows) => {
    if (err) return res.status(500).json({ msg: "SERVER_ERROR" });
    if (!rows.length) return res.status(404).json({ msg: "Certificate not found" });

    const existing = rows[0];

    // Use new title if provided, else existing
    const finalTitle = title || existing.title;

    // Use new file if provided, else existing
    const finalPath = file ? file.path : existing.document_path;
    const finalName = file ? file.originalname : existing.document_name;
    const finalType = file ? file.mimetype : existing.document_type;

    // Validate at least title or file exists
    if (!finalTitle && !finalPath) {
      return res.status(400).json({ msg: "Provide at least title or file" });
    }

    // // Save history
    // const historyQuery = `
    //   INSERT INTO candidate_certificates
    //   (certificate_id, candidate_id, title, document_path, document_name, document_type, action)
    //   VALUES (?, ?, ?, ?, ?, ?, 'UPDATE')
    // `;
    // connection.query(historyQuery, [
    //   existing.id,
    //   existing.candidate_id,
    //   existing.title,
    //   existing.document_path,
    //   existing.document_name,
    //   existing.document_type,
    // ]);

    // Update certificate
    const updateQuery = `
      UPDATE candidate_certificates
      SET title = ?, document_path = ?, document_name = ?, document_type = ?
      WHERE id = ?
    `;

    connection.query(
      updateQuery,
      [finalTitle, finalPath, finalName, finalType, id],
      (err) => {
        if (err) {
          console.error("DB Update Error:", err); // <-- log actual error
          return res.status(500).json({ msg: "SERVER_ERROR" });
        }

        // Audit log
        logAudit({
          tableName: "candidate_certificates",
          entityType: "candidate",
          entityId: existing.candidate_id,
          action: "UPDATED",
          data: { certificate_id: id, title: finalTitle },
          changedBy: account_id,
        });

        res.json({ msg: "Certificate updated successfully" });
      }
    );
  });
};


// ----------------- Get Candidate Certificates -----------------
const getcandidateCertificate = (req, callback) => {
  const account_id = req.user.userId;

  const sql = `
    SELECT c.*
    FROM candidate_certificates c
    JOIN candidate_info ci ON c.candidate_id = ci.id
    WHERE ci.account_id = ?
    ORDER BY c.created_at DESC
  `;

  connection.query(sql, [account_id], (err, results) => {
    if (err) return callback(err);
    callback(null, { success: true, data: results });
  });
};

// ----------------- Delete Candidate Certificate -----------------
const deletecandidateCertificate = (req, res) => {
  const { id } = req.params;
  const account_id = req.user.userId;

  const selectQuery = `SELECT * FROM candidate_certificates WHERE id = ?`;

  connection.query(selectQuery, [id], (err, rows) => {
    if (err) return res.status(500).json({ msg: "SERVER_ERROR" });
    if (!rows.length)
      return res.status(404).json({ msg: "Certificate not found" });

    const certificate = rows[0];

    // Save history
    const historyQuery = `
      INSERT INTO candidate_certificates_history
      (certificate_id, candidate_id, title, document_path, document_name, document_type, action)
      VALUES (?, ?, ?, ?, ?, ?, 'DELETE')
    `;

    connection.query(historyQuery, [
      certificate.id,
      certificate.candidate_id,
      certificate.title,
      certificate.document_path,
      certificate.document_name,
      certificate.document_type,
    ]);

    // Delete certificate
    connection.query(
      `DELETE FROM candidate_certificates WHERE id = ?`,
      [id],
      (err) => {
        if (err) return res.status(500).json({ msg: "SERVER_ERROR" });

        // Audit log
        logAudit({
          tableName: "candidate_certificates",
          entityType: "candidate",
          entityId: certificate.candidate_id,
          action: "DELETED",
          data: {
            certificate_id: id,
            title: certificate.title,
          },
          changedBy: account_id,
        });

        res.json({ msg: "Certificate deleted successfully" });
      }
    );
  });
};

module.exports = {
  createCertificatesTable,
  addcandidateCertificate,
  editcandidateCertificate,
  getcandidateCertificate,
  deletecandidateCertificate,
};
