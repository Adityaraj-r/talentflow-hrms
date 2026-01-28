import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBWZ12e8T1N8KgWEivg1qlt8qfKUnLYCc0",
  authDomain: "hrms-bd8ad.firebaseapp.com",
  projectId: "hrms-bd8ad",
  storageBucket: "hrms-bd8ad.firebasestorage.app",
  messagingSenderId: "806931707254",
  appId: "1:806931707254:web:1d52a9624dfddf539e7657"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const storage = getStorage(app);
export const db = getFirestore(app);

export default app;
