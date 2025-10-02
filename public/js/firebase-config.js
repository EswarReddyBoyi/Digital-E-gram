// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { getFunctions } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-functions.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-analytics.js";  // 👈 use 9.23.0 here too

const firebaseConfig = {
  apiKey: "AIzaSyD1h7ISNV-Iivcy66RS2cl86myCUoWGa_Q",
  authDomain: "e-gram-e25f1.firebaseapp.com",
  projectId: "e-gram-e25f1",
  storageBucket: "e-gram-e25f1.appspot.com",  // 👈 corrected .app to .appspot.com
  messagingSenderId: "715024357307",
  appId: "1:715024357307:web:bad738c80a17db56f0169e",
  measurementId: "G-5ZWVKFXDYR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);

console.log("✅ Firebase initialized");
