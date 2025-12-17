const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const degreetypeController = require("../controller/degreetypeController");

router.post("/adddegree", authMiddleware, degreetypeController.addDegreeType);
router.put("/editdegree/:id", authMiddleware, degreetypeController.editDegreeType);
router.get("/getalldegrees", degreetypeController.getAllDegreeTypes);
router.delete("/deletedegree/:id", authMiddleware, degreetypeController.deleteDegreeType);

module.exports = router;