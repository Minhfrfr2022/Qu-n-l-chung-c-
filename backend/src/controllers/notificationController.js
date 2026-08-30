const { supabaseAdmin } = require("../config/supabase");
const { sendPushToUser, sendPushToAll, PRIORITY, CATEGORY } = require("../services/fcmService");

class NotificationController {
  constructor() {}

  /**
   * Register / Refresh FCM Device Token (Upsert)
   */
  async registerFCMToken(req, res) {
    try {
      const userId = req.user?.id || req.body.userId;
      const { fcm_token, device_type = 'web', user_agent } = req.body;

      if (!userId || !fcm_token) {
        return res.status(400).json({
          success: false,
          message: "userId and fcm_token are required",
        });
      }

      const { data, error } = await supabaseAdmin
        .from("user_fcm_tokens")
        .upsert(
          {
            user_id: userId,
            fcm_token,
            device_type,
            user_agent: user_agent || req.headers['user-agent'] || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'fcm_token' }
        )
        .select();

      if (error) {
        console.error("Error registering FCM token:", error.message);
        return res.status(500).json({ success: false, message: error.message });
      }

      return res.status(200).json({
        success: true,
        message: "FCM token registered successfully",
        data: data?.[0] || null,
      });
    } catch (error) {
      console.error("Error in registerFCMToken:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Remove FCM Token (on Logout)
   */
  async removeFCMToken(req, res) {
    try {
      const userId = req.user?.id || req.body.userId;
      const { fcm_token } = req.body;

      if (!fcm_token) {
        return res.status(400).json({
          success: false,
          message: "fcm_token is required",
        });
      }

      let query = supabaseAdmin.from("user_fcm_tokens").delete().eq("fcm_token", fcm_token);
      if (userId) {
        query = query.eq("user_id", userId);
      }

      const { error } = await query;
      if (error) {
        console.error("Error removing FCM token:", error.message);
        return res.status(500).json({ success: false, message: error.message });
      }

      return res.status(200).json({
        success: true,
        message: "FCM token removed successfully",
      });
    } catch (error) {
      console.error("Error in removeFCMToken:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Get User's Notification Preferences
   */
  async getNotificationSettings(req, res) {
    try {
      const userId = req.user?.id || req.params.userId;
      if (!userId) {
        return res.status(400).json({ success: false, message: "User ID is required" });
      }

      const { data, error } = await supabaseAdmin
        .from("notification_settings")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching notification settings:", error.message);
      }

      const defaultSettings = {
        user_id: userId,
        bills: true,
        vehicles: true,
        visitors: true,
        announcements: true,
        emergency: true,
      };

      return res.status(200).json({
        success: true,
        data: data || defaultSettings,
      });
    } catch (error) {
      console.error("Error in getNotificationSettings:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Update User's Notification Preferences
   */
  async updateNotificationSettings(req, res) {
    try {
      const userId = req.user?.id || req.body.userId;
      if (!userId) {
        return res.status(400).json({ success: false, message: "User ID is required" });
      }

      const { bills, vehicles, visitors, announcements } = req.body;
      const updateData = {
        user_id: userId,
        bills: bills !== undefined ? Boolean(bills) : true,
        vehicles: vehicles !== undefined ? Boolean(vehicles) : true,
        visitors: visitors !== undefined ? Boolean(visitors) : true,
        announcements: announcements !== undefined ? Boolean(announcements) : true,
        emergency: true, // Emergency alerts are always enabled
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabaseAdmin
        .from("notification_settings")
        .upsert(updateData, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) {
        console.error("Error updating notification settings:", error.message);
        return res.status(500).json({ success: false, message: error.message });
      }

      return res.status(200).json({
        success: true,
        message: "Notification settings updated successfully",
        data,
      });
    } catch (error) {
      console.error("Error in updateNotificationSettings:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Create a notification for a specific user (With FCM Push)
   */
  async createNotification(req, res) {
    try {
      const { userId, type, title, message, link, metadata, category, priority } = req.body;

      if (!userId || !type || !title || !message) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: userId, type, title, message",
        });
      }

      const result = await sendPushToUser(userId, {
        type,
        title,
        message,
        link,
        metadata,
        category: category || CATEGORY.ANNOUNCEMENTS,
        priority: priority || PRIORITY.IMPORTANT,
      });

      return res.status(201).json({
        success: true,
        message: "Notification created and processed",
        result,
      });
    } catch (error) {
      console.error("Error in createNotification:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Create notification for all users (Broadcast / Bulk)
   */
  async createAnnouncementForAll(req, res) {
    try {
      const { type, title, message, link, metadata, category, priority } = req.body;

      if (!type || !title || !message) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: type, title, message",
        });
      }

      const result = await sendPushToAll({
        type,
        title,
        message,
        link,
        metadata,
        category: category || CATEGORY.ANNOUNCEMENTS,
        priority: priority || PRIORITY.NORMAL,
      });

      return res.status(201).json({
        success: true,
        message: "Announcement processed successfully",
        result,
      });
    } catch (error) {
      console.error("Error in createAnnouncementForAll:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Get user's notifications (Inbox)
   */
  async getUserNotifications(req, res) {
    try {
      const userId = req.user?.id || req.params.userId;
      const { limit = 50, offset = 0 } = req.query;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "userId is required",
        });
      }

      const { data, error, count } = await supabaseAdmin
        .from("notifications")
        .select("*", { count: "exact" })
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error("Error fetching notifications:", error);
        return res.status(500).json({ success: false, message: error.message });
      }

      return res.status(200).json({
        success: true,
        message: "Notifications fetched successfully",
        data,
        pagination: {
          total: count,
          limit: parseInt(limit),
          offset: parseInt(offset),
        },
      });
    } catch (error) {
      console.error("Error in getUserNotifications:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(req, res) {
    try {
      const { notificationId } = req.params;

      if (!notificationId) {
        return res.status(400).json({
          success: false,
          message: "notificationId is required",
        });
      }

      const { data, error } = await supabaseAdmin
        .from("notifications")
        .update({ read: true })
        .eq("id", notificationId)
        .select();

      if (error) {
        console.error("Error marking notification as read:", error);
        return res.status(500).json({ success: false, message: error.message });
      }

      return res.status(200).json({
        success: true,
        message: "Notification marked as read",
        data: data?.[0],
      });
    } catch (error) {
      console.error("Error in markAsRead:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Mark all notifications as read for current user
   */
  async markAllAsRead(req, res) {
    try {
      const userId = req.user?.id || req.body.userId;
      if (!userId) {
        return res.status(400).json({ success: false, message: "userId is required" });
      }

      const { data, error } = await supabaseAdmin
        .from("notifications")
        .update({ read: true })
        .eq("user_id", userId)
        .eq("read", false)
        .select();

      if (error) {
        console.error("Error marking all as read:", error);
        return res.status(500).json({ success: false, message: error.message });
      }

      return res.status(200).json({
        success: true,
        message: "All notifications marked as read",
        updatedCount: data?.length || 0,
      });
    } catch (error) {
      console.error("Error in markAllAsRead:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(req, res) {
    try {
      const { notificationId } = req.params;

      if (!notificationId) {
        return res.status(400).json({
          success: false,
          message: "notificationId is required",
        });
      }

      const { error } = await supabaseAdmin
        .from("notifications")
        .delete()
        .eq("id", notificationId);

      if (error) {
        console.error("Error deleting notification:", error);
        return res.status(500).json({ success: false, message: error.message });
      }

      return res.status(200).json({
        success: true,
        message: "Notification deleted successfully",
      });
    } catch (error) {
      console.error("Error in deleteNotification:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = { NotificationController };
