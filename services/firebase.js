import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore, setLogLevel } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyCMaKNHa3mxIjQulMUxa9xHnwlCDz-GC6A",
  authDomain: "editexpense.firebaseapp.com",
  projectId: "editexpense",
  storageBucket:"editexpense.firebasestorage.app",
  messagingSenderId: "850742115021",
  appId: "1:850742115021:web:e9dac39720f8f2ea520784"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firestore and set log level to suppress BloomFilter warnings
const db = getFirestore(app);

// Set log level to error only to suppress warning messages
setLogLevel('error');

export { auth, db };
