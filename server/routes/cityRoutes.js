const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const cityController = require("../controller/cityCountroller");

router.post("/addcities", authMiddleware, cityController.addCity);
router.put("/editcity/:id", authMiddleware, cityController.editCity);
router.get("/getallCities", cityController.getAllCities);
router.get("/getCitiesByDistrict/:district_id", cityController.getCitiesByDistrict);
router.delete("/updateStatus/:id", authMiddleware,cityController.updateStatus);

module.exports = router;