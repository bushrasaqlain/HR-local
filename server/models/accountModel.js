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
    const { accountType, email, password, isActive, username, company_name } = req.body;
    const status = isActive === "Active" ? "Active" : "Inactive";

    const sql = `
      INSERT INTO account (username, email, password, isActive, accountType)
      VALUES (?, ?, ?, ?, ?)
    `;
    const values = [username, email, password, status, accountType];

    connection.query(sql, values, (err, data) => {
      if (err) {
        console.error("Error creating account:", err);
        return res.status(500).json({
          error: "Internal Server Error",
          details: err.message,
        });
      }

      const accountId = data.insertId;

      // ✅ Candidate logic
      if (accountType === "candidate") {
        const candidateSql = `INSERT INTO candidate_info (account_id, profile_completed) VALUES (?, ?)`;
        connection.query(candidateSql, [accountId, false], (err2) => {
          if (err2) return res.status(500).json({ error: "Failed to create candidate profile" });

          logAudit({
            tableName: "history",
            entityType: "candidate",
            entityId: accountId,
            action: "ADDED",
            data: { username, email, status },
            changedBy: accountId,
          });

          return res.status(201).json({ success: true, message: "Candidate account created successfully", accountId });
        });

        // ✅ Employer logic
      } else if (accountType === "employer") {
  const companySql = `
    INSERT INTO company_info (account_id, subscription_status)
    VALUES (?, 'pending')
  `;

  connection.query(companySql, [accountId], (err2) => {
    if (err2)
      return res.status(500).json({ error: "Failed to create company info" });

          logAudit({
            tableName: "history",
            entityType: "employer",
            entityId: accountId,
            action: "ADDED",
            data: { username, email, status },
            changedBy: accountId,
          });

          return res.status(201).json({ success: true, message: "Employer account created successfully", accountId });
        });
      } else {
        return res.status(201).json({
          success: true,
          message: "Account created successfully",
          accountId,
        });
      }
    });
  } catch (error) {
    console.error("Unexpected error:", error.message);
    return res.status(400).json({ error: error.message });
  }
};




// const login = (req, res) => {
//   try {

//     const { email, password } = req.body;
//     const sql = 'SELECT id,username, accountType, isActive FROM account WHERE email = ? AND password = ?';
//     connection.query(sql, [email, password], (err, results) => {
//       if (err) {
//         console.error(err);
//         return res.status(500).json({ error: 'Internal Server Error' });
//       }

//       if (results.length === 0) {
//         return res.status(401).json({ error: 'Invalid email or password' });
//       }

//       const user = results[0];

//       const isActiveNormalized = (user.isActive || "").trim().toLowerCase();
// if (isActiveNormalized !== "active") {
//   return res.json({ success: false, error: "Admin has not granted permissions yet...." });
// }


//       if (user.accountType === 'employer' || user.accountType === 'db_admin' || user.accountType === 'reg_admin') {
//         const token = generateToken(user);

//         return res.json({
//           success: true, token,
//           userId: user.id,
//           username: user.username,
//           accountType: user.accountType,
//           isActive: user.isActive
//         });
//       }
//       else if (user.accountType === 'candidate') {
//         const sql = `
//       SELECT 
//         a.id,
//         a.accountType,
//         a.username,
//         a.isActive,
//         ci.profile_completed
//       FROM account a
//       LEFT JOIN candidate_info ci ON a.id = ci.account_id
//       WHERE a.email = ? AND a.password = ?
//     `;
//         connection.query(sql, [email, password], (err, results) => {
//           if (err) {
//             return res.status(500).json({ error: "Internal Server Error" });
//           }

//           if (!results.length) {
//             return res.status(401).json({ error: "Invalid email or password" });
//           }

//           const user = results[0];
//           const token = generateToken(user);

//           // 🔑 ALWAYS allow login
//           return res.json({
//             success: true,
//             token,
//             userId: user.id,
//             username: user.username,
//             accountType: user.accountType,
//             isActive: user.isActive,
//             profile_completed: !!user.profile_completed,
//           });
//         })

//         }else {
//           return res.json({ success: false, error: 'Invalid user type' });
//         }
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ error: 'Internal Server Error' });
//   }
// }
const login = (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const sql = `
      SELECT 
        a.id,
        a.username,
        a.accountType,
        a.isActive,
        ci.profile_completed,
        comp.company_name,
        comp.profile_completed AS company_profile_completed,
        comp.has_package,
        comp.subscription_status
      FROM account a
      LEFT JOIN candidate_info ci ON a.id = ci.account_id
      LEFT JOIN company_info comp ON a.id = comp.account_id
      WHERE a.email = ? AND a.password = ?
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

      // ✅ Define displayName for ALL account types
      let displayName = user.username; // default fallback
      if (user.accountType === "candidate") {
        displayName = user.full_name || user.username;
      } else if (user.accountType === "employer") {
        displayName = user.company_name || user.username;
      }
      // db_admin and reg_admin will automatically use username

      // Normalize isActive
      const isActiveNormalized = (user.isActive || "").toString().trim();

      // Admins can login even if not Active
      const adminTypes = ["db_admin", "reg_admin"];
      // if (user.accountType === "employer" && isActiveNormalized !== "Active") {
      //   return res.json({ success: false, error: "Admin has not granted permissions yet...." });
      // }

      const token = generateToken(user); // your JWT function

      // Candidate login: include profile_completed
      if (user.accountType === "candidate") {
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

      // Admin or Employer login
     if (user.accountType === "employer") {
  
  // ✅ 1. Allow login if profile NOT completed
  if (!user.company_profile_completed) {
    return res.json({
      success: true,
      token,
      userId: user.id,
      displayName,
      accountType: user.accountType,
      isActive: isActiveNormalized,
      profile_completed: false
    });
  }

  // 🚫 2. AFTER profile completion → apply restriction
  if (isActiveNormalized !== "Active") {
    return res.json({
      success: false,
      error: "Your profile is under review. Please wait for admin approval.",
      profile_completed: true
    });
  }

  // ✅ 3. Approved → allow full access
  return res.json({
    success: true,
    token,
    userId: user.id,
    displayName,
    accountType: user.accountType,
    isActive: isActiveNormalized,
    profile_completed: true
  });
}

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

      // Fallback for unknown accountType
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

module.exports = {
  createAccountTable,
  getAccountDetail,
  register,
  login,
  changePassword,
};
