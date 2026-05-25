const express = require("express");
const router  = express.Router();
const connection = require("../connection.js");

const authMiddleware = require("../middleware/auth.js");
// const adminOnly      = require("../middleware/adminOnly.js");
const revenuerecordController = require("../controller/revenuerecordController.js");


// All routes require auth + admin role
router.use(authMiddleware);
// router.use(adminOnly);


router.get("/summary",            revenuerecordController.revenueSummary);
router.get("/by-model",           revenuerecordController.revenueByModel);
router.get("/by-payment-method",  revenuerecordController.revenueByPaymentMethod);
router.get("/trend",              revenuerecordController.revenueTrend);
router.get("/companies",          revenuerecordController.companyPackageTable);
router.get("/daily-budget",       revenuerecordController.dailyBudgetRevenue);
router.get("/alerts",             revenuerecordController.adminAlerts);
router.get("/overview",           revenuerecordController.revenueOverview);
router.get("/company/:accountId", revenuerecordController.companyRevenueDetail);


module.exports = router;