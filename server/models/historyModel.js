const express = require("express");
const router = express.Router();
const connection = require("../connection");

const createHistoryTable = () => {
    const createTableQuery = `
    CREATE TABLE IF NOT EXISTS history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        entity_type VARCHAR(50) NOT NULL,
        entity_id INT NOT NULL,
        action ENUM('ADDED',
                    'ACTIVE', 
                    'UPDATED',
                    'INACTIVE',
                    'CREATED',
                    'APPROVED',
                    'PAYMENT',
                    'PACKAGE_SUBSCRIBED',
                    'CANDIDATE_UNLOCKED',
                    'SHORTLISTED',
                    'CARD_SAVED') NOT NULL,
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

    const query = `SELECT h.*, 
               CASE 
                   WHEN u.accountType IN ('employer', 'candidate') THEN u.email
                   ELSE u.username
               END AS changed_by_name
               FROM history h
               LEFT JOIN account u ON h.changed_by = u.id
               WHERE h.entity_type = ? AND h.entity_id = ?`;

    connection.query(query, [entity_type, entity_id], async (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });

        // Fetch mapping tables separately
        const [
            cities,
            countries,
            districts,
            businessTypes,
            packages,
            jobs,
            companyPackages
        ] = await Promise.all([
            getLookupMap("cities"),
            getLookupMap("countries"),
            getLookupMap("districts"),
            getLookupMap("business_entity_type"),
            getLookupMap("packages"),
            getLookupMap("job_posts", "job_title"),
            getLookupMap("company_packages", "pricing_model")
        ]);

        // Replace IDs with names
        results.forEach(item => {
            if (!item.data) return;

            // location lookups
            item.data.city_name = cities[item.data.city] || null;
            item.data.country_name = countries[item.data.country] || null;
            item.data.district_name = districts[item.data.district] || null;
            item.data.business_type_name = businessTypes[item.data.business_type] || null;

            // job / package / subscription (NAMES ONLY)
            item.data.job_title =
                jobs[item.data.job_id] || null;

            item.data.package_name =
                packages[item.data.packageId] || null;

            item.data.company_package_info = companyPackages[item.data.company_package_id] || null;
        });
        results.forEach(item => {
            // Prefer explicit event from audit data
            if (item.data?.event) {
                item.readable_event = item.data.event;
                return;
            }

            // Fallbacks
            switch (item.action) {
                case "CREATED":
                case "ADDED":
                    item.readable_event =
                        entity_type === "job"
                            ? "Job created"
                            : entity_type === "employer"
                                ? "Employer created"
                                : "Record created";
                    break;

                case "UPDATED":
                    item.readable_event =
                        entity_type === "job"
                            ? "Job updated"
                            : entity_type === "employer"
                                ? "Employer updated"
                                : "Record updated";
                    break;

                case "ACTIVE":
                    item.readable_event = "Activated";
                    break;

                case "INACTIVE":
                    item.readable_event = "Deactivated";
                    break;

                case "APPROVED":
                    item.readable_event = "Approved";
                    break;

                case "PAYMENT":
                    item.readable_event = "Payment recorded";
                    break;

                case "PACKAGE_SUBSCRIBED":
                    item.readable_event = "Package subscribed";
                    break;

                case "CANDIDATE_UNLOCKED":
                    item.readable_event = "Candidate unlocked";
                    break;

                default:
                    item.readable_event = item.action || "History event";
            }
        });

        return res.status(200).json({ history: results });
    });
};

// Generic function to get mapping {id: name} from a table
// Before
// function getLookupMap(table) {
//     return new Promise((resolve, reject) => {
//         connection.query(`SELECT id, name FROM ${table}`, (err, results) => {
//             if (err) return reject(err);
//             const map = {};
//             results.forEach(r => map[r.id] = r.name);
//             resolve(map);
//         });
//     });
// }

// After
function getLookupMap(table, labelColumn = "name") {
    return new Promise((resolve, reject) => {
        connection.query(`SELECT id, ${labelColumn} AS name FROM ${table}`, (err, results) => {
            if (err) return reject(err);
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