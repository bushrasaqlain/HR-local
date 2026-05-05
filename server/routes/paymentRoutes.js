const express = require("express");
const router = express.Router();
const paymentController = require("../controller/paymentController");
const authMiddleware = require("../middleware/auth");

router.post("/addpayment/:userId", paymentController.addPayment);

// New - company registration package payment
router.post("/registration/:userId", authMiddleware, paymentController.addRegistrationPayment);
router.get("/getSavedCards/:userId", paymentController.getSavedCards);

module.exports = router;