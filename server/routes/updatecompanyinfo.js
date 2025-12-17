const express = require("express");
const router = express.Router();
const connection = require("../connection");
const multer = require("multer");
//////////////////////update company profile api////////////////////
const storage = multer.memoryStorage(); // Use memory storage for handling base64
const logo = multer({ storage: storage });
router.put("/company_update/:userId", logo.single("logo"), (req, res) => {
  const userId = req.params.userId;
  const image = req.file ? req.file.buffer : null; // New image data, if provided

  // Construct the update query based on the fields received in the request body
  let updateFields = "";
  const updateValues = [];

  if (req.body.company_name && /^[a-zA-Z0-9\s]+$/.test(req.body.company_name)) {
    updateFields += "company_name = ?, ";
    updateValues.push(req.body.company_name);
  }
  if (req.body.email_address) {
    updateFields += "email_address = ?, ";
    updateValues.push(req.body.email_address);
  }
  if (req.body.phone) {
    updateFields += "phone = ?, ";
    updateValues.push(req.body.phone);
  }
  if (req.body.NTN) {
    updateFields += "NTN = ?, ";
    updateValues.push(req.body.NTN);
  }
  if (req.body.city) {
    updateFields += "city = ?, ";
    updateValues.push(req.body.city);
  }
  if (req.body.multiple_select) {
    // Assuming multiple_select is an array, you can join it to create a string
    const multipleSelectString = req.body.multiple_select.join(', ');
    updateFields += "multiple_select = ?, ";
    updateValues.push(multipleSelectString);
  }
  if (req.body.address) {
    updateFields += " address = ?, ";
    updateValues.push(req.body.address);
  }
  // Remove the trailing comma and space from updateFields
  updateFields = updateFields.slice(0, -2);

  if (image) {
    updateFields += " logo = ?";
    updateValues.push(image);
  }
  
  // Add userId to updateValues
  updateValues.push(userId);
  
  // Check if there are any fields to update
  if (updateValues.length > 2 || (updateValues.length === 2 && updateValues[1] !== undefined && Object.keys(updateValues[1]).length > 0)) {
    // updateValues includes userId and potentially logo, so check if it has more than two elements
    const sql = `UPDATE company_info SET ${updateFields} WHERE account_id = ?`;
  
    connection.query(sql, updateValues, (err, data) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal Server Error" });
      }
      return res.json({ message: "Company info updated successfully" });
    });
  } else {
    // If there are no fields to update, return a response indicating that
    return res.status(400).json({ error: "No fields to update" });
  }
});
module.exports = router;