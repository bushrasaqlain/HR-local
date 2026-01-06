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

const getUserName = (userId, callback) => {
    const sql = 'SELECT username FROM account WHERE id = ?';
    connection.query(sql, [userId], (err, results) => {
        if (err) {
            console.error(err);
            return callback({ status: 500, error: 'Internal Server Error', details: err });
        }

        if (results.length > 0) {
            return callback(null, { username: results[0].username });
        } else {
            return callback({ status: 404, error: 'User not found with the specified ID' });
        }
    });
};

const register = (req, res) => {
    const { accountType, email, password, isActive, username } = req.body;
    try {

        let sql;
        let values;
        // If account type is candidate or admin, include only specific fields
        sql = "INSERT INTO account (`username`, `email`, `password`, `isActive`, `accountType`) VALUES (?)";
        values = [
            req.body.username,
            req.body.email,
            req.body.password,
            req.body.isActive,
            req.body.accountType
        ];

        connection.query(sql, [values], (err, data) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "Internal Server Error" });
            }


            if (accountType === "candidate" || accountType === "employer") {
                logAudit({
                    tableName: "history",
                    entityType: accountType,
                    entityId: data.insertId,
                    action: "ADDED",
                    data: { username: username, email: email, password: password, isActive: isActive, accountType: accountType },
                    changedBy: data.insertId, // or req.user.userId
                });
            }

            return res.status(201).json(data);
        });
    } catch (error) {
        console.error(error.message);
        return res.status(400).json({ error: error.message });
    }
}

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

const adminLogin = (req, res) => {
    const adminId = req.params.userId;
    const adminType = 'db_admin';

    // Fetch the username of the admin user with the specified ID and type
    const sql = 'SELECT name FROM account WHERE id = ? AND accountType = ?';
    connection.query(sql, [adminId, adminType], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        if (results.length > 0) {
            const Username = results[0].name;
            return res.status(200).json({ Username });
        } else {
            return res.status(404).json({ error: 'Admin user not found with the specified ID' });
        }
    });
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

const updateAccountStatus = (req, res) => {
    const { accountId } = req.body;
    const userId = req.user.userId;

    if (!accountId) {
        return res.status(400).json({ error: "accountId is required" });
    }

    const checkSql = "SELECT isActive, username FROM account WHERE id = ?";
    connection.query(checkSql, [accountId], (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        if (results.length === 0)
            return res.status(404).json({ error: "Account not found" });

        const currentStatus = results[0].isActive;
        const newStatus = currentStatus === "Active" ? "InActive" : "Active";

        const updateSql = "UPDATE account SET isActive = ? WHERE id = ?";
        connection.query(updateSql, [newStatus, accountId], (err2) => {
            if (err2) return res.status(500).json({ error: "Database error" });

            logAudit({
                tableName: "history",
                entityType: "employer",
                entityId: accountId,
                action: newStatus.toUpperCase(),
                data: { previousStatus: currentStatus, newStatus, username: results[0].username },
                changedBy: userId,
            });

            res
                .status(200)
                .json({ message: `${newStatus} Successfully`, updatedStatus: newStatus });
        });
    });
}

const getDetailByName = (req, res) => {
    const name = req.query.name?.trim();

    if (!name) {
        return res.status(400).json({ error: "Username is required" });
    }

    const sql = 'SELECT 1 FROM account WHERE username = ? LIMIT 1';
    connection.query(sql, [name], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        return res.status(200).json({ exists: results.length > 0 });
    });
};

const getDetailByEmail = (req) => {
  return new Promise((resolve, reject) => {
    const email = req.query.email?.trim();

    if (!email) {
      return reject({ status: 400, error: "Email is required" });
    }

    const sql = 'SELECT 1 FROM account WHERE email = ? LIMIT 1';
    connection.query(sql, [email], (err, results) => {
      if (err) {
        console.error(err);
        return reject({ status: 500, error: "Internal Server Error", details: err });
      }

      resolve({ exists: results.length > 0 });
    });
  });
};



module.exports = {
    createAccountTable,
    getAccountDetail,
    getAccountType,
    getUserName,
    register,
    login,
    adminLogin,
    updateAccountStatus,
    getDetailByName,
    getDetailByEmail,
    changePassword

};