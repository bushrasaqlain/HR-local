const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");

const specialityController = require("../controller/specialityController");

router.post("/addspeciality", authMiddleware, specialityController.addspeciality);
router.put("/editspeciality/:id", authMiddleware, specialityController.editspeciality);
router.get("/getAllspeciality", specialityController.getAllspeciality);
router.delete("/deletespeciality/:id",authMiddleware,specialityController.deletespeciality);

module.exports = router;