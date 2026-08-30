"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Notification, NotificationContextType, NotificationSettings } from "@/types/notification";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthContext";
import { requestFCMToken, onForegroundMessage } from "@/lib/firebase";
import NotificationSettingsModal from "@/components/NotificationSettingsModal";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

const defaultSettings: NotificationSettings = {
  bills: true,
  vehicles: true,
  visitors: true,
  announcements: true,
  emergency: true,
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { user } = useAuth();

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await fetch(`${API_BASE_URL}/notifications/user/${user.id}?limit=50`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const json = await res.json();

      if (json.success && Array.isArray(json.data)) {
        const formattedNotifications: Notification[] = json.data.map((item: any) => ({
          id: item.id,
          userId: item.user_id,
          type: item.type,
          title: item.title,
          message: item.message,
          read: item.read,
          createdAt: item.created_at,
          link: item.link,
          metadata: item.metadata,
        }));
        setNotifications(formattedNotifications);
      } else {
        // Fallback to direct supabase query
        const { data, error } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50);

        if (!error && data) {
          const formattedNotifications: Notification[] = data.map((item: any) => ({
            id: item.id,
            userId: item.user_id,
            type: item.type,
            title: item.title,
            message: item.message,
            read: item.read,
            createdAt: item.created_at,
            link: item.link,
            metadata: item.metadata,
          }));
          setNotifications(formattedNotifications);
        }
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Load user settings from Backend / Supabase
  const fetchSettings = useCallback(async () => {
    if (!user) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/notifications/settings`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const json = await res.json();
      if (json.success && json.data) {
        setSettings(json.data);
      }
    } catch (e) {
      console.warn("Could not fetch notification settings, using defaults", e);
    }
  }, [user]);

  // Check and register FCM Token on login / refresh
  const checkAndRegisterToken = useCallback(async () => {
    if (!user) return null;
    try {
      const fcmToken = await requestFCMToken();
      if (!fcmToken) return null;

      const cachedToken = localStorage.getItem("fcm_token");
      const token = localStorage.getItem("token");

      // Register or refresh token on backend
      if (fcmToken !== cachedToken || !cachedToken) {
        const res = await fetch(`${API_BASE_URL}/notifications/fcm-token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            userId: user.id,
            fcm_token: fcmToken,
            device_type: "web",
          }),
        });

        if (res.ok) {
          localStorage.setItem("fcm_token", fcmToken);
          console.log("FCM device token registered with backend successfully.");
        }
      }

      return fcmToken;
    } catch (err) {
      console.warn("checkAndRegisterToken error:", err);
      return null;
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    fetchSettings();
    checkAndRegisterToken();

    // 1. Subscribe to Supabase Realtime changes on notifications table
    if (user) {
      const channel = supabase
        .channel("notifications_realtime")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log("Realtime notification change received:", payload);
            fetchNotifications();
          }
        )
        .subscribe();

      // 2. Listen to Foreground FCM Messages (when app is open)
      const unsubForeground = onForegroundMessage((payload) => {
        console.log("Foreground push notification:", payload);
        fetchNotifications();
      });

      // 3. Network Offline-to-Online recovery listener
      const handleOnline = () => {
        console.log("Network reconnected! Fetching latest notifications...");
        fetchNotifications();
      };
      window.addEventListener("online", handleOnline);

      return () => {
        supabase.removeChannel(channel);
        if (unsubForeground) unsubForeground();
        window.removeEventListener("online", handleOnline);
      };
    }
  }, [user, fetchNotifications, fetchSettings, checkAndRegisterToken]);

  const markAsRead = async (notificationId: string) => {
    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
        method: "PATCH",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, read: true }))
    );

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ userId: user.id }),
      });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    // Optimistic UI update
    setNotifications((prev) =>
      prev.filter((notif) => notif.id !== notificationId)
    );

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    const updated = { ...settings, ...newSettings, emergency: true };
    setSettings(updated);

    if (user) {
      try {
        const token = localStorage.getItem("token");
        await fetch(`${API_BASE_URL}/notifications/settings`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updated),
        });
      } catch (e) {
        console.error("Failed to update notification settings on server:", e);
      }
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isLoading,
    settings,
    isSettingsOpen,
    setIsSettingsOpen,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications: fetchNotifications,
    updateSettings,
    requestNotificationPermission: checkAndRegisterToken,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
