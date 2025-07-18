import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBKljtr5Ftfuaw9k5wCwxurgwh9Ltt9L70",
  authDomain: "twain-content-backend.firebaseapp.com",
  projectId: "twain-content-backend",
  storageBucket: "twain-content-backend.firebasestorage.app",
  messagingSenderId: "695108543702",
  appId: "1:695108543702:web:5c0dfed0b63dbe896a5577"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);

// Initialize Storage
export const storage = getStorage(app); 