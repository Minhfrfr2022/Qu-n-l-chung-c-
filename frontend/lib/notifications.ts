import { NotificationType } from "@/types/notification";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, any>;
  category?: string;
  priority?: string;
}

/**
 * Create a new notification for a user (via Backend API -> DB Inbox + FCM Push)
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const res = await fetch(`${API_BASE_URL}/notifications`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link,
        metadata: params.metadata,
        category: params.category || "announcements",
        priority: params.priority || "important",
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || "Failed to create notification");
    }

    return json.result || json.data;
  } catch (error) {
    console.error("Error in createNotification:", error);
    throw error;
  }
}

/**
 * Create a notification for all users with a specific role
 */
export async function createNotificationForRole(
  role: string,
  params: Omit<CreateNotificationParams, "userId">
) {
  try {
    return await createAnnouncementForAll(params);
  } catch (error) {
    console.error("Error in createNotificationForRole:", error);
    throw error;
  }
}

/**
 * Create a broadcast notification for all users
 */
export async function createAnnouncementForAll(
  params: Omit<CreateNotificationParams, "userId">
) {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const res = await fetch(`${API_BASE_URL}/notifications/announcement`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        type: params.type || "announcement",
        title: params.title,
        message: params.message,
        link: params.link,
        metadata: params.metadata,
        category: params.category || "announcements",
        priority: params.priority || "normal",
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || "Failed to create announcement");
    }

    return json.result || json.data;
  } catch (error) {
    console.error("Error in createAnnouncementForAll:", error);
    throw error;
  }
}
