const express = require("express");
const router = express.Router();
const connection = require("../connection");
const { generateToken } = require("../utils/jwt.js");
const logAudit = require("../utils/auditLogger.js");
const createAccountTable = () => {
  const createTableQuery = `
  CREATE TABLE IF NOT EXISTS account (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL, 
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    isActive ENUM('Active', 'InActive') NOT NULL,
    accountType ENUM('candidate', 'employer', 'db_admin', 'reg_admin') NOT NULL CHECK(accountType IN ('candidate', 'employer', 'db_admin', 'reg_admin')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    
  )
`;

  // Execute the query to create the table
  connection.query(createTableQuery, function (err, results, fields) {
    if (err) {
      return console.error(err.message);
    }
    console.log('Account Table created successfully');
  });
}
const getAccountDetail = (req) => {
  return new Promise((resolve, reject) => {
    const userId = req.user.userId;

    const sql = `
      SELECT a.id as userId, a.username, a.accountType, c.logo
      FROM account a
      LEFT JOIN candidate_info c ON a.id = c.account_id
      WHERE a.id = ?
    `;

    connection.query(sql, [userId], (err, results) => {
      if (err) return reject({ status: 500, error: "Database error", details: err });
      if (results.length === 0) return reject({ status: 404, error: "User not found" });

      let logoBase64 = null;
      if (results[0].logo) logoBase64 = Buffer.from(results[0].logo).toString("base64");

      resolve({ ...results[0], logo: logoBase64 });
    });
  });
};


const getAccountType = (req, callback) => {
  const { userId } = req.params;

  const sql = 'SELECT id, accountType, username FROM account WHERE id = ?';
  connection.query(sql, [userId], (err, results) => {
    if (err) {
      console.error(err);
      return callback({ status: 500, error: 'Internal Server Error', details: err });
    }

    if (results.length > 0) {
      const { accountType, username } = results[0]; // fix variable name
      return callback(null, { accountType, username });
    } else {
      return callback({ status: 404, error: 'User not found with the specified ID' });
    }
  });
};

const register = (req, res) => {
  console.log("REQ BODY:", req.body);

  try {
    const { accountType, email, password, isActive, username } = req.body;

    // Ensure isActive is valid ENUM ('Active' or 'InActive')
    const status = isActive === "Active" ? "Active" : "InActive";

    const sql = `
      INSERT INTO account (username, email, password, isActive, accountType)
      VALUES (?, ?, ?, ?, ?)
    `;

    const values = [username, email, password, status, accountType];

    connection.query(sql, values, (err, data) => {
      if (err) {
        console.error("Error creating account:", err);
        return res.status(500).json({ error: "Internal Server Error", details: err.message });
      }

      // Log audit if candidate or employer
      if (accountType === "candidate" || accountType === "employer") {
        logAudit({
          tableName: "history",
          entityType: accountType,
          entityId: data.insertId,
          action: "ADDED",
          data: { username, email, password, isActive: status, accountType },
          changedBy: data.insertId, // or req.user.userId if logged in
        });
      }

      return res.status(201).json({
        success: true,
        message: "Account created successfully",
        accountId: data.insertId,
      });
    });
  } catch (error) {
    console.error("Unexpected error:", error.message);
    return res.status(400).json({ error: error.message });
  }
};

const login = (req, res) => {
  try {
    const { email, password } = req.body;

    const sql = 'SELECT id, accountType, isActive FROM account WHERE email = ? AND password = ?';
    connection.query(sql, [email, password], (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal Server Error' });
      }

      if (results.length === 0) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const user = results[0];

      if (user.isActive !== "Active") {
        return res.json({ success: false, error: "Admin has not granted permissions yet...." })
      }

      if (user.accountType === 'candidate' || user.accountType === 'employer' || user.accountType === 'db_admin' || user.accountType === 'reg_admin') {
        const token = generateToken(user);

        return res.json({ success: true, token });
      } else {
        return res.json({ success: false, error: 'Invalid user type' });
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

const changePassword = (req, res) => {
  const userId = req.user.userId;
  const { oldPassword, newPassword, confirmPassword } = req.body;

  // Fetch the user's existing password and confirm password
  const getUserQuery = "SELECT password FROM account WHERE id = ?";
  connection.query(getUserQuery, [userId], (err, userRows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    if (userRows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = userRows[0];

    if (oldPassword !== user.password) {
      return res.status(401).json({ error: "Invalid old password" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }


    // Update both password and confirmPassword fields separately
    const updatePasswordQuery = "UPDATE account SET password = ?  WHERE id = ?";
    connection.query(updatePasswordQuery, [newPassword, userId], (updateErr) => {
      if (updateErr) {
        console.error(updateErr);
        return res.status(500).json({ error: "Internal Server Error" });
      }

      return res.status(200).json({ message: "Password  updated successfully" });
    });




  });
}

module.exports = {
  createAccountTable,
  getAccountDetail,
  getAccountType,
  register,
  login,
  changePassword

};