import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  browserLocalPersistence, 
  setPersistence,
  GoogleAuthProvider
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
// Note: firebaseConfig.firestoreDatabaseId is used if provided in the config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
export const auth = getAuth(app);

// Enable local persistence so mobile browser tabs keep session
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('Firebase setPersistence warning:', err);
});

// Configure Google Auth Provider with mobile-friendly defaults
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export default app;
