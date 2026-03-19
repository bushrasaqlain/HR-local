const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");

const districtController = require("../controller/districtController");

router.post("/adddistrict", authMiddleware, districtController.addDistrict);
router.put("/editdistrict/:id", authMiddleware, districtController.editDistrict);
router.get("/getallDistricts", districtController.getAllDistricts);
router.put("/updateDistrictStatus/:id", authMiddleware, districtController.updateStatus);
module.exports = router;