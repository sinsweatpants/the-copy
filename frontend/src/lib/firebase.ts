// frontend/src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: " ",
  authDomain: "adam-468522.firebaseapp.com",
  projectId: "adam-468522",
  storageBucket: "adam-468522.firebasestorage.app",
  messagingSenderId: "781031989535",
  appId: " ",
  measurementId: "G-W24SMTG90M"
};

// تجنّب تهيئة مكرّرة أثناء HMR
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Initialize Analytics
export const analytics = getAnalytics(app);

// تهيئة Analytics (اختياري) — lazy & فقط في الإنتاج
export async function initAnalytics() {
  if (!import.meta.env.PROD) return null;

  const { isSupported } = await import("firebase/analytics");
  return (await isSupported()) ? analytics : null;
}
