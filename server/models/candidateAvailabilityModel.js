// models/candidateAvailabilityModel.js
const connection = require("../connection");

const createCandidateAvailabilityTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS candidate_availability (
      id INT AUTO_INCREMENT PRIMARY KEY,
      candidate_id INT NOT NULL,
      day ENUM('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'),
      shift ENUM('morning','evening', 'night'),
      startTime TIME,
      endTime TIME,
      FOREIGN KEY (candidate_id) REFERENCES candidate_info(id) ON DELETE CASCADE
    );
  `;
  connection.query(sql, (err) => {
    if (err) return console.error(err.message);
    console.log("Candidate availability table created successfully");
  });
};

const addavailability = (req, res) => {
  const account_id = req.user.userId; // ✅ get account id from JWT
  const availabilityData = req.body.availability;

  if (!availabilityData || !Array.isArray(availabilityData) || availabilityData.length === 0) {
    return res.status(400).json({ success: false, message: "No availability data provided" });
  }

  // Step 1: fetch candidate_id from candidate_info
  const candidateQuery = `SELECT id FROM candidate_info WHERE account_id = ?`;
  connection.query(candidateQuery, [account_id], (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    if (!result.length) return res.status(404).json({ success: false, message: "Candidate not found" });

    const candidateId = result[0].id;

    console.log("✅ Candidate ID:", candidateId);

    // Step 2: validate and flatten availability
    const validDays = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
    const validShifts = ['morning','evening','night'];
    const values = [];

    availabilityData.forEach((item, index) => {
      const shiftValue = (Array.isArray(item.shift) ? item.shift[0] : item.shift || '').trim();
      const startTime = item.start_time || null;
      const endTime = item.end_time || null;

      if (!validShifts.includes(shiftValue)) {
        console.warn(`⚠️ Invalid shift at index ${index}:`, shiftValue);
        return; // skip invalid
      }

      (item.day || []).forEach((singleDayRaw, dayIndex) => {
        const dayValue = (singleDayRaw || '').trim();
        if (!validDays.includes(dayValue)) {
          console.warn(`⚠️ Invalid day at index ${index}, dayIndex ${dayIndex}:`, dayValue);
          return;
        }

        // 🔹 Push the cleaned row
        values.push([
          candidateId,
          dayValue,
          shiftValue,
          startTime,
          endTime
        ]);
      });
    });

    // Step 2a: Log exactly what will be inserted
    console.log("Prepared rows for insert:", values);

    if (values.length === 0) {
      return res.status(400).json({ success: false, message: "No valid availability rows to insert" });
    }

    // Step 3: insert into DB
    const insertQuery = `
      INSERT INTO candidate_availability
      (candidate_id, day, shift, startTime, endTime) VALUES ?
    `;
    connection.query(insertQuery, [values], (err, result) => {
      if (err) {
        console.error("❌ Error inserting availability data:", err);
        return res.status(500).json({ success: false, error: err.message });
      }
      res.json({ success: true, message: `Inserted ${result.affectedRows} availability rows` });
    });
  });
};

module.exports = {
  createCandidateAvailabilityTable,
  addavailability,
};