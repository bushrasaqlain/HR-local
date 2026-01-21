const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const degreetypeController = require("../controller/degreetypeController");

router.post("/adddegreetype", authMiddleware, degreetypeController.addDegreeType);
router.put("/editdegreetype/:id", authMiddleware, degreetypeController.editDegreeType);
router.get("/getalldegreetype", degreetypeController.getAllDegreeTypes);
router.delete("/deletedegreetype/:id", authMiddleware, degreetypeController.deleteDegreeType);

module.exports = router;