const express = require("express");
const router = express.Router();
const contactController = require("../controller/contactController");
const authMiddleware = require("../middleware/auth");

router.post("/send", authMiddleware, contactController.sendContactMessage);

router.get("/messages", authMiddleware, contactController.getAllMessages);

router.patch("/messages/:id/status", authMiddleware, contactController.updateMessageStatus);

module.exports = router;
