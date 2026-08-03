const express = require("express");
const router = express.Router();
const connection = require("../connection");
const authMiddleware = require("../middleware/auth");
const logAudit = require("../utils/auditLogger");
const { subcribePackageInternal } = require("./jobModel");
const { logBillingEvent, logDailySpend } = require("../utils/billingLogger");


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
    card_expiry VARCHAR(7),

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

const createSaveCardTable = () => {
  const sql = `
  CREATE TABLE IF NOT EXISTS saved_cards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  account_id INT NOT NULL,

  card_last4 VARCHAR(4),
  card_brand VARCHAR(20),
  accepted_types JSON NULL,
  card_holder VARCHAR(100),
  card_expiry VARCHAR(7),
  payment_token VARCHAR(255) NULL, 

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (account_id) REFERENCES account(id)
);
  `;

  connection.query(sql, (err) => {
    if (err) {
      console.error("Save Card table error:", err.message);
      return;
    }
    console.log("✅ Save Card table ready (secure mode)");
  });
};

const addPayment = (req, res) => {
  const { userId } = req.params;
  const {
    paymentDetails, amount, currency,
    packageId, jobId, reference, payment_type,
  } = req.body;

  const { method, cardLast4, cardName, saveForLater, acceptedTypes, cardExpiry } = paymentDetails || {};

  let last4 = null;
  let brand = null;

  if (method?.toLowerCase() === "card") {
    last4 = cardLast4 ? cardLast4.slice(-4) : null;
    if (cardLast4?.startsWith("4")) brand = "visa";
    else if (cardLast4?.startsWith("5")) brand = "mastercard";
    else if (cardLast4?.startsWith("3")) brand = "amex";
    else if (cardLast4?.startsWith("6")) brand = "discover";
    else brand = "unknown";
  }

  const payment_token = method?.toLowerCase() === "card" && last4
    ? `tok_dummy_${Date.now()}_${last4}`
    : null;

  const isCardSaveOnly = (!amount || Number(amount) === 0) && !packageId && !jobId;

  // ── Card-save-only path (no transaction needed, single statement) ──
  if (isCardSaveOnly) {
    if (method?.toLowerCase() === "card" && saveForLater && last4) {
      const checkQuery = `SELECT id FROM saved_cards WHERE account_id = ? AND card_last4 = ? AND card_brand = ?`;
      connection.query(checkQuery, [userId, last4, brand], (errCheck, rows) => {
        if (errCheck) return res.status(500).json({ success: false, message: "Card check failed" });

        if (rows.length === 0) {
          const insertCard = `
            INSERT INTO saved_cards (account_id, card_last4, card_brand, card_holder, card_expiry,  accepted_types, payment_token)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `;
          connection.query(
            insertCard,
            [userId, last4, brand, cardName || null, cardExpiry || null, JSON.stringify(acceptedTypes || []), payment_token],
            (errInsert) => {
              if (errInsert) {
                return res.status(500).json({
                  success: false,
                  message: "Saving card failed"
                });
              }

              logAudit({
                tableName: "history",
                entityType: "employer",
                entityId: userId,
                action: "CARD_SAVED",
                data: {
                  event: "Payment card saved",
                  card_brand: brand,
                  card_last4: last4,
                },
                changedBy: userId,
              });
              return res.status(201).json({
                success: true,
                message: "Card saved successfully ✅"
              });
            }
          );
        } else {
          return res.status(200).json({ success: true, message: "Card already saved" });
        }
      });
    } else {
      return res.status(400).json({ success: false, message: "No card data provided" });
    }
    return;
  }

  // ── Normal payment flow (amount > 0) — needs a real connection + transaction ──
  connection.getConnection((errConn, conn) => {
    if (errConn) {
      console.error("getConnection error:", errConn.message);
      return res.status(500).json({ success: false, message: "DB connection failed" });
    }

    conn.beginTransaction((err) => {
      if (err) {
        conn.release();
        return res.status(500).json({ success: false, message: "Transaction failed" });
      }

      const rollbackWith = (statusCode, message, errObj) => {
        conn.rollback(() => {
          conn.release();
          if (errObj) console.error(message, errObj.message || errObj);
          res.status(statusCode).json({ success: false, message });
        });
      };

      const paymentQuery = `
        INSERT INTO payment
        (account_id, job_id, package_id,
         card_last4, card_brand, card_holder, card_expiry,
         amount, currency,
         payment_type, payment_method, payment_status,
         payment_reference)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Paid', ?)
      `;

      conn.query(
        paymentQuery,
        [
          userId, jobId || null, packageId || null,
          last4, brand, cardName || null, cardExpiry || null,
          amount, currency || "PKR",
          payment_type || "job", method,
          reference || null,
        ],
        (err1, paymentResult) => {
          if (err1) {
            return rollbackWith(500, "Payment failed", err1);
          }

          const paymentId = paymentResult.insertId;

          const saveCardIfNeeded = (cb) => {
            if (method?.toLowerCase() === "card" && saveForLater && last4) {
              const checkQuery = `SELECT id FROM saved_cards WHERE account_id = ? AND card_last4 = ? AND card_brand = ?`;
              conn.query(checkQuery, [userId, last4, brand], (errCheck, rows) => {
                if (errCheck) return rollbackWith(500, "Card check failed", errCheck);
                if (rows.length === 0) {
                  const insertCard = `
                    INSERT INTO saved_cards (account_id, card_last4, card_brand, card_holder, card_expiry, accepted_types, payment_token)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                  `;
                  conn.query(
                    insertCard,
                    [userId, last4, brand, cardName || null, cardExpiry || null, JSON.stringify(acceptedTypes || []), payment_token],
                    (errInsert) => {
                      if (errInsert) {
                        return rollbackWith(500, "Saving card failed", errInsert);
                      }

                      logAudit({
                        tableName: "history",
                        entityType: "employer",
                        entityId: userId,
                        action: "CARD_SAVED",
                        data: {
                          event: "Payment card saved",
                          card_brand: brand,
                          card_last4: last4,
                        },
                        changedBy: userId,
                      });

                      cb();
                    }
                  );
                } else { cb(); }
              });
            } else { cb(); }
          };

          saveCardIfNeeded(() => {
            if (!packageId) {
              return conn.commit((err4) => {
                if (err4) return rollbackWith(500, "Commit failed", err4);

                conn.release();

                logAudit({
                  tableName: "history",
                  entityType: "employer",
                  entityId: userId,
                  action: "PAYMENT",
                  data: {
                    event: "Payment recorded",
                    amount,
                    currency: currency || "PKR",
                    method,
                    packageId: packageId || null,
                    jobId: jobId || null,
                    payment_type: payment_type || "job",
                    paymentId,
                  },
                  changedBy: userId,
                });

                return res.status(201).json({
                  success: true,
                  message: "Payment saved",
                  payment_id: paymentId
                });
              });
            }

            if (payment_type === "candidate_boost") {
              return conn.commit((err4) => {
                if (err4) return rollbackWith(500, "Commit failed", err4);

                conn.release();

                logAudit({
                  tableName: "history",
                  entityType: "employer",
                  entityId: userId,
                  action: "PAYMENT",
                  data: {
                    event: "Payment recorded",
                    amount,
                    currency: currency || "PKR",
                    method,
                    packageId: packageId || null,
                    jobId: jobId || null,
                    payment_type: payment_type || "job",
                    paymentId,
                  },
                  changedBy: userId,
                });
                return res.status(201).json({ success: true, message: "Boost payment successful", payment_id: paymentId });
              });
            }

            subcribePackageInternal({ userId, packageId, paymentId })
              .then((subResult) => {
                const finalize = () => {
                  conn.commit((err4) => {
                    if (err4) return rollbackWith(500, "Commit failed", err4);

                    conn.release();

                    // ── Billing event (immutable revenue record) ──
                    logBillingEvent({
                      account_id:    userId,
                      payment_id:    paymentId,
                      event_type:    'subscription',
                      pricing_model: null, // you don't have pkg.pricing_model here, null is fine
                      amount:        amount,
                      description:   `Package subscription: packageId ${packageId}`,
                    }).catch(err => console.error("billingLogger error:", err));

                    logAudit({
                      tableName: "history",
                      entityType: "employer",
                      entityId: userId,
                      action: "PAYMENT",
                      data: {
                        event: "Payment recorded",
                        amount,
                        currency: currency || "PKR",
                        method,
                        packageId: packageId || null,
                        jobId: jobId || null,
                        payment_type: payment_type || "job",
                        paymentId,
                      },
                      changedBy: userId,
                    });

                    return res.status(201).json({
                      success: true,
                      message: "Payment + Subscription successful 🚀",
                      payment_id: paymentId,
                      subscription_id: subResult.subscriptionId,
                    });
                  });
                };

                if (jobId) {
                  conn.query(
                    `UPDATE job_posts SET approval_status = 'Pending' WHERE id = ? AND account_id = ?`,
                    [jobId, userId],
                    (err3) => {
                      if (err3) return rollbackWith(500, "Job update failed", err3);
                      finalize();
                    }
                  );
                } else { finalize(); }
              })
              .catch((err2) => {
                return rollbackWith(500, err2.message, err2);
              });
          });
        }
      );
    });
  });
};

const getSavedCards = (req, res) => {
  const { userId } = req.params;

  const query = `
    SELECT id, card_last4, card_brand, card_holder, card_expiry, accepted_types, payment_token
    FROM saved_cards
    WHERE account_id = ?
    ORDER BY id DESC
  `;

  connection.query(query, [userId], (err, results) => {
    if (err) {
      console.error("getSavedCards error:", err.message);
      return res.status(500).json({ success: false, error: err.message });
    }

    const cards = results.map(c => {
      let accepted_types = [];
      try {
        accepted_types = c.accepted_types ? JSON.parse(c.accepted_types) : [];
      } catch (e) {
        accepted_types = [];
      }
      return { ...c, accepted_types };
    });

    res.json({ success: true, cards });
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

  connection.getConnection((errConn, conn) => {
    if (errConn) {
      return res.status(500).json({ success: false, message: "DB connection failed" });
    }

    conn.beginTransaction((err) => {
      if (err) {
        conn.release();
        return res.status(500).json({ success: false, message: "Transaction failed" });
      }

      const rollbackWith = (statusCode, message, errObj) => {
        conn.rollback(() => {
          conn.release();
          if (errObj) console.error(message, errObj.message || errObj);
          res.status(statusCode).json({ success: false, message });
        });
      };

      const insertPaymentSql = `
        INSERT INTO payment
        (account_id, package_id,
         card_last4, card_brand, card_holder,
         amount, currency,
         payment_type, payment_method, payment_status,
         payment_reference)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'registration', ?, 'Paid', ?)
      `;

      conn.query(
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
            return rollbackWith(500, "Payment failed", err1);
          }

          const updateCompanySql = `
            UPDATE company_info SET has_package = TRUE WHERE account_id = ?
          `;

          conn.query(updateCompanySql, [userId], (err2, result) => {
            if (err2 || result.affectedRows === 0) {
              return rollbackWith(500, "Activation failed", err2);
            }

            conn.commit((err3) => {
              if (err3) {
                return rollbackWith(500, "Commit failed", err3);
              }

              conn.release();

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
  });
};


module.exports = {
  createPaymentTable,
  createSaveCardTable,
  addPayment,
  addRegistrationPayment,
  getSavedCards
}