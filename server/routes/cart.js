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
const createPaymentTable = () => {
const paymentTable = `
CREATE TABLE IF NOT EXISTS Payment(
  id INT AUTO_INCREMENT PRIMARY KEY,
  account_id INT,
  package_type VARCHAR(25),
  price VARCHAR(10),
  payment_method ENUM('Card', 'Cash') DEFAULT 'Card',
  payment_status ENUM('Paid', 'Not Paid') DEFAULT 'Not Paid',
  order_id VARCHAR(5) UNIQUE,  -- Specify the data type (VARCHAR) and mark as UNIQUE
  invoice_id INT,
  FOREIGN KEY (order_id) REFERENCES cart(order_id),
  FOREIGN KEY (account_id) REFERENCES account(id),
  FOREIGN KEY (invoice_id) REFERENCES Invoice(id)
);

`;
// Execute the queries to create the tables
connection.query(paymentTable, function (err, results, fields) {
  if (err) {
    return console.error(err.message);
  }
  console.log("Payment table created successfully");
});
}

  handlePaymentLogic();
function handlePaymentLogic() {
  router.post('/payment/:userId', async (req, res) => {
    const userId = req.params.userId;
    const { package_type, price, payment_method, payment_status } = req.body;

    // Step 1: Update the cart table's is_checkout field and set order_id if it's null
    const updateCartQuery = 'UPDATE cart SET is_checkout = true, order_id = ? WHERE account_id = ? AND status= "inactive" ';
    const paymentOrderId = generate_order_id();

    connection.query(updateCartQuery, [paymentOrderId, userId], function (updateErr, updateResult) {
      if (updateErr) {
        console.error(updateErr);
        return res.status(500).json({ error: "Internal Server Error" });
      }

      console.log(updateResult); // Log the result of the update query

      // Retrieve the updated order_id
      const updatedOrderId = paymentOrderId;  // Use the generated value or retrieve it from the database if needed

      // Step 2: Insert into Invoice table to get the invoice_id
      const checkOrderQuery = 'SELECT COUNT(*) as count FROM cart WHERE order_id = ?';
      connection.query(checkOrderQuery, [updatedOrderId], function (checkOrderErr, checkOrderResult) {
        if (checkOrderErr) {
          console.error(checkOrderErr);
          return res.status(500).json({ error: "Internal Server Error" });
        }

        const orderExists = checkOrderResult[0].count > 0;

        if (!orderExists) {
          return res.status(500).json({ error: "Order does not exist in the cart" });
        }

        const insertInvoiceSql = 'INSERT INTO Invoice (account_id, price, order_id) VALUES (?, ?, ?)';
        const invoiceOrderId = generate_order_id();

        connection.query(insertInvoiceSql, [userId, price, updatedOrderId], function (invoiceErr, invoiceResult) {
          if (invoiceErr) {
            console.error(invoiceErr);
            return res.status(500).json({ error: "Internal Server Error" });
          }

          const insertedInvoiceId = invoiceResult.insertId;

          // Step 3: Insert into Payment table with the obtained invoice_id
          const insertPaymentSql = 'INSERT INTO Payment (account_id, package_type, price, payment_method, payment_status, invoice_id, order_id) VALUES (?, ?, ?, ?, ?, ?, ?)';
          const paymentOrderId = updatedOrderId;

          connection.query(insertPaymentSql, [userId, package_type, price, payment_method, payment_status, insertedInvoiceId, paymentOrderId], function (err, result) {
            if (err) {
              console.error(err);
              return res.status(500).json({ error: "Internal Server Error" });
            }

            const insertedPaymentId = result.insertId;

            res.json({ message: 'Payment record inserted successfully', insertedId: insertedPaymentId, orderId: updatedOrderId });
          });
        });
      });
    });
  });
}
function generate_order_id() {
  return Math.floor(10000 + Math.random() * 90000).toString();
}
////////////////////////////////////////////get the packages from the database/////////////
router.get('/PackagesDetail/:userId', (req, res) => {
 
});

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
