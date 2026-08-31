import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getMessaging, getToken, onMessage, Messaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDummyKeyForDevelopment12345678",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "quan-ly-chung-cu-e16f3.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "quan-ly-chung-cu-e16f3",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "quan-ly-chung-cu-e16f3.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1078364460138",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1078364460138:web:abcdef123456",
};

let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;

if (typeof window !== "undefined") {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    
    // Check if browser supports ServiceWorker and Notification
    if ("serviceWorker" in navigator && "Notification" in window) {
      messaging = getMessaging(app);
    }
  } catch (error) {
    console.warn("Firebase client initialization warning:", error);
  }
}

/**
 * Request permission and retrieve FCM device token
 */
export async function requestFCMToken(): Promise<string | null> {
  if (typeof window === "undefined" || !messaging) return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("Notification permission was not granted:", permission);
      return null;
    }

    // Register service worker if needed
    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");

    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    const token = await getToken(messaging, {
      serviceWorkerRegistration: registration,
      vapidKey: vapidKey || undefined,
    });

    return token || null;
  } catch (error) {
    console.warn("Failed to get FCM token:", error);
    return null;
  }
}

/**
 * Subscribe to foreground messages when web app is active
 */
export function onForegroundMessage(callback: (payload: any) => void): (() => void) | null {
  if (typeof window === "undefined" || !messaging) return null;

  try {
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("Foreground FCM message received:", payload);
      callback(payload);
    });
    return unsubscribe;
  } catch (error) {
    console.warn("Error subscribing to foreground FCM messages:", error);
    return null;
  }
}

export { app, messaging };
