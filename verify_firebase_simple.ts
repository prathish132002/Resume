
// This script simulates a basic read/write operation without full authentication
// to check if the Firebase configuration is technically valid and reachable.
// Note: Without auth, writes will likely fail due to security rules, which is EXPECTED
// and confirms connectivity.

import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, limit, query } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyARkviYZNVEEXVhvkP_UhiiaetPr1EwJdI",
  authDomain: "studio-9651321511-38b11.firebaseapp.com",
  projectId: "studio-9651321511-38b11",
  storageBucket: "studio-9651321511-38b11.firebasestorage.app",
  messagingSenderId: "102681934022",
  appId: "1:102681934022:web:b04458c0fe15d335b9bfc7"
};

async function checkConnectivity() {
  console.log("Initializing Firebase App...");
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  console.log("Attempting to connect to Firestore...");
  try {
    // Try to read slightly, even if empty or denied, it proves network reachability
    const resumesRef = collection(db, "resumes");
    const q = query(resumesRef, limit(1));
    await getDocs(q);
    
    console.log("SUCCESS: Connected to Firestore!");
    console.log("Your Firebase configuration is valid and the database is reachable.");
    console.log("Note: Actual data storage depends on Authentication state.");
  } catch (error: any) {
    if (error.code === 'permission-denied') {
       console.log("SUCCESS: Connected to Firestore! (Permission Denied as expected for unauthenticated access)");
       console.log("This confirms the app can reach the database.");
    } else {
       console.error("CONNECTION FAILED:", error.message);
    }
  }
}

checkConnectivity();
