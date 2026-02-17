const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const availabilityController = require("../controller/candidateavailabilityController");
// Add new availability
router.post("/addavailability", authMiddleware, availabilityController.addavailability);

// Get all availability for logged-in candidate
router.get("/getavailability", authMiddleware, availabilityController.getAvailability);

// Update all availability for logged-in candidate
router.put("/updateavailability/:id", authMiddleware, availabilityController.updateAvailability);

module.exports = router;
