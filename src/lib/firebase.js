import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: "reactchatapp-5c18e.firebaseapp.com",
  projectId: "reactchatapp-5c18e",
  storageBucket: "reactchatapp-5c18e.appspot.com",
  messagingSenderId: "1080737111066",
  appId: "1:1080737111066:web:a70dcefb68f7f20001c5a3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth()
export const db = getFirestore()
export const storage = getStorage()