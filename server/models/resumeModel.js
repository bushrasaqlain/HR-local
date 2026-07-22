const connection = require("../connection");
const path = require("path");
const fs = require("fs");

// ── UPLOAD CV (manual profile — no parsing) ──────────────────────────────
const uploadCV = async (req, res) => {
  const accountId = req.user?.userId;
  if (!accountId) return res.status(401).json({ error: "Unauthorized" });
  if (!req.file)  return res.status(400).json({ error: "No file uploaded" });

  const resumePath = `/uploads/resume/${req.file.filename}`;

  connection.query(
    `INSERT INTO candidate_info (account_id, resume, profile_completed)
     VALUES (?, ?, 0)
     ON DUPLICATE KEY UPDATE resume = VALUES(resume)`,
    [accountId, resumePath],
    (err) => {
      if (err) {
        console.error("candidate_info save error:", err.message);
        return res.status(500).json({ error: "Failed to save resume" });
      }
      return res.json({
        success: true,
        message: "Resume uploaded. Please fill in your profile details.",
      });
    }
  );
};

const addResume = (req, res) => {
  const userId = req.user?.userId;
  if (!req.file) return res.status(400).json({ msg: "File data is missing" });

  const resumePath = `/uploads/resume/${req.file.filename}`;

  connection.query(
    `UPDATE candidate_info SET resume = ? WHERE account_id = ?`,
    [resumePath, userId],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ msg: "SERVER_ERROR" });
      }
      if (result.affectedRows === 0) {
        connection.query(
          `INSERT INTO candidate_info (account_id, resume, profile_completed) VALUES (?, ?, 0)`,
          [userId, resumePath],
          (err2) => {
            if (err2) return res.status(500).json({ msg: "SERVER_ERROR" });
            return res.status(200).json({ msg: "Resume uploaded successfully", resume: resumePath });
          }
        );
        return;
      }
      return res.status(200).json({ msg: "Resume uploaded successfully", resume: resumePath });
    }
  );
};

const updateResume = (req, res) => {
  const userId = req.params.id;
  const file   = req.file;
  if (!file) return res.status(400).json({ msg: "No file uploaded" });

  const resumePath = `/uploads/resume/${file.filename}`;
  connection.query(
    `UPDATE candidate_info SET resume = ? WHERE account_id = ?`,
    [resumePath, userId],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ msg: "SERVER_ERROR" });
      }
      return res.status(200).json({ msg: "Resume updated successfully", resume: resumePath });
    }
  );
};

const getResume = (req, res) => {
  const userId = req.user?.userId;

  connection.query(
    `SELECT resume FROM candidate_info WHERE account_id = ?`,
    [userId],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ msg: "SERVER_ERROR" });
      }
      if (!result.length || !result[0].resume)
        return res.status(404).json({ msg: "RESUME_NOT_FOUND" });

      const resumePath = path.join(__dirname, "..", result[0].resume);
      if (!fs.existsSync(resumePath))
        return res.status(404).json({ msg: "FILE_NOT_FOUND_ON_DISK" });

      const ext = path.extname(result[0].resume).toLowerCase();
      const contentType =
        ext === ".pdf"
          ? "application/pdf"
          : ext === ".docx"
          ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          : "application/msword";

      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", `inline; filename=resume${ext}`);
      res.sendFile(resumePath);
    }
  );
};

module.exports = { uploadCV, addResume, updateResume, getResume };