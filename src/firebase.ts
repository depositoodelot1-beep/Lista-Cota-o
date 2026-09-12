import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import localConfig from '../firebase-applet-config.json';

// Support both environment variables (e.g. Vercel dashboard) and local config file
const apiKey = import.meta.env.VITE_FIREBASE_API_KEY || localConfig.apiKey;
const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || localConfig.authDomain;
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || localConfig.projectId;
const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || localConfig.storageBucket;
const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || localConfig.messagingSenderId;
const appId = import.meta.env.VITE_FIREBASE_APP_ID || localConfig.appId;
const firestoreDatabaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID || localConfig.firestoreDatabaseId;

const firebaseConfig = {
  apiKey,
  authDomain,
  projectId,
  storageBucket,
  messagingSenderId,
  appId,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Target specific database if specified in config, with persistence
let dbInstance;
try {
  const databaseId = firestoreDatabaseId && firestoreDatabaseId !== '(default)'
    ? firestoreDatabaseId
    : undefined;

  dbInstance = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  }, databaseId);
} catch {
  // If already initialized or unsupported cache
  const databaseId = firestoreDatabaseId && firestoreDatabaseId !== '(default)'
    ? firestoreDatabaseId
    : undefined;
  dbInstance = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
}

export const db = dbInstance;
export const auth = getAuth(app);
export { app };
