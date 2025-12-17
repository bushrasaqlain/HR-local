
require("dotenv").config();
const mysql = require("mysql2");
// databse connection
var mysqlConnection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

mysqlConnection.connect((err) => {
  if (err) {
    console.log("Database Connection Error " + JSON.stringify(err, undefined, 2));
  } else {
    console.log("Connection Successfully");
  }
});

module.exports = mysqlConnection;
