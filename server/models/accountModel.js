const express = require("express");
const router = express.Router();
const connection = require("../connection");
const { generateToken } = require("../utils/jwt.js");
const logAudit = require("../utils/auditLogger.js");
const sendVerificationEmail = require("../utils/sendVerificationEmail");
const createAccountTable = () => {
  const createTableQuery = `
  CREATE TABLE IF NOT EXISTS account (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NULL, 
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    isActive ENUM('Active', 'Inactive') NOT NULL,
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
    console.log("Account Table created successfully");
  });
};
const createEmailVerificationTable = () => {
  const createTableQuery = `
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  account_id INT NOT NULL,
  token VARCHAR(64) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (account_id) REFERENCES account(id) ON DELETE CASCADE
)`;

  connection.query(createTableQuery, function (err, results, fields) {
    if (err) {
      return console.error(err.message);
    }
    console.log("Account Table created successfully");
  });
};

const getAccountDetail = (req) => {
  return new Promise((resolve, reject) => {
    const userId = req.user.userId;

    const sql = `
      SELECT 
        a.id AS userId,
        a.username,
        a.accountType,
        ci.passport_photo
      FROM account a
      LEFT JOIN candidate_info ci ON a.id = ci.account_id
      WHERE a.id = ?
    `;

    connection.query(sql, [userId], (err, results) => {
      if (err)
        return reject({ status: 500, error: "Database error", details: err });

      if (results.length === 0)
        return reject({ status: 404, error: "User not found" });

      resolve(results[0]); // no conversion needed
    });
  });
};

const register = (req, res) => {
  try {
    const { accountType, email, password, isActive, username } = req.body;
    const status = isActive === "Active" ? "Active" : "Inactive";
    const isAdmin = accountType === "db_admin" || accountType === "reg_admin";

    if (isAdmin && !username) {
      return res.status(400).json({ error: "Username is required for admin accounts" });
    }

    // ✅ Check for existing email first
    connection.query(`SELECT id FROM account WHERE email = ? LIMIT 1`, [email], (err, existing) => {
      if (err) return res.status(500).json({ error: "Internal Server Error" });
      if (existing.length > 0) {
        return res.status(409).json({ error: "An account with this email already exists." });
      }

      const sql = isAdmin
        ? `INSERT INTO account (username, email, password, isActive, accountType) VALUES (?, ?, ?, ?, ?)`
        : `INSERT INTO account (email, password, isActive, accountType) VALUES (?, ?, ?, ?)`;

      const values = isAdmin
        ? [username, email, password, status, accountType]
        : [email, password, status, accountType];

      connection.query(sql, values, (err, data) => {
        if (err) {
          if (err.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ error: "An account with this email already exists." });
          }
          console.error("Error creating account:", err);
          return res.status(500).json({ error: "Internal Server Error", details: err.message });
        }

        const accountId = data.insertId;

        if (accountType === "candidate") {
          connection.query(
            `INSERT INTO candidate_info (account_id, profile_completed) VALUES (?, ?)`,
            [accountId, false],
            (err2) => {
              if (err2) return res.status(500).json({ error: "Failed to create candidate profile" });
              sendVerificationEmail(accountId, email);
              logAudit({
                tableName: "history",
                entityType: "candidate",
                entityId: accountId,
                action: "ADDED",
                data: { email, status },
                changedBy: accountId,
              });
              return res.status(201).json({
                success: true,
                message: "Account created. Please check your email to verify.",
                accountId,
              });
            }
          );

        } else if (accountType === "employer") {
          connection.query(
            `INSERT INTO company_info (account_id, subscription_status) VALUES (?, 'pending')`,
            [accountId],
            (err2) => {
              if (err2) return res.status(500).json({ error: "Failed to create company info" });
              sendVerificationEmail(accountId, email);
              logAudit({
                tableName: "history",
                entityType: "employer",
                entityId: accountId,
                action: "ADDED",
                data: { email, status },
                changedBy: accountId,
              });
              return res.status(201).json({
                success: true,
                message: "Account created. Please check your email to verify.",
                accountId,
              });
            }
          );

        } else if (isAdmin) {
          logAudit({
            tableName: "history",
            entityType: accountType,
            entityId: accountId,
            action: "ADDED",
            data: { username, email, status },
            changedBy: accountId,
          });
          return res.status(201).json({
            success: true,
            message: "Admin account created successfully",
            accountId,
          });

        } else {
          return res.status(201).json({
            success: true,
            message: "Account created successfully",
            accountId,
          });
        }
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

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const sql = `
      SELECT 
        a.id,
        a.email,
        a.username,
        a.accountType,
        a.isActive,
        ci.full_name,
        ci.profile_completed,
        comp.company_name,
        comp.profile_completed AS company_profile_completed,
        comp.has_package,
        comp.subscription_status
      FROM account a
      LEFT JOIN candidate_info ci ON a.id = ci.account_id
      LEFT JOIN company_info comp ON a.id = comp.account_id
      WHERE a.email = ? AND BINARY a.password = ?
      LIMIT 1
    `;

    connection.query(sql, [email, password], (err, results) => {
      if (err) {
        console.error("Login DB error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
      }

      if (!results.length) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const user = results[0];

      // Normalize isActive — must be defined before anything else
      const isActiveNormalized = (user.isActive || "").toString().trim();

      const token = generateToken(user);

      // displayName
      let displayName = user.username;
      if (user.accountType === "candidate") {
        displayName = user.full_name || user.email;
      } else if (user.accountType === "employer") {
        displayName = user.company_name || user.email;
      }

      // ✅ Candidate — block if email not verified
      if (user.accountType === "candidate") {
        if (isActiveNormalized !== "Active") {
          return res.json({
            success: false,
            error: "Please verify your email before logging in. Check your inbox.",
          });
        }
        return res.json({
          success: true,
          token,
          userId: user.id,
          displayName,
          accountType: user.accountType,
          isActive: isActiveNormalized,
          profile_completed: !!user.profile_completed,
        });
      }

      // ✅ Employer
      if (user.accountType === "employer") {
        if (!user.company_profile_completed) {
          return res.json({
            success: true,
            token,
            userId: user.id,
            displayName,
            accountType: user.accountType,
            isActive: isActiveNormalized,
            profile_completed: false,
          });
        }
        if (isActiveNormalized !== "Active") {
          return res.json({
            success: false,
            error: "Your profile is under review. Please wait for admin approval.",
            profile_completed: true,
          });
        }
        return res.json({
          success: true,
          token,
          userId: user.id,
          displayName,
          accountType: user.accountType,
          isActive: isActiveNormalized,
          profile_completed: true,
        });
      }

      // ✅ Admin
      if (user.accountType === "db_admin" || user.accountType === "reg_admin") {
        return res.json({
          success: true,
          token,
          userId: user.id,
          displayName: user.username,
          accountType: user.accountType,
          isActive: isActiveNormalized,
        });
      }

      return res.status(400).json({ success: false, error: "Invalid user type" });
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};



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
    connection.query(
      updatePasswordQuery,
      [newPassword, userId],
      (updateErr) => {
        if (updateErr) {
          console.error(updateErr);
          return res.status(500).json({ error: "Internal Server Error" });
        }

        return res
          .status(200)
          .json({ message: "Password  updated successfully" });
      },
    );
  });
};
const verifyEmail = (req, res) => {
  const { token } = req.query;

  if (!token) return res.status(400).send("Invalid link.");

  const sql = `
    SELECT t.account_id, t.expires_at, t.used, a.accountType
    FROM email_verification_tokens t
    JOIN account a ON a.id = t.account_id
    WHERE t.token = ?
    LIMIT 1
  `;

  connection.query(sql, [token], (err, results) => {
    if (err) return res.status(500).send("Server error.");
    if (!results.length) return res.status(400).send("Invalid or expired link.");

    const row = results[0];

    if (row.used) return res.status(400).send("This link has already been used.");
    if (new Date(row.expires_at) < new Date()) return res.status(400).send("Link has expired. Please request a new one.");

    // Mark token as used
    connection.query(`UPDATE email_verification_tokens SET used = TRUE WHERE token = ?`, [token]);

    // Candidate → auto-approve
    if (row.accountType === "candidate") {
      connection.query(
        `UPDATE account SET isActive = 'Active' WHERE id = ?`,
        [row.account_id],
        (err2) => {
          if (err2) return res.status(500).send("Server error.");
          // Redirect to login with success message
          return res.redirect(`${process.env.FRONTEND_URL}/login?verified=1`);
        }
      );

    // Employer → just mark verified, admin still approves
    } else if (row.accountType === "employer") {
      // Optional: add an email_verified column to account table
      // connection.query(`UPDATE account SET email_verified = TRUE WHERE id = ?`, [row.account_id]);
      return res.redirect(`${process.env.FRONTEND_URL}/login?verified=1&pending=1`);
    }
  });
};


module.exports = {
  createAccountTable,
  createEmailVerificationTable,
  getAccountDetail,
  register,
  login,
  changePassword,
  verifyEmail
};
