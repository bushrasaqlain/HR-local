
const express = require("express");
const router = express.Router();
const connection = require("../connection");



const createCartTable = () => {
    const cartTable = `
CREATE TABLE IF NOT EXISTS cart(
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id VARCHAR(5) UNIQUE DEFAULT NULL,
  account_id INT,
  package_type VARCHAR(25),
  price VARCHAR(10),
  status ENUM('active', 'inactive', 'expire') DEFAULT 'inactive',
  is_checkout BOOLEAN DEFAULT false,
  Active_at TIMESTAMP,
  Expire_At TIMESTAMP,

  FOREIGN KEY (account_id) REFERENCES account(id)
);
`;

    // Execute the queries to create the tables
    connection.query(cartTable, function (err, results, fields) {
        if (err) {
            return console.error(err.message);
        }
        console.log("cart table created successfully.....");
    });
}

function generateUniqueOrderId() {
    // Logic to generate a random 5-digit ID
    const uniqueId = Math.floor(10000 + Math.random() * 90000).toString();
    return uniqueId;
}

const addCart = (req, res) => {
    const userId = req.params.userId;

    const { package_type, price } = req.body;

    // Generate a unique order ID
    const orderId = generateUniqueOrderId();
    const existingInactivePackageSql = 'SELECT id FROM cart WHERE account_id = ? AND status = "inactive"';
    connection.query(existingInactivePackageSql, [userId], function (err, existingInactiveResult) {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Internal Server Error" });
        }

        // If there is already an inactive package, prevent adding a new one
        if (existingInactiveResult.length > 0) {
            return res.status(400).json({ error: "Already subscribe the package" });
        }

        // Generate a unique order ID
        const orderId = generateUniqueOrderId();

        // Insert into the cart table with "inactive" status and order_id
        const insertSql = 'INSERT INTO cart (order_id, account_id, package_type, price, status) VALUES (NULL, ?, ?, ?, "inactive")';
        connection.query(insertSql, [userId, package_type, price], function (err, result) {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "Internal Server Error" });
            }

            res.json({ message: 'Item added to cart successfully', insertedId: result.insertId });
        });
    });

}

const getCart = (req, res) => {
    const userId = req.params.userId;

    const query = `
      SELECT 
      id, order_id, Active_at
    FROM cart
    WHERE 
      account_id = ? AND status = "active"
    
      `;

    connection.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error executing SQL query:', err);
            res.status(500).json({ error: 'Internal Server Error' });
        } else {
            res.json(results);
        }
    });
}

const getCartCount=(req, res) => {
    const userId = req.params.userId;

    // Select query to count the number of packages for the specified user
    const countSql = 'SELECT COUNT(*) AS packageCount FROM cart WHERE account_id = ? AND status = "inactive" AND is_checkout = false';


    connection.query(countSql, [userId], function (err, result) {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Internal Server Error" });
        }

        // Extract the count from the result
        const packageCount = result[0].packageCount;

        res.json({ userId, packageCount });
    });
}

const getCartCountbyStatus=(req, res) => {
     const userId = req.params.userId;

  // Select query to count the number of packages for the specified user
  const countSql = 'SELECT COUNT(*) AS notificationCount FROM cart WHERE account_id = ? AND status = "active" ';


  connection.query(countSql, [userId], function (err, result) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    // Extract the count from the result
    const notificationCount = result[0].notificationCount;

    res.json({ userId,notificationCount });
  });
}

const getPackagefromCart = (req, res) => {
     const userId = req.params.userId;

  // Select query to retrieve package names for the specified user with inactive status
  const selectSql = 'SELECT package_type FROM cart WHERE account_id = ? AND status = "inactive" AND is_checkout = false';

  connection.query(selectSql, [userId], function (err, result) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    // Extract the package names from the result
    const inactivePackages = result.map(row => row.package_type);

    res.json({ userId, inactivePackages });
  });
}
const getCartDetails = (req, res) => {
     const userId = req.params.userId;

  // Select query to retrieve package type name and price for the specified user
  const selectSql = 'SELECT id, package_type, price FROM cart WHERE account_id = ? AND status= "inactive" AND is_checkout = false';

  connection.query(selectSql, [userId], function (err, results) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    // Extract package type name and price from the result
    const packages = results.map(result => ({
      id:result.id,
      package_type: result.package_type,
      price: result.price
    }));

    res.json({ userId, packages });
  });
}
const inactiveCartItems = (req, res) => {
    const sql = `
    SELECT c.id, c.package_type, c.price, c.status, a.username AS username
    FROM cart c
    JOIN account a ON c.account_id = a.id
    WHERE c.status = 'inactive'
  `;

  connection.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    res.json(results);
  });
}

const activeCartItems = (req, res) => { 
    const sql = `
    SELECT c.id, c.package_type, c.price, c.status, a.username AS username
    FROM cart c
    JOIN account a ON c.account_id = a.id
    WHERE c.status = 'active'
  `;

  connection.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    res.json(results);
  });
}

const expiredCartItems = (req, res) => { 
    const sql = `
    SELECT c.id, c.package_type, c.price, c.status,c.Expire_At, a.username AS username
    FROM cart c
    JOIN account a ON c.account_id = a.id
    WHERE c.status = 'expire'
  `;

  connection.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    res.json(results);
  });
}

const deleteCart=(req, res) => {
    const userId = req.params.userId;
  const cartId = req.params.cartId;

  // Check if the status is 'inactive'
  const checkStatusSql = 'SELECT status FROM cart WHERE account_id = ? AND id = ?';
  connection.query(checkStatusSql, [userId, cartId], function (err, result) {
    // Provide the actual value for 'someId' in the array
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  
    if (!result || result.length === 0 || result[0].status !== 'inactive') {
      return res.status(400).json({ error: "Cannot delete an active package" });
    }
  
    const deleteSql = 'DELETE FROM cart WHERE account_id = ? AND id = ?';
    connection.query(deleteSql, [userId, cartId], function (err, result) {
      // Provide the actual value for 'someId' in the array
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal Server Error" });
      }
  
      res.json({ message: 'Package deleted from cart successfully' });
    });
  });
}

const updateCart = (req, res) => {
    const packageId = req.params.packageId;
    
      // Get the account_id of the package being updated
      const getAccountIdSql = 'SELECT account_id FROM cart WHERE id = ?';
      connection.query(getAccountIdSql, [packageId], (err, accountResult) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: "Internal Server Error" });
        }
    
        if (accountResult.length === 0) {
          return res.status(404).json({ error: "Package not found" });
        }
    
        const accountId = accountResult[0].account_id;
    
        // Start a transaction to ensure atomicity
        connection.beginTransaction((beginTransactionErr) => {
          if (beginTransactionErr) {
            console.error(beginTransactionErr);
            return res.status(500).json({ error: "Internal Server Error" });
          }
    
          // Update the status of the clicked package to 'active'
          const updatePackageSql = `
            UPDATE cart 
            SET 
              status = "active",
              active_at = CURRENT_TIMESTAMP,
              Expire_At = DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 30 DAY)  -- Update expiration to 10 minutes later
            WHERE id = ?
          `;
          connection.query(updatePackageSql, [packageId], (updatePackageErr) => {
            if (updatePackageErr) {
              connection.rollback();
              console.error(updatePackageErr);
              return res.status(500).json({ error: "Internal Server Error" });
            }
    
            // Update the status of other packages with the same account_id to 'inactive' in cart table
            const updateOthersSql = 'UPDATE cart SET status = "expire" WHERE account_id = ? AND id != ?';
            connection.query(updateOthersSql, [accountId, packageId], (updateOthersErr) => {
              if (updateOthersErr) {
                connection.rollback();
                console.error(updateOthersErr);
                return res.status(500).json({ error: "Internal Server Error" });
              }
    
              // Update the status of corresponding records in job_posts table
              const updateJobPostsSql = 'UPDATE job_posts SET Package_status = "expire" WHERE account_id = ? AND Pkg_id != ?';
              connection.query(updateJobPostsSql, [accountId, packageId], (updateJobPostsErr) => {
                if (updateJobPostsErr) {
                  connection.rollback();
                  console.error(updateJobPostsErr);
                  return res.status(500).json({ error: "Internal Server Error" });
                }
    
                // Update the payment status to 'Paid' for the same package type
                const updatePaymentStatusSql = 'UPDATE Payment SET payment_status = "Paid" WHERE account_id = ? AND package_type = (SELECT package_type FROM cart WHERE id = ?)';
                connection.query(updatePaymentStatusSql, [accountId, packageId], (updatePaymentStatusErr) => {
                  if (updatePaymentStatusErr) {
                    connection.rollback();
                    console.error(updatePaymentStatusErr);
                    return res.status(500).json({ error: "Internal Server Error" });
                  }
    
                  // Commit the transaction
                  connection.commit((commitErr) => {
                    if (commitErr) {
                      connection.rollback();
                      console.error(commitErr);
                      return res.status(500).json({ error: "Internal Server Error" });
                    }
    
                    res.json({ message: 'Package activated successfully' });
                  });
                });
              });
            });
          });
        });
      });
    }
module.exports = {
    createCartTable,
    addCart,
    getCart,
    getCartCount,
    getCartCountbyStatus,
    getPackagefromCart,
    getCartDetails,
    inactiveCartItems,
    activeCartItems,
    expiredCartItems,
    deleteCart,
    updateCart
};