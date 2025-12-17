const express = require("express");
const router = express.Router();
const connection = require("../connection.js");

const authMiddleware = require("../middleware/auth.js");
const accountController = require("../controller/accountController.js");
const multer = require("multer");

const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },

});


router.get("/api/me", authMiddleware, accountController.getAccountDetail);

router.get('/getAccountType/:userId',accountController.getAccountType);

router.get('/getName/:userId', accountController.getUserName);


router.post("/account", upload.none(),accountController.register); 

router.post("/login", accountController.login);


router.get('/admin/:userId', accountController.adminLogin);

router.post("/changepassword", authMiddleware, accountController.changePassword);

router.get('/account/email',accountController.getDetailByEmail);

router.get('/account/name',accountController.getDetailByName );

router.put("/changeAccountStatus", authMiddleware,accountController.updateAccountStatus);

router.get("/employers", (req, res) => {
  const sql = `
    SELECT 
      a.id AS id,
      a.email,
      ci.company_name AS companyName,
      ci.NTN,
      ci.department
    FROM account a
    LEFT JOIN company_info ci ON a.id = ci.account_id
    WHERE a.accountType = 'employer'
  `;

  connection.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal Server Error" });
    }

    if (results.length === 0) {
      return res.json([]);
    }

    const employers = results.map(employer => ({
      ...employer,
      image: employer.image ? employer.image.toString('base64') : null
    }));

    return res.json(employers);
  });
});


//REMOVE 
router.put("/companyinfochanges/:userId", upload.single("logo"), (req, res) => {
  const accountId = req.params.userId;

  try {
    let sql = "UPDATE account SET ";
    let values = [];
    const updateFields = [];

    // Define the fields you want to update
    const fieldsToUpdate = ["fcompany_name", "email", "phone", "NTN", "city", "complete_address"];

    // Loop through the fields and check if they are present in the request body
    fieldsToUpdate.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateFields.push(`${field}=?`);
        values.push(req.body[field]);
      }
    });

    if (req.body.multiple_select !== undefined) {
      updateFields.push("department=?");
      // Ensure that multiple_select is always treated as an array
      const departments = Array.isArray(req.body.multiple_select) ? req.body.multiple_select : [req.body.multiple_select];
      values.push(departments.join(","));
    }


    // Add the logo update fields if a new logo is uploaded
    if (req.file) {
      updateFields.push("Image=?");
      values.push(req.file.buffer);
    }

    sql += updateFields.join(", ");
    sql += " WHERE id=?";
    values.push(accountId);

    connection.query(sql, values, (err, data) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal Server Error" });
      }
      return res.json(data);
    });
  } catch (error) {
    console.error(error.message);
    return res.status(400).json({ error: error.message });
  }
});





module.exports = router;
