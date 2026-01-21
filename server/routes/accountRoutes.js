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

module.exports = router;
