import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyD4FPU1uapSWjbpyR1Jjf854T7V4qMV-TM",
  authDomain: "skedz-a13eb.firebaseapp.com",
  databaseURL: "https://skedz-a13eb-default-rtdb.firebaseio.com",
  projectId: "skedz-a13eb",
  storageBucket: "skedz-a13eb.firebasestorage.app",
  messagingSenderId: "318431223204",
  appId: "1:318431223204:web:90f2205f22aebc341eb531",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);