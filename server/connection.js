
// require("dotenv").config();
// const mysql = require("mysql2");

// // databse connection
// var mysqlConnection = mysql.createConnection({
//     host: process.env.DB_HOST,
//     user: process.env.DB_USER,
//     password: process.env.DB_PASSWORD,
//     database: process.env.DB_NAME,
    
// });

// mysqlConnection.connect((err) => {
//   if (err) {
//     console.log("Database Connection Error " + JSON.stringify(err, undefined, 2));
//   } else {
//     console.log("Connection Successfully");
//   }
// });

// module.exports = mysqlConnection;
require("dotenv").config();
const mysql = require("mysql2");

const pool = mysql.createPool({
  host:               process.env.DB_HOST,
  user:               process.env.DB_USER,
  password:           process.env.DB_PASSWORD,
  database:           process.env.DB_NAME,
  connectionLimit:    50,
  waitForConnections: true,
  queueLimit:         0,
});

pool.getConnection((err, connection) => {
  if (err) {
    console.log("Database Connection Error " + JSON.stringify(err, undefined, 2));
  } else {
    console.log("Pool Connected Successfully");
    connection.release();
  }
});

module.exports = pool;