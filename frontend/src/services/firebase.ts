import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Read config from firebase-applet-config.json
let firebaseConfig = {
  projectId: "ai-studio-applet-webapp-18152",
  appId: "1:923220182931:web:ce39b6c9bfdc48051b0a66",
  apiKey: "AIzaSyBJdcJrIVghqwp66Eb9byYVqx0zVHMP_r0",
  authDomain: "ai-studio-applet-webapp-18152.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-b74f7f40-9a9c-411b-acff-64c8cc015d63",
  storageBucket: "ai-studio-applet-webapp-18152.firebasestorage.app",
  messagingSenderId: "923220182931",
  oAuthClientId: "923220182931-ifnpg4vi3atfr0i03l44vbq19ehdqhpf.apps.googleusercontent.com",
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let googleProvider: GoogleAuthProvider | null = null;

try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  auth = getAuth(app);
  if (firebaseConfig.firestoreDatabaseId) {
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
  } else {
    db = getFirestore(app);
  }
  googleProvider = new GoogleAuthProvider();
} catch (error) {
  console.warn("Firebase initialization warning (using local fallback store):", error);
}

export { app, auth, db, googleProvider };
