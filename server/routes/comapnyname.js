const express = require('express');
const router = express.Router();
const connection = require('../connection');
const multer = require("multer");
const storage = multer.memoryStorage(); // Use memory storage for handling base64
const logo = multer({ storage: storage });
router.get('/companyname/:userId', (req, res) => {
 
  const userId = req.params.userId;
  // Fetch user details including full_Name and Image for the given userId
  const userQuery = `
    SELECT id, username
    FROM account
    WHERE id = ?
  `;

  // Execute user query with the userId as a parameter
  connection.query(userQuery, [userId], (err, userResults) => {
    if (err) {
      console.error('Error fetching user details:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    if (userResults.length === 0) {
      return res.status(404).json({ error: 'User not found with the specified ID' });
    }

    const user = userResults[0];

    // Convert the received image data to a base64 string
    // const base64Image = Buffer.from(user.Image).toString('base64');

    // Send the user details in the JSON response, including the base64 image
    res.json({
      id: user.id,
      full_name: user.username,
      // Image: base64Image,
    });
  });
});




// router.get('/companyname/:userId', (req, res) => {
//   const userId = req.params.userId;

//   // Fetch user details including full_Name and Image for the given userId
//   const userQuery = `
//     SELECT id, full_name, Image
//     FROM account
//     WHERE id = ?
//   `;

//   // Execute user query with the userId as a parameter
//   connection.query(userQuery, [userId], (err, userResults) => {
//     if (err) {
//       console.error('Error fetching user details:', err);
//       return res.status(500).json({ error: 'Internal Server Error' });
//     }

//     if (userResults.length === 0) {
//       return res.status(404).json({ error: 'User not found with the specified ID' });
//     }

//     const user = userResults[0];
//     const base64Image = Buffer.from(user.Image).toString('base64');
//     const userWithBase64Image = { ...user, Image: base64Image };

//     res.status(200).json(userWithBase64Image);
//   });
// });
router.get("/user/:userId", (req, res) => {
  const userId = req.params.userId;
  const sql = "SELECT id, full_name, Image FROM account WHERE id = ?";
  
  connection.query(sql, [userId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const { id, full_name, Image } = results[0];
    res.json({ id, full_name, Image });
  });
});


module.exports = router;
