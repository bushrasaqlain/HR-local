const connection = require("../connection");

// ===================== CREATE TABLE =====================
const createCandidateAvailabilityTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS candidate_availability (
      id INT AUTO_INCREMENT PRIMARY KEY,
      candidate_id INT NOT NULL,
      day ENUM('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'),
      shift ENUM('morning','evening','night'),
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

// ===================== ADD AVAILABILITY =====================

const ALL_DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const ALL_SHIFT_TIMINGS = {
  morning: { startTime: '09:00', endTime: '17:00' },
  evening: { startTime: '15:00', endTime: '23:00' },
  night:   { startTime: '21:00', endTime: '06:00' },
};

const addavailability = (req, res) => {
  const account_id = req.user.userId;
  const availabilityData = req.body.availability;

  if (!availabilityData || !Array.isArray(availabilityData) || availabilityData.length === 0) {
    return res.status(400).json({ success: false, message: "No availability data provided" });
  }

  const candidateQuery = `SELECT id FROM candidate_info WHERE account_id = ?`;
  connection.query(candidateQuery, [account_id], (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    if (!result.length) return res.status(404).json({ success: false, message: "Candidate not found" });

    const candidateId = result[0].id;

    const validDays = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
    const validShifts = ['morning','evening','night'];
    const values = [];

    availabilityData.forEach((item) => {
      const rawDay = (Array.isArray(item.day) ? item.day[0] : item.day || '').trim();
      const rawShift = (Array.isArray(item.shift) ? item.shift[0] : item.shift || '').trim();

      // Expand shorthand "All Days" / "All Shifts" into real (day, shift) rows
      // the ENUM columns actually accept, using default per-shift timings
      // when the shorthand didn't carry explicit times.
      const daysToExpand = rawDay === 'All Days' ? ALL_DAYS : [rawDay];
      const shiftsToExpand = rawShift === 'All Shifts' ? Object.keys(ALL_SHIFT_TIMINGS) : [rawShift];

      daysToExpand.forEach((dayValue) => {
        if (!validDays.includes(dayValue)) return;

        shiftsToExpand.forEach((shiftValue) => {
          if (!validShifts.includes(shiftValue)) return;

          let startTime = item.startTime || null;
          let endTime = item.endTime || null;

          // If this row came from shorthand expansion and didn't bring its
          // own explicit times, fall back to the default timing for that shift.
          if (!startTime || !endTime) {
            const fallback = ALL_SHIFT_TIMINGS[shiftValue];
            if (fallback) {
              startTime = startTime || fallback.startTime;
              endTime = endTime || fallback.endTime;
            }
          }

          values.push([candidateId, dayValue, shiftValue, startTime, endTime]);
        });
      });
    });

    if (values.length === 0) {
      return res.status(400).json({ success: false, message: "No valid availability rows to insert" });
    }

    const insertQuery = `INSERT INTO candidate_availability (candidate_id, day, shift, startTime, endTime) VALUES ?`;
    connection.query(insertQuery, [values], (err, result) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true, message: `Inserted ${result.affectedRows} availability rows` });
    });
  });
};

// ===================== GET AVAILABILITY =====================
const getAvailability = (req, res) => {
  const account_id = req.user.userId;

  const candidateQuery = `SELECT id FROM candidate_info WHERE account_id = ?`;
  connection.query(candidateQuery, [account_id], (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    if (!result.length) return res.status(404).json({ success: false, message: "Candidate not found" });

    const candidateId = result[0].id;

    const selectQuery = `SELECT id, day, shift, startTime, endTime FROM candidate_availability WHERE candidate_id = ?`;
    connection.query(selectQuery, [candidateId], (err, rows) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true, data: rows });
    });
  });
};

// ===================== UPDATE AVAILABILITY =====================
const updateAvailability = (req, res) => {
  const rowId = req.params.id; // Get the row id from URL
  const { day, shift, startTime, endTime } = req.body;

  if (!day || !shift) {
    return res.status(400).json({ success: false, message: "Day and shift are required" });
  }

  const validDays = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  const validShifts = ['morning','evening','night'];

  if (!validDays.includes(day) || !validShifts.includes(shift)) {
    return res.status(400).json({ success: false, message: "Invalid day or shift" });
  }

  const sql = `
    UPDATE candidate_availability
    SET day = ?, shift = ?, startTime = ?, endTime = ?
    WHERE id = ?
  `;

  connection.query(sql, [day, shift, startTime, endTime, rowId], (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, message: "Availability updated", data: { id: rowId, day, shift, startTime, endTime } });
  });
};


module.exports = {
  createCandidateAvailabilityTable,
  addavailability,
  getAvailability,
  updateAvailability,
};
