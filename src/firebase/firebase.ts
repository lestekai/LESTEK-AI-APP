import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
 // @ts-ignore
 apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
 // @ts-ignore
 authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
 // @ts-ignore
 projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
 // @ts-ignore
 storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
 // @ts-ignore
 messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
 // @ts-ignore
 appId: import.meta.env.VITE_FIREBASE_APP_ID
};

let app = null;
let db = null;
let auth = null;
let storage = null;

try {
  if (firebaseConfig.apiKey) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    storage = getStorage(app);
  }
} catch (error) {
  console.warn("Failed to initialize Firebase. Please check your environment variables.", error);
}

export { app, db, auth, storage };
