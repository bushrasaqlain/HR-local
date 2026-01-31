const connection = require("../connection");
const path = require("path");

const addResume = (req, res) => {
  const userId = req.user.userId;

  if (!req.file) {
    return res.status(400).json({ msg: "File data is missing" });
  }

  const resumePath = `/uploads/resume/${req.file.filename}`;

  const query = `UPDATE candidate_info SET resume = ? WHERE account_id = ?`;

  connection.query(query, [resumePath, userId], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ msg: "SERVER_ERROR" });
    }

    res.status(200).json({
      msg: "Resume uploaded successfully",
      resume: resumePath,
    });
  });
};

const getResume = (req, res) => {
  const userId = req.user.userId;

  const query = `SELECT resume FROM candidate_info WHERE account_id = ?`;

  connection.query(query, [userId], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ msg: "SERVER_ERROR" });
    }

    if (!result.length || !result[0].resume) {
      return res.status(404).json({ msg: "RESUME_NOT_FOUND" });
    }

    const resumePath = path.join(__dirname, "..", result[0].resume);

    res.setHeader("Content-Type", "application/pdf"); // adjust if needed
    res.setHeader("Content-Disposition", "inline; filename=resume.pdf");

    res.sendFile(resumePath);
  });
};

module.exports = { addResume, getResume };