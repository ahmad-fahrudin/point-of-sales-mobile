// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// Note: Analytics tidak bisa digunakan di React Native, hanya untuk web

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyA-VAOuoFcOlASUiac3P75p1l_Yhnp-77I',
  authDomain: 'pointofsales-291ff.firebaseapp.com',
  projectId: 'pointofsales-291ff',
  storageBucket: 'pointofsales-291ff.firebasestorage.app',
  messagingSenderId: '220462691864',
  appId: '1:220462691864:web:31462fd514e63fb0c3356d',
  measurementId: 'G-LDZ9BP8CCB',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore (Database)
export const db = getFirestore(app);

// Initialize Authentication
export const auth = getAuth(app);

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

export default app;
