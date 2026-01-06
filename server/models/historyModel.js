const express = require("express");
const router = express.Router();
const connection = require("../connection");

const createHistoryTable = () => {
    const createTableQuery = `
    CREATE TABLE IF NOT EXISTS history (
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
        if (err) {
            return console.error(err.message);
        }
        console.log("history table created successfully.");
    });
}

const getHistory = (req, res) => {
    const { entity_type } = req.params;   
    const entity_id = req.params.id;      

    if (!entity_id || !entity_type) {
        return res.status(400).json({ error: "entity_type and entity_id are required" });
    }

    const query = `SELECT h.*, u.username AS changed_by_name FROM history h
                   LEFT JOIN account u ON h.changed_by = u.id
                   WHERE h.entity_type = ? AND h.entity_id = ?`;

    connection.query(query, [entity_type, entity_id], async (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });

        // Fetch mapping tables separately
        const [cities, countries, districts, businessTypes] = await Promise.all([
            getLookupMap("cities"), 
            getLookupMap("countries"), 
            getLookupMap("districts"), 
            getLookupMap("business_entity_type")
        ]);

        // Replace IDs with names
        results.forEach(item => {
            if(item.data) {
                item.data.city = cities[item.data.city] || item.data.city;
                item.data.country = countries[item.data.country] || item.data.country;
                item.data.district = districts[item.data.district] || item.data.district;
                item.data.Business_entity_type = businessTypes[item.data.Business_entity_type] || item.data.Business_entity_type;
            }
        });

        return res.status(200).json({ history: results });
    });
};

// Generic function to get mapping {id: name} from a table
function getLookupMap(table) {
    return new Promise((resolve, reject) => {
        connection.query(`SELECT id, name FROM ${table}`, (err, results) => {
            if(err) return reject(err);
            const map = {};
            results.forEach(r => map[r.id] = r.name);
            resolve(map);
        });
    });
}


const addhistory = (req, res) => {
    const { entity_type, entity_id, action, data, changed_by } = req.query;
    if (!entity_type || !entity_id || !action || !data || !changed_by) {
        return res.status(400).json({ error: "entity_type, id, actions are required." })
    }
    const query = `INSERT INTO history (entity_type, entity_id, action, data, changed_by) VALUES (?,?,?,?,?)`;
    connection.query(query, [entity_type, entity_id, action, JSON.stringify(data), changed_by], (err, results) => {
        if (err) {
            console.error("error inserting history", err);
            return res.status(500).json({ error: "database error" })
        }
        return res.status(201).json({ message: "data inserted successfully", id: results.insertId });
    })
}
module.exports = {
    createHistoryTable,
    getHistory,
    addhistory
}