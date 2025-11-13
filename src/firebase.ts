import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBvk-yFEPmg3fp0BfXwhWQav3CPJopD7oU",
  authDomain: "flow-1ec93.firebaseapp.com",
  projectId: "flow-1ec93",
  storageBucket: "flow-1ec93.firebasestorage.app",
  messagingSenderId: "956116938825",
  appId: "1:956116938825:web:af0b9cc1fc9a46f0278f98",
  measurementId: "G-GNXRQN97JC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
