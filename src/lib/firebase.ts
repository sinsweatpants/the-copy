// frontend/src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  // measurementId اختياري، ما نحطه إلا لو موجود
  ...(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
    ? { measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID }
    : {})
};

// تجنّب تهيئة مكرّرة أثناء HMR
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// تهيئة Analytics (اختياري) — lazy & فقط في الإنتاج
export async function initAnalytics() {
  if (!import.meta.env.PROD) return null;
  if (!import.meta.env.VITE_FIREBASE_MEASUREMENT_ID) return null;

  const { isSupported, getAnalytics } = await import("firebase/analytics");
  return (await isSupported()) ? getAnalytics(app) : null;
}
