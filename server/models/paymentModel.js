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

    -- 🔐 SAFE CARD INFO
    card_last4 VARCHAR(4),
    card_brand VARCHAR(20),
    card_holder VARCHAR(100),

    -- 💳 GENERIC PAYMENT
    payment_reference VARCHAR(255),

    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'PKR',

    payment_type ENUM('job','registration') DEFAULT 'job',

    payment_method ENUM('Card','EasyPaisa','JazzCash','Bank','QR') DEFAULT 'Card',

    payment_status ENUM('Pending','Paid','Failed') DEFAULT 'Paid',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (account_id) REFERENCES account(id),
    FOREIGN KEY (job_id) REFERENCES job_posts(id)
  );
  `;

  connection.query(sql, (err) => {
    if (err) {
      console.error("Payment table error:", err.message);
      return;
    }
    console.log("✅ Payment table ready (secure mode)");
  });
};


const addPayment = (req, res) => {
  const { userId } = req.params;

  const {
    paymentMethod, // Card / EasyPaisa / JazzCash / Bank / QR
    cardNumber,
    cardHolder,
    amount,
    currency,
    packageId,
    jobId,
    reference, // txn id / QR ref / bank ref
  } = req.body;

  let cardLast4 = null;
  let cardBrand = null;

  // 💳 Handle card safely
  if (paymentMethod === "Card") {
    cardLast4 = cardNumber ? cardNumber.slice(-4) : null;

    // simple detection
    if (cardNumber?.startsWith("4")) cardBrand = "visa";
    else if (cardNumber?.startsWith("5")) cardBrand = "mastercard";
    else cardBrand = "unknown";
  }

  connection.beginTransaction((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Transaction failed" });
    }

    const paymentQuery = `
      INSERT INTO payment
      (account_id, job_id, package_id,
       card_last4, card_brand, card_holder,
       amount, currency,
       payment_type, payment_method, payment_status,
       payment_reference)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'job', ?, 'Paid', ?)
    `;

    connection.query(
      paymentQuery,
      [
        userId,
        jobId || null,
        packageId,
        cardLast4,
        cardBrand,
        cardHolder || null,
        amount,
        currency || "PKR",
        paymentMethod,
        reference || null,
      ],
      (err1, paymentResult) => {
        if (err1) {
          return connection.rollback(() => {
            console.error("Payment error:", err1);
            res.status(500).json({ success: false, message: "Payment failed" });
          });
        }

        // 🎁 Activate package
        subscribePackage(connection, { userId, packageId }, (err2, subResult) => {
          if (err2) {
            return connection.rollback(() => {
              res.status(500).json({ success: false, message: err2.message });
            });
          }

          // 🧩 Update job (optional)
          if (jobId) {
            const updateJob = `
              UPDATE job_posts
              SET approval_status = 'Pending'
              WHERE id = ? AND account_id = ?
            `;

            connection.query(updateJob, [jobId, userId], (err3) => {
              if (err3) {
                return connection.rollback(() => {
                  res.status(500).json({ success: false, message: "Job update failed" });
                });
              }

              finalize();
            });
          } else {
            finalize();
          }

          function finalize() {
            connection.commit((err4) => {
              if (err4) {
                return connection.rollback(() => {
                  res.status(500).json({ success: false, message: "Commit failed" });
                });
              }

              logAudit({
                tableName: "history",
                entityType: "payment",
                entityId: paymentResult.insertId,
                action: "PACKAGE_PURCHASED",
                data: {
                  packageId,
                  amount,
                  paymentMethod,
                  subscriptionId: subResult.subscriptionId,
                },
                changedBy: userId,
              });

              return res.status(201).json({
                success: true,
                message: "Payment successful & package activated 🚀",
                payment_id: paymentResult.insertId,
                subscription_id: subResult.subscriptionId,
              });
            });
          }
        });
      }
    );
  });
};

const addRegistrationPayment = (req, res) => {
  const { userId } = req.params;

  const {
    paymentMethod,
    cardNumber,
    cardHolder,
    amount,
    currency,
    packageId,
    reference,
  } = req.body;

  if (!packageId || !amount) {
    return res.status(400).json({
      success: false,
      message: "packageId and amount are required",
    });
  }

  let cardLast4 = null;
  let cardBrand = null;

  if (paymentMethod === "Card") {
    cardLast4 = cardNumber?.slice(-4);
    if (cardNumber?.startsWith("4")) cardBrand = "visa";
    else if (cardNumber?.startsWith("5")) cardBrand = "mastercard";
    else cardBrand = "unknown";
  }

  connection.beginTransaction((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Transaction failed" });
    }

    const insertPaymentSql = `
      INSERT INTO payment
      (account_id, package_id,
       card_last4, card_brand, card_holder,
       amount, currency,
       payment_type, payment_method, payment_status,
       payment_reference)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'registration', ?, 'Paid', ?)
    `;

    connection.query(
      insertPaymentSql,
      [
        userId,
        packageId,
        cardLast4,
        cardBrand,
        cardHolder || null,
        amount,
        currency || "PKR",
        paymentMethod,
        reference || null,
      ],
      (err1, paymentResult) => {
        if (err1) {
          return connection.rollback(() => {
            res.status(500).json({ success: false, message: "Payment failed" });
          });
        }

        const updateCompanySql = `
          UPDATE company_info SET has_package = TRUE WHERE account_id = ?
        `;

        connection.query(updateCompanySql, [userId], (err2, result) => {
          if (err2 || result.affectedRows === 0) {
            return connection.rollback(() => {
              res.status(500).json({ success: false, message: "Activation failed" });
            });
          }

          connection.commit((err3) => {
            if (err3) {
              return connection.rollback(() => {
                res.status(500).json({ success: false, message: "Commit failed" });
              });
            }

            logAudit({
              tableName: "history",
              entityType: "employer",
              entityId: userId,
              action: "PACKAGE_SUBSCRIBED",
              data: { packageId, amount, paymentMethod },
              changedBy: userId,
            });

            return res.status(201).json({
              success: true,
              message: "Registration payment successful 🎉",
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