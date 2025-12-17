const express = require("express");
const router = express.Router();
const connection = require("../connection");

// ============================
// Create bank_names table
// ============================
const createCardTable = () => {
const createTableQuery = `
  CREATE TABLE IF NOT EXISTS card(
  id INT AUTO_INCREMENT PRIMARY KEY,
  account_id INT,
  bankName VARCHAR(255),
        cardType VARCHAR(20),
        cardholder VARCHAR(255),
        cardNumber VARCHAR(19),
        expiry CHAR(10),
        cvv CHAR(4),
 
  FOREIGN KEY (account_id) REFERENCES account(id)
);
`;

connection.query(createTableQuery, (err) => {
  if (err) {
    return console.error("❌ Error creating card table:", err.message);
  }
  console.log("✅ Card Table created successfully");
});
}

module.exports = router;
