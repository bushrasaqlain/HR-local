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
    job_id INT NOT NULL,
    card_number VARCHAR(100),
    card_holder VARCHAR(100),
    cvv CHAR(4),
    expiry CHAR(5),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'PKR',
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

  const {
    cardNumber,
    cardHolder,
    expiry,
    cvv,
    amount,
    currency,
    packageId,
    jobId
  } = req.body;

  connection.beginTransaction((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Transaction start failed",
      });
    }

    // 1️⃣ Insert payment
    const insertPaymentQuery = `
      INSERT INTO payment
      (account_id, job_id,card_number,card_holder, cvv, expiry, amount, currency, payment_method, payment_status)
      VALUES (?, ?,?, ?, ?, ?, ?, ?, 'Card', 'Paid')
    `;

    connection.query(
      insertPaymentQuery,
      [
        userId,
        jobId,
        cardNumber,
        cardHolder,
        cvv,
        expiry,
        amount,
        currency || "USD",
      ],
      (err, paymentResult) => {
        if (err) {
          return connection.rollback(() => {
            console.error("❌ Payment Insert Error:", err.message);
            res.status(500).json({
              success: false,
              message: "Payment failed",
            });
          });
        }

        // 2️⃣ Update job_post status
        const updateJobQuery = `
          UPDATE job_posts
          SET approval_status = 'Pending'
          WHERE account_id = ?
            AND package_id = ? AND id=?
        `;

        connection.query(
          updateJobQuery,
          [userId, packageId, jobId],
          (err, jobResult) => {
            if (err) {
              return connection.rollback(() => {
                console.error("❌ Job Update Error:", err.message);
                res.status(500).json({
                  success: false,
                  message: "Job status update failed",
                });
              });
            }

            // Optional: ensure at least one row updated
            if (jobResult.affectedRows === 0) {
              return connection.rollback(() => {
                res.status(404).json({
                  success: false,
                  message: "No matching job found to update",
                });
              });
            }

            // 3️⃣ Commit transaction
            connection.commit((err) => {
              if (err) {
                return connection.rollback(() => {
                  res.status(500).json({
                    success: false,
                    message: "Transaction commit failed",
                  });
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
          }
        );
      }
    );
  });
};



module.exports = {
  createPaymentTable,
  addPayment
}