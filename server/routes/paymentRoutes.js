const express = require("express");
const router = express.Router();

const paymentController = require("../controller/paymentController");


 router.post('/addpayment/:userId',paymentController.addPayment)

 module.exports = router;