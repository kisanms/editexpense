import { initializeApp } from "firebase/app";
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCMaKNHa3mxIjQulMUxa9xHnwlCDz-GC6A",
  authDomain: "editexpense.firebaseapp.com",
  projectId: "editexpense",
  storageBucket: "editexpense.firebasestorage.app",
  messagingSenderId: "850742115021",
  appId: "1:850742115021:web:e9dac39720f8f2ea520784",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
