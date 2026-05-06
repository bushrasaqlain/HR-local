const express = require("express");
const router = express.Router();
const alertSettingsController = require("../controller/alertSettingsController");
// const authMiddleware = require("../middleware/auth");

router.get("/get/:userId", alertSettingsController.getAlertSettings);
router.post("/save/:userId", alertSettingsController.saveAlertSettings);

router.get("/notifications/:userId", alertSettingsController.getNotifications);
router.put("/notifications/:userId/:notificationId/read", alertSettingsController.markNotificationAsRead);
router.put("/notifications/:userId/read-all", alertSettingsController.markAllNotificationsAsRead);

module.exports = router;