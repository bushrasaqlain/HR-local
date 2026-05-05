const alertSettingsModel = require("../models/alertSettingsModel");

const getAlertSettings = async (req, res) => {
  const { userId } = req.params;
  
  try {
    const settings = await alertSettingsModel.getAlertSettings(userId);
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error("Get alert settings error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch alert settings" });
  }
};

const saveAlertSettings = async (req, res) => {
  const { userId } = req.params;
  const { lowCredits, packageExpiry, budgetThreshold, unusualSpending } = req.body;
  
  try {
    const settings = { lowCredits, packageExpiry, budgetThreshold, unusualSpending };
    await alertSettingsModel.saveAlertSettings(userId, settings);
    res.json({ success: true, message: "Alert settings saved successfully" });
  } catch (error) {
    console.error("Save alert settings error:", error);
    res.status(500).json({ success: false, message: "Failed to save alert settings" });
  }
};

const getNotifications = async (req, res) => {
  const { userId } = req.params;
  const { limit = 50 } = req.query;
  
  try {
    const notifications = await alertSettingsModel.getNotifications(userId, parseInt(limit));
    const unreadCount = await alertSettingsModel.getUnreadNotificationsCount(userId);
    res.json({ success: true, data: { notifications, unreadCount } });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch notifications" });
  }
};

const markNotificationAsRead = async (req, res) => {
  const { userId, notificationId } = req.params;
  
  try {
    await alertSettingsModel.markNotificationAsRead(notificationId, userId);
    res.json({ success: true, message: "Notification marked as read" });
  } catch (error) {
    console.error("Mark notification error:", error);
    res.status(500).json({ success: false, message: "Failed to mark notification" });
  }
};

const markAllNotificationsAsRead = async (req, res) => {
  const { userId } = req.params;
  
  try {
    await alertSettingsModel.markAllNotificationsAsRead(userId);
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    console.error("Mark all notifications error:", error);
    res.status(500).json({ success: false, message: "Failed to mark notifications" });
  }
};

module.exports = {
  getAlertSettings,
  saveAlertSettings,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
};