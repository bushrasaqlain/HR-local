const express = require("express");
const router = express.Router();
const countryController = require("../controller/countryController");
const authMiddleware = require("../middleware/auth");

router.post("/addcountries", authMiddleware, countryController.addCountry);
router.put("/editcountry/:id", authMiddleware, countryController.editCountry);
router.get("/getallCountries", countryController.getAllCountries);
router.put("/updateStatus/:id", authMiddleware,countryController.updateStatus);


module.exports = router;