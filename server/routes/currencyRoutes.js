const express = require("express");
const router = express.Router();
const connection = require("../connection");
const authMiddleware = require("../middleware/auth.js");
const logAudit = require("../utils/auditLogger");
const currencyController = require("../controller/currencyController.js");

router.post("/addcurrency", authMiddleware, currencyController.addCurrency)
 
router.get("/getallcurrencies", currencyController.getAllCurrency)

router.delete("/deletecurrency/:id", authMiddleware, currencyController.deleteCurrency)
  
router.put("/editcurrency/:id", authMiddleware, currencyController.editCurrency)
 
router.get("/getCurrencyinPayment",currencyController.getAllCurrenciesinPayment)
module.exports = router;