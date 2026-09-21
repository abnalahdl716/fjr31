import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import config from '../../firebase-applet-config.json';

// Initialize Firebase App singleton
export const firebaseApp = getApps().length === 0 ? initializeApp(config) : getApp();

// Initialize Firestore with custom databaseId configured in firebase-applet-config.json
const dbId =
  config.firestoreDatabaseId && config.firestoreDatabaseId !== '(default)'
    ? config.firestoreDatabaseId
    : undefined;

export const db = dbId ? getFirestore(firebaseApp, dbId) : getFirestore(firebaseApp);

// Initialize Firebase Auth
export const auth = getAuth(firebaseApp);

// Automatic silent authentication for seamless realtime operations
let authInitPromise: Promise<User | null> | null = null;
export async function ensureAuth(): Promise<User | null> {
  if (auth.currentUser) {
    return auth.currentUser;
  }
  if (!authInitPromise) {
    authInitPromise = new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          unsubscribe();
          resolve(user);
        } else {
          try {
            const cred = await signInAnonymously(auth);
            unsubscribe();
            resolve(cred.user);
          } catch (err) {
            console.warn('Anonymous sign-in fallback:', err);
            unsubscribe();
            resolve(null);
          }
        }
      });
    });
  }
  return authInitPromise;
}

// Kickstart auth in background
ensureAuth().catch(() => {});
