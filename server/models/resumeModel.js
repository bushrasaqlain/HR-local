const express = require("express");
const router = express.Router();
const connection = require("../connection");
const authMiddleware = require("../middleware/auth");
const logAudit = require("../utils/auditLogger");



const addResume = (req, res) => {
  const userId = req.user.userId;

  if (!req.file) {
    return res.status(400).json({ msg: "File data is missing" });
  }

  const fileBuffer = req.file.buffer;

  const query = `
    UPDATE candidate_info
    SET resume = ?
    WHERE account_id = ?
  `;

  connection.query(query, [fileBuffer, userId], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ msg: "SERVER_ERROR" });
    }

    res.status(200).json({
      msg: "Resume uploaded successfully"
    });
  });
};


module.exports = {
    addResume
}