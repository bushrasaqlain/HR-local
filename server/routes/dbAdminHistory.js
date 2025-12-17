const express = require("express");
const router = express.Router();
const connection = require("../connection");

//create the history table in the database
const createDbAdminHistoryTable = () => {
const createTableQuery = `
    CREATE TABLE IF NOT EXISTS dbadminhistory (
        id INT AUTO_INCREMENT PRIMARY KEY,
        entity_type VARCHAR(50) NOT NULL,
        entity_id INT NOT NULL,
        action ENUM('ADDED','ACTIVE', 'UPDATED', 'INACTIVE') NOT NULL,
        data JSON NOT NULL,
        changed_by INT NOT NULL,
        changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
`;

connection.query(createTableQuery, function (err, results, fields) {
    if(err) {
        return console.error(err.message);
    } 
    console.log("database admin history table created successfully.");
});
}

router.get('/dbadminhistory', (req, res) => {
  const { entity_type, entity_id } = req.query;

  if (!entity_id || !entity_type) {
    return res.status(400).json({ error: "entity_type and entity_id are required" });
  }

  const query = `
    SELECT h.*, u.username AS changed_by_name
    FROM dbadminhistory h
    LEFT JOIN account u ON h.changed_by = u.id
    WHERE h.entity_type = ? AND h.entity_id = ?
  `;

  connection.query(query, [entity_type, entity_id], (err, results) => {
    if (err) {
      console.error("❌ Error fetching db history:", err);
      return res.status(500).json({ error: "Database error" });
    }

    return res.status(200).json(results);
  });
});


router.post("/dbadminhistory", (req, res) => {
    const {entity_type, entity_id, action, data, changed_by } = req.query;
    if(!entity_type || !entity_id || !action || !data || !changed_by) {
        return res.status(400).json({error: "entity_type, id, actions are required."})
    }
    const query = `INSERT INTO dbadminhistory (entity_type, entity_id, action, data, changed_by) VALUES (?,?,?,?,?)`;
     connection.query(query, [entity_type, entity_id, action, JSON.stringify(data), changed_by], (err, results) => {
        if(err) {
            console.error("error inserting db history", err);
            return res.status(500).json({error: "database error"})
        }
        return res.status(201).json({message: "data inserted successfully", id: results.insertId});
    })
})

module.exports = router;