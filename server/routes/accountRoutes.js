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

router.post("/account", upload.none(),accountController.register); 

router.post("/login", accountController.login);

router.post("/changepassword", authMiddleware, accountController.changePassword);

module.exports = router;
