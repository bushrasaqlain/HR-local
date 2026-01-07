const express = require("express");
const router = express.Router();
const connection = require("../connection");
const authMiddleware = require("../middleware/auth");
const checkRole = require("../middleware/checkRole");
const logAudit = require("../utils/auditLogger");

const createPackagesTable = () => {
  const packagetable = `
  CREATE TABLE IF NOT EXISTS packages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  price VARCHAR(255) NOT NULL,
  duration_unit VARCHAR(20) NOT NULL,
  duration_value VARCHAR(255) NOT NULL,
  currency VARCHAR(50) NOT NULL,
  status ENUM('active','inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
`;

  // Create table
  connection.query(packagetable, (err) => {
    if (err) return console.error(err.message);
    console.log("✅ packages table created successfully");
  });
}

const getAllPackages = (
  { page = 1, limit = 10, name = "price", search = "", status = "active" },
  callback
) => {
  page = parseInt(page, 10);
  limit = parseInt(limit, 10);
  const offset = (page - 1) * limit;

  const allowedColumns = ["name", "price", "duration_value", "duration_unit", "currency", "created_at", "updated_at"];

  if (!allowedColumns.includes(name)) {
    name = "name"; // default column
  }

  // Handle special fields
  if (name === "amount") {
    name = "price"; // fallback to price; we can concatenate later if needed
  } else if (name === "duration") {
    name = "duration_value"; // fallback to duration_value
  }

  // Build query dynamically
  let query = `SELECT * FROM packages WHERE status = ?`;
  let values = [status];

  if (search) {
    query += ` AND ${name} LIKE ?`;
    values.push(`%${search}%`);
  }

  query += ` ORDER BY id DESC LIMIT ? OFFSET ?`;
  values.push(limit, offset);

  connection.query(query, values, (err, results) => {
    if (err) return callback(err);

    let countQuery = `SELECT COUNT(*) AS total FROM packages WHERE status = ?`;
    let countValues = [status];

    if (search) {
      countQuery += ` AND ${name} LIKE ?`;
      countValues.push(`%${search}%`);
    }

    connection.query(countQuery, countValues, (err2, countResult) => {
      if (err2) return callback(err2);

      callback(null, {
        total: countResult[0].total,
        page,
        limit,
        packages: results,
      });
    });
  });
};




const addPackage = (req, res) => {
  const userId = req.user.userId;
  const { duration_unit, price, duration_value, currency } = req.body;

  if (!duration_unit || !price || !duration_value || !currency) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const insertSql = `INSERT INTO packages 
                     (duration_unit, price, duration_value, currency) 
                     VALUES (?, ?, ?, ?)`;

  connection.query(insertSql, [duration_unit, price, duration_value, currency], (err, results) => {
    if (err) {
      console.error("❌ Error inserting package:", err);
      return res.status(500).json({ error: "Database error" });
    }

    logAudit({
      tableName: "dbadminhistory",
      entityType: "package",
      entityId: results.insertId,
      action: "ADDED",
      data: { duration_unit, price, duration_value, currency, status: "active" },
      changedBy: userId,
    });

    res.status(201).json({ message: "Package added successfully", id: results.insertId });
  });
}

const editPackage = (req, res) => {
  const { id } = req.params;
  const { duration_unit, price, duration_value, currency } = req.body;
  const userId = req.user.userId;

  if (!duration_unit || !price || !duration_value || !currency) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const checkSql = "SELECT * FROM packages WHERE id = ?";
  connection.query(checkSql, [id], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (results.length === 0) return res.status(404).json({ error: "Package not found" });

    const updateSql = `UPDATE packages 
                           SET duration_unit = ?, price = ?, duration_value = ?, currency = ? 
                           WHERE id = ?`;

    connection.query(updateSql, [duration_unit, price, duration_value, currency, id], (err2) => {
      if (err2) return res.status(500).json({ error: "Database error" });

      logAudit({
        tableName: "dbadminhistory",
        entityType: "package",
        entityId: id,
        action: "UPDATED",
        data: { duration_unit, price, duration_value, currency, status: results[0].status },
        changedBy: userId,
      });

      res.status(200).json({ message: "Package updated successfully" });
    });
  });
}

const deletePackage = (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  const checkSql = "SELECT * FROM packages WHERE id = ?";
  connection.query(checkSql, [id], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (results.length === 0) return res.status(404).json({ error: "Package not found" });

    const currentPackage = results[0];
    const newStatus = currentPackage.status === "active" ? "inactive" : "active";

    const updateSql = "UPDATE packages SET status = ? WHERE id = ?";
    connection.query(updateSql, [newStatus, id], (err2) => {
      if (err2) return res.status(500).json({ error: "Database error" });

      logAudit({
        tableName: "dbadminhistory",
        entityType: "package",
        entityId: id,
        action: newStatus.toUpperCase(), // ACTIVE / INACTIVE
        data: { ...currentPackage, status: newStatus },
        changedBy: userId,
      });

      res.status(200).json({ message: `Package status updated to ${newStatus}` });
    });
  });
}

const getPackagebyCompany = (
  { page = 1, limit = 10, name = "price", search = "", status = "all" },
  callback
) => {
  page = parseInt(page);
  limit = parseInt(limit);
  const offset = (page - 1) * limit;

  const allowedSortFields = ["price", "package_type", "status", "id"];
  if (!allowedSortFields.includes(name)) {
    name = "price";
  }

  let sql = `
    SELECT c.id, c.package_type, c.price, c.status, a.username
    FROM cart c
    JOIN account a ON c.account_id = a.id
    WHERE 1=1
  `;

  const params = [];

  // ✅ Status filter (ONLY ONCE, CORRECT PLACE)
  if (status !== "all") {
    sql += ` AND c.status = ?`;
    params.push(status);
  }

  // ✅ Search filter
  if (search) {
    sql += ` AND (c.package_type LIKE ? OR a.username LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }

  sql += ` ORDER BY ${name} ASC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  connection.query(sql, params, (err, results) => {
    if (err) {
      console.error("SQL ERROR:", err.sqlMessage);
      return callback(err, null);
    }
    callback(null, results);
  });
};


const updatePackaeStatus = (req, res) => {
 const { id, status } = req.params; // Pass id and status from request body

  if (!id || !status) {
    return res.status(400).json({ error: "packageId and status are required" });
  }

  // 1️⃣ Get account_id for the package
  const getAccountIdSql = 'SELECT account_id FROM cart WHERE id = ?';
  connection.query(getAccountIdSql, [id], (err, accountResult) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    if (accountResult.length === 0) {
      return res.status(404).json({ error: "Package not found" });
    }

    const accountId = accountResult[0].account_id;

    // 2️⃣ Start transaction
    connection.beginTransaction((beginTransactionErr) => {
      if (beginTransactionErr) {
        console.error(beginTransactionErr);
        return res.status(500).json({ error: "Internal Server Error" });
      }

      // 3️⃣ Update clicked package with dynamic status
      const updatePackageSql = `
        UPDATE cart 
        SET 
          status = ?,
          active_at = CURRENT_TIMESTAMP,
          Expire_At = DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 30 DAY)
        WHERE id = ?
      `;
      connection.query(updatePackageSql, [status, id], (updatePackageErr) => {
        if (updatePackageErr) {
          connection.rollback();
          console.error(updatePackageErr);
          return res.status(500).json({ error: "Internal Server Error" });
        }

        // 4️⃣ Update other packages for same account to 'expire'
        const updateOthersSql = 'UPDATE cart SET status = "expire" WHERE account_id = ? AND id != ?';
        connection.query(updateOthersSql, [accountId, id], (updateOthersErr) => {
          if (updateOthersErr) {
            connection.rollback();
            console.error(updateOthersErr);
            return res.status(500).json({ error: "Internal Server Error" });
          }

          // 5️⃣ Update job_posts table
          const updateJobPostsSql = 'UPDATE job_posts SET status = "InActive" WHERE account_id = ? AND id != ?';
          connection.query(updateJobPostsSql, [accountId, id], (updateJobPostsErr) => {
            if (updateJobPostsErr) {
              connection.rollback();
              console.error(updateJobPostsErr);
              return res.status(500).json({ error: "Internal Server Error" });
            }

            // 6️⃣ Update payment table for the same package type
            const updatePaymentStatusSql = `
              UPDATE Payment 
              SET payment_status = "Paid" 
              WHERE account_id = ? 
                AND package_type = (SELECT package_type FROM cart WHERE id = ?)
            `;
            connection.query(updatePaymentStatusSql, [accountId, id], (updatePaymentStatusErr) => {
              if (updatePaymentStatusErr) {
                connection.rollback();
                console.error(updatePaymentStatusErr);
                return res.status(500).json({ error: "Internal Server Error" });
              }

              // 7️⃣ Commit transaction
              connection.commit((commitErr) => {
                if (commitErr) {
                  connection.rollback();
                  console.error(commitErr);
                  return res.status(500).json({ error: "Internal Server Error" });
                }

                res.json({ message: `Package status updated to "${status}" successfully` });
              });
            });
          });
        });
      });
    });
  });
};

const getCompanyPackgestatus=(req,res)=>{
  try {
    const userId = req.params.userId;

    // Perform a database query to check the user's package status
    const query =
      'SELECT status FROM cart WHERE account_id = ? AND status = "active"';

    connection.query(query, [userId], (err, results) => {
      if (err) {
        console.error("Error fetching package status:", err);
        return res.status(500).json({ error: "Internal Server Error" });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: "Package status not found" });
      }

      // Assuming results[0] contains the package status data
      const packageStatus = results[0].status;

      // You can modify this part based on what exactly you want to return
      res.status(200).json({ userId, packageStatus });
    });
  } catch (error) {
    console.error("Error in checkUserPackageStatus route:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

const getPackageDetail = (req, res) => {
  const userId = req.params.userId;

  const query = `
    SELECT 
      c.id AS cart_id,
      c.order_id,
      c.package_type,
      c.status AS package_status,
      c.Expire_At,
      COALESCE(pj.total_jobs, 0) AS total_jobs,
      COALESCE(job_list.jobs, '[]') AS jobs
    FROM 
      cart c
    JOIN 
      packages p
      ON c.package_type = p.duration_unit
    LEFT JOIN (
      SELECT 
        package_id,
        COUNT(*) AS total_jobs
      FROM 
        job_posts
      GROUP BY 
        package_id
    ) AS pj
      ON c.id = pj.package_id
    LEFT JOIN (
      SELECT 
        package_id,
      JSON_ARRAYAGG(JSON_OBJECT(
  'id', id,
  'account_id', account_id,
  'job_title', job_title
)) AS jobs

      FROM 
        job_posts
      GROUP BY package_id
    ) AS job_list
      ON c.id = job_list.package_id
    WHERE 
      c.account_id = ?;
  `;

  connection.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Error executing SQL query:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.json(results);
    }
  });
};

module.exports = {
  createPackagesTable,
  getAllPackages,
  addPackage,
  editPackage,
  deletePackage,
  getPackagebyCompany,
  updatePackaeStatus,
  getCompanyPackgestatus,
  getPackageDetail
}

