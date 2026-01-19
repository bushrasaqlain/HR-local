const express = require("express");
const router = express.Router();
const connection = require("../connection");
const authMiddleware = require("../middleware/auth");
const checkRole = require("../middleware/checkRole");

function updateStatus() {
  const currentDate = new Date();
  const updateQuery = `
    UPDATE cart
    SET status = 'expire'
    WHERE Expire_At <= ? AND status <> 'expire';
  `;

  connection.query(updateQuery, [currentDate], (error, updateResults) => {
    if (error) {
      console.error('Error updating status:', error);
    } 
    // else {
    //   console.log(`Status updated for ${updateResults.affectedRows} expired items.`);
    // }
  });
}
// Run the updateStatus function periodically
setInterval(updateStatus, 60000); // Check every minute



const createInvoiceTable = () => {
const InvoiceTable = `
CREATE TABLE IF NOT EXISTS Invoice(
  id INT AUTO_INCREMENT PRIMARY KEY,
  account_id INT,
  price VARCHAR(10),
  order_id VARCHAR(5) UNIQUE,
  invoice_generated_Date_Time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES cart(order_id),
  FOREIGN KEY (account_id) REFERENCES account(id)
);
`;

connection.query(InvoiceTable, function (err, results, fields) {
  if (err) {
    return console.error(err.message);
  }
  console.log("Invoice table created successfully");

  // After creating the Invoice table, proceed with the payment logic

});
}

function generate_order_id() {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

///////////////////////////////////get the active date and expiry date for application deadline///////
router.get('/Application_deadline/:userId', (req, res) => {
  const userId = req.params.userId;

  // Select query to get package information for the specified user
  const packageSql = 'SELECT package_type, Active_at, Expire_At FROM cart WHERE account_id = ? AND status = "active"';

  connection.query(packageSql, [userId], function (err, result) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    // Check if there are packages for the user
    if (result.length === 0) {
      return res.status(404).json({ error: "No active packages found for the user" });
    }

    // Extract the package information from the result
    const packageInfo = result.map(row => ({
      package_type: row.package_type,
      Active_at: row.Active_at,
      Expire_At: row.Expire_At
    }));

    res.json({ userId, packageInfo });
  });
});

module.exports = router;
