// utils/billingLogger.js
const connection = require("../connection");

const logBillingEvent = ({
  account_id,
  job_id        = null,
  payment_id    = null,
  event_type,
  pricing_model = null,
  amount,
  currency      = "PKR",
  description   = null,
}) => {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO billing_events
        (account_id, job_id, payment_id, event_type, pricing_model, amount, currency, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    connection.query(
      sql,
      [account_id, job_id, payment_id, event_type, pricing_model, amount, currency, description],
      (err, result) => {
        if (err) return reject(err);
        resolve(result.insertId);
      }
    );
  });
};
const logDailySpend = ({ job_id, account_id, amount, clicks = 1 }) => {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO daily_spend_log (job_id, account_id, spend_date, amount, clicks)
      VALUES (?, ?, CURDATE(), ?, ?)
      ON DUPLICATE KEY UPDATE
        amount     = amount + VALUES(amount),
        clicks     = clicks + VALUES(clicks),
        updated_at = NOW()
    `;
    connection.query(sql, [job_id, account_id, amount, clicks], (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};

module.exports = { logBillingEvent, logDailySpend };