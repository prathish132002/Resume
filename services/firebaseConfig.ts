import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Helper to safely access environment variables in different environments (Vite, CRA, Node)
const getEnvVar = (key: string, fallback: string) => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    // @ts-ignore
    return import.meta.env[key] || import.meta.env[`VITE_${key}`];
  }
  return fallback;
};

const firebaseConfig = {
  apiKey: getEnvVar('FIREBASE_API_KEY', "AIzaSyARkviYZNVEEXVhvkP_UhiiaetPr1EwJdI"),
  authDomain: getEnvVar('FIREBASE_AUTH_DOMAIN', "studio-9651321511-38b11.firebaseapp.com"),
  projectId: getEnvVar('FIREBASE_PROJECT_ID', "studio-9651321511-38b11"),
  storageBucket: getEnvVar('FIREBASE_STORAGE_BUCKET', "studio-9651321511-38b11.firebasestorage.app"),
  messagingSenderId: getEnvVar('FIREBASE_MESSAGING_SENDER_ID', "102681934022"),
  appId: getEnvVar('FIREBASE_APP_ID', "1:102681934022:web:b04458c0fe15d335b9bfc7")
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);