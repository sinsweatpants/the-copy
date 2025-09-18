// frontend/src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBkeea3ffQjhQ6xlnRAXC38kdG7trXvmZc",
  authDomain: "adam-468522.firebaseapp.com",
  projectId: "adam-468522",
  storageBucket: "adam-468522.firebasestorage.app",
  messagingSenderId: "781031989535",
  appId: "1:781031989535:web:a67d962d7c8bcb3cc2d02a",
  measurementId: "G-W24SMTG90M"
};

// تجنّب تهيئة مكرّرة أثناء HMR
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Initialize Analytics
export const analytics = getAnalytics(app);

// تهيئة Analytics (اختياري) — lazy & فقط في الإنتاج
export async function initAnalytics() {
  if (!import.meta.env.PROD) return null;
  if (!import.meta.env.VITE_FIREBASE_MEASUREMENT_ID) return null;

  const { isSupported } = await import("firebase/analytics");
  return (await isSupported()) ? analytics : null;
}