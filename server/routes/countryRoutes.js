const express = require("express");
const router = express.Router();
const countryController = require("../controller/countryController");
const authMiddleware = require("../middleware/auth");

router.post("/addcountries", authMiddleware, countryController.addCountry);
router.put("/editcountry/:id", authMiddleware, countryController.editCountry);
router.get("/getallCountries", countryController.getAllCountries);
router.delete("/deletecountry/:id", authMiddleware,countryController.deleteCountry);


module.exports = router;