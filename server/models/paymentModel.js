const express = require("express");
const router = express.Router();
const connection = require("../connection");
const authMiddleware = require("../middleware/auth");
const logAudit = require("../utils/auditLogger");


const createPaymentTable = () => {
  const sql = `
  CREATE TABLE IF NOT EXISTS payment(
    id INT AUTO_INCREMENT PRIMARY KEY,
    account_id INT NOT NULL,
    job_id INT NULL,                    
    package_id INT NULL, 
    card_number VARCHAR(100),
    card_holder VARCHAR(100),
    cvv CHAR(4),
    expiry CHAR(5),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'PKR',
    payment_type ENUM('job','registration') DEFAULT 'job',
    payment_method ENUM('Card','Cash') DEFAULT 'Card',
    payment_status ENUM('Paid','Not Paid') DEFAULT 'Paid',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES account(id),
    FOREIGN KEY (job_id) REFERENCES job_posts(id)
   
      
  );
  `;

  connection.query(sql, (err) => {
    if (err) {
      console.error('Payment table error:', err.message);
      return;
    }
    console.log('✅ Payment table created successfully');
  });
};



const addPayment = (req, res) => {
  const { userId } = req.params;
  const { cardNumber, cardHolder, expiry, cvv, amount, currency, packageId, jobId } = req.body;

  connection.beginTransaction((err) => {
    if (err) return res.status(500).json({ success: false, message: "Transaction start failed" });

    const insertPaymentQuery = `
      INSERT INTO payment
        (account_id, job_id, package_id, card_number, card_holder,
         cvv, expiry, amount, currency, payment_type, payment_method, payment_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'job', 'Card', 'Paid')
    `;

    connection.query(
      insertPaymentQuery,
      [userId, jobId, packageId, cardNumber, cardHolder, cvv, expiry, amount, currency || "PKR"],
      (err, paymentResult) => {
        if (err) {
          return connection.rollback(() => {
            console.error("Payment Insert Error:", err.message);
            res.status(500).json({ success: false, message: "Payment failed" });
          });
        }

        const updateJobQuery = `
          UPDATE job_posts
          SET approval_status = 'Pending'
          WHERE account_id = ? AND package_id = ? AND id = ?
        `;

        connection.query(updateJobQuery, [userId, packageId, jobId], (err, jobResult) => {
          if (err) {
            return connection.rollback(() => {
              console.error("Job Update Error:", err.message);
              res.status(500).json({ success: false, message: "Job status update failed" });
            });
          }

          if (jobResult.affectedRows === 0) {
            return connection.rollback(() => {
              res.status(404).json({ success: false, message: "No matching job found to update" });
            });
          }

          connection.commit((err) => {
            if (err) {
              return connection.rollback(() => {
                res.status(500).json({ success: false, message: "Transaction commit failed" });
              });
            }

            logAudit({
              tableName: "history",
              entityType: "job",
              entityId: jobId,
              action: "UPDATED",
              data: { ...req.body, approval_status: "Pending" },
              changedBy: userId,
            });

            return res.status(201).json({
              success: true,
              message: "Payment successful and job status set to Pending",
              payment_id: paymentResult.insertId,
            });
          });
        });
      }
    );
  });
};

const addRegistrationPayment = (req, res) => {
  const { userId } = req.params;
  const { cardNumber, cardHolder, expiry, cvv, amount, currency, packageId } = req.body;

  if (!packageId || !amount) {
    return res.status(400).json({ success: false, message: "packageId and amount are required" });
  }

  connection.beginTransaction((err) => {
    if (err) return res.status(500).json({ success: false, message: "Transaction start failed" });

    // Step 1: Payment insert
    const insertPaymentSql = `
      INSERT INTO payment
        (account_id, job_id, package_id, card_number, card_holder,
         cvv, expiry, amount, currency, payment_type, payment_method, payment_status)
      VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, 'registration', 'Card', 'Paid')
    `;

    connection.query(
      insertPaymentSql,
      [userId, packageId, cardNumber, cardHolder, cvv, expiry, amount, currency || "PKR"],
      (err, paymentResult) => {
        if (err) {
          return connection.rollback(() => {
            console.error("Registration payment insert error:", err.message);
            res.status(500).json({ success: false, message: "Payment failed" });
          });
        }

        // Step 2: has_package = TRUE
        const updateCompanySql = `
          UPDATE company_info SET has_package = TRUE WHERE account_id = ?
        `;

        connection.query(updateCompanySql, [userId], (err2, updateResult) => {
          if (err2) {
            return connection.rollback(() => {
              console.error("Company update error:", err2.message);
              res.status(500).json({ success: false, message: "Package activation failed" });
            });
          }

          if (updateResult.affectedRows === 0) {
            return connection.rollback(() => {
              res.status(404).json({ success: false, message: "Company not found" });
            });
          }

          // Step 3: Commit
          connection.commit((err3) => {
            if (err3) {
              return connection.rollback(() => {
                res.status(500).json({ success: false, message: "Transaction commit failed" });
              });
            }

            logAudit({
              tableName: "history",
              entityType: "employer",
              entityId: userId,
              action: "PACKAGE_SUBSCRIBED",
              data: { packageId, amount, currency, payment_type: "registration" },
              changedBy: userId,
            });

            return res.status(201).json({
              success: true,
              message: "Payment successful. Account activated!",
              payment_id: paymentResult.insertId,
            });
          });
        });
      }
    );
  });
};




module.exports = {
  createPaymentTable,
  addPayment,
  addRegistrationPayment,
}