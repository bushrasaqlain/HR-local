const connection = require("../connection");

const createAlertSettingsTable = () => {
  const sql = `
  CREATE TABLE IF NOT EXISTS alert_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    account_id INT NOT NULL UNIQUE,
    low_credits_enabled BOOLEAN DEFAULT TRUE,
    low_credits_threshold INT DEFAULT 20,
    package_expiry_enabled BOOLEAN DEFAULT TRUE,
    package_expiry_days INT DEFAULT 7,
    budget_threshold_enabled BOOLEAN DEFAULT FALSE,
    budget_threshold_value INT DEFAULT 80,
    unusual_spending_enabled BOOLEAN DEFAULT TRUE,
    unusual_spending_sensitivity VARCHAR(10) DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES account(id) ON DELETE CASCADE
  );
  `;

  connection.query(sql, (err) => {
    if (err) {
      console.error("Alert settings table error:", err.message);
      return;
    }
    console.log("✅ Alert settings table ready");
  });
};

const createNotificationsTable = () => {
  const sql = `
  CREATE TABLE IF NOT EXISTS alert_notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    account_id INT NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    package_name VARCHAR(255),
    severity VARCHAR(20) DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES account(id) ON DELETE CASCADE,
    INDEX idx_account_read (account_id, is_read)
  );
  `;

  connection.query(sql, (err) => {
    if (err) {
      console.error("Notifications table error:", err.message);
      return;
    }
    console.log("✅ Notifications table ready");
  });
};

const getAlertSettings = (accountId) => {
  return new Promise((resolve, reject) => {
    const query = `SELECT * FROM alert_settings WHERE account_id = ?`;
    connection.query(query, [accountId], (err, results) => {
      if (err) return reject(err);
      
      if (results.length === 0) {
        // Return default settings
        return resolve({
          lowCredits: { enabled: true, threshold: 20 },
          packageExpiry: { enabled: true, daysBefore: 7 },
          budgetThreshold: { enabled: false, threshold: 80 },
          unusualSpending: { enabled: true, sensitivity: "medium" }
        });
      }
      
      const row = results[0];
      resolve({
        lowCredits: { enabled: row.low_credits_enabled === 1, threshold: row.low_credits_threshold },
        packageExpiry: { enabled: row.package_expiry_enabled === 1, daysBefore: row.package_expiry_days },
        budgetThreshold: { enabled: row.budget_threshold_enabled === 1, threshold: row.budget_threshold_value },
        unusualSpending: { enabled: row.unusual_spending_enabled === 1, sensitivity: row.unusual_spending_sensitivity }
      });
    });
  });
};

const saveAlertSettings = (accountId, settings) => {
  return new Promise((resolve, reject) => {
    const { lowCredits, packageExpiry, budgetThreshold, unusualSpending } = settings;

    const checkQuery = `SELECT id FROM alert_settings WHERE account_id = ?`;
    connection.query(checkQuery, [accountId], (err, results) => {
      if (err) return reject(err);
      
      if (results.length === 0) {
        const insertQuery = `
          INSERT INTO alert_settings 
          (account_id, low_credits_enabled, low_credits_threshold,
           package_expiry_enabled, package_expiry_days,
           budget_threshold_enabled, budget_threshold_value,
           unusual_spending_enabled, unusual_spending_sensitivity)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        connection.query(insertQuery, [
          accountId,
          lowCredits.enabled, lowCredits.threshold,
          packageExpiry.enabled, packageExpiry.daysBefore,
          budgetThreshold.enabled, budgetThreshold.threshold,
          unusualSpending.enabled, unusualSpending.sensitivity
        ], (err2, result) => {
          if (err2) return reject(err2);
          resolve(result);
        });
      } else {
        const updateQuery = `
          UPDATE alert_settings 
          SET low_credits_enabled = ?, low_credits_threshold = ?,
              package_expiry_enabled = ?, package_expiry_days = ?,
              budget_threshold_enabled = ?, budget_threshold_value = ?,
              unusual_spending_enabled = ?, unusual_spending_sensitivity = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE account_id = ?
        `;
        connection.query(updateQuery, [
          lowCredits.enabled, lowCredits.threshold,
          packageExpiry.enabled, packageExpiry.daysBefore,
          budgetThreshold.enabled, budgetThreshold.threshold,
          unusualSpending.enabled, unusualSpending.sensitivity,
          accountId
        ], (err2, result) => {
          if (err2) return reject(err2);
          resolve(result);
        });
      }
    });
  });
};

const createNotification = (accountId, type, title, message, packageName = null, severity = 'info') => {
  return new Promise((resolve, reject) => {
    const query = `
      INSERT INTO alert_notifications 
      (account_id, notification_type, title, message, package_name, severity)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    connection.query(query, [accountId, type, title, message, packageName, severity], (err, result) => {
      if (err) {
        console.error("Failed to create notification:", err);
        return reject(err);
      }
      resolve(result);
    });
  });
};

const getUnreadNotificationsCount = (accountId) => {
  return new Promise((resolve, reject) => {
    const query = `SELECT COUNT(*) as count FROM alert_notifications WHERE account_id = ? AND is_read = FALSE`;
    connection.query(query, [accountId], (err, results) => {
      if (err) return reject(err);
      resolve(results[0]?.count || 0);
    });
  });
};

const getNotifications = (accountId, limit = 50) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT * FROM alert_notifications 
      WHERE account_id = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `;
    connection.query(query, [accountId, limit], (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

const markNotificationAsRead = (notificationId, accountId) => {
  return new Promise((resolve, reject) => {
    const query = `UPDATE alert_notifications SET is_read = TRUE WHERE id = ? AND account_id = ?`;
    connection.query(query, [notificationId, accountId], (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};

const markAllNotificationsAsRead = (accountId) => {
  return new Promise((resolve, reject) => {
    const query = `UPDATE alert_notifications SET is_read = TRUE WHERE account_id = ? AND is_read = FALSE`;
    connection.query(query, [accountId], (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};

module.exports = {
  createAlertSettingsTable,
  createNotificationsTable,
  getAlertSettings,
  saveAlertSettings,
  createNotification,
  getUnreadNotificationsCount,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
};