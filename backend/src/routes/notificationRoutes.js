const express = require("express");
const router = express.Router();
const { NotificationController } = require("../controllers/notificationController");
const { verifyToken } = require("../middleware/auth");

const controller = new NotificationController();

// FCM Device Token Management
router.post("/fcm-token", verifyToken, controller.registerFCMToken.bind(controller));
router.delete("/fcm-token", verifyToken, controller.removeFCMToken.bind(controller));

// User Notification Preferences
router.get("/settings", verifyToken, controller.getNotificationSettings.bind(controller));
router.patch("/settings", verifyToken, controller.updateNotificationSettings.bind(controller));

// Notification CRUD & Actions
router.post("/", controller.createNotification.bind(controller));
router.post("/announcement", controller.createAnnouncementForAll.bind(controller));
router.get("/user/:userId", controller.getUserNotifications.bind(controller));
router.patch("/read-all", verifyToken, controller.markAllAsRead.bind(controller));
router.patch("/:notificationId/read", controller.markAsRead.bind(controller));
router.delete("/:notificationId", controller.deleteNotification.bind(controller));

module.exports = router;
