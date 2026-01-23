const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const cityController = require("../controller/cityCountroller");
const candidateAvailabilityController = require("../controller/candidateAvailaiblityController");

router.post("/addavailability", candidateAvailabilityController.addAvailaibility);
router.put("/editcity/:id", authMiddleware, cityController.editCity);
router.get("/getallCities", cityController.getAllCities);
router.get("getCitiesByDistrict/:district_id", cityController.getCitiesByDistrict);
router.delete("/deletecity/:id", authMiddleware,cityController.deleteCity);

module.exports = router;