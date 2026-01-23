const express = require("express");
const router = express.Router();
const connection = require("../connection");
const authMiddleware = require("../middleware/auth");

const createCandidateAvailabilityTable = () => {
    const createAvailiabilityTable = `
    CREATE TABLE candidate_availability (
      id INT AUTO_INCREMENT PRIMARY KEY,
      candidate_id INT,
      day ENUM('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'),
      shift ENUM('Day Shift','Night Shift', 'Both'),
      startTime TIME,
      endTime TIME,
      FOREIGN KEY (candidate_id) REFERENCES candidate_info(id) ON DELETE CASCADE
    );
      `;
    
    // Execute the queries to create the tables
    connection.query(createAvailiabilityTable, function (err, results, fields) {
      if (err) {
        return console.error(err.message);
      }
      console.log("Candidate Availiablitiy table created successfully");
    });
}

const addAvailaibility = (req, res) => {
  const availabilityData = req.body;
  const values = availabilityData.map(item => [
    item.accountId,
    item.day,
    item.shift,
    item.startTime,
    item.endTime 
  ]);
  const sql = `
    INSERT INTO candidate_availability (accountId, day, shift, startTime, endTime) VALUES ?
    `;
  connection.query(sql, [values], (err, result) => {
    if (err) {
      console.error("Error inserting availability data:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true, message: "Availability data saved successfully" });
  });
}

module.exports = {
    createCandidateAvailabilityTable,
    addAvailaibility
};