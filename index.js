require("dotenv").config();

const connection = require("./server/connection");
const app = require("./server/app");

const connectDB = () =>
  new Promise((resolve, reject) => {
    connection.getConnection((err, conn) => {
      if (err) reject(err);
      else {
        conn.release();
        resolve();
      }
    });
  });

connectDB()
  .then(() => {
    console.log("DB connected");
    const PORT = process.env.PORT || 8080;

    app.listen(PORT, () =>
      console.log(`Server running on port ${PORT}`)
    );
  })
  .catch((err) =>
    console.error("Database connection error", err)
  );