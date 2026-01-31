// routes/candidateAvailabilityRoutes.js
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const candidateAvailabilityController = require("../controller/candidateAvailaiblityController");

router.post("/addavailability", authMiddleware, candidateAvailabilityController.addavailability);

module.exports = router;