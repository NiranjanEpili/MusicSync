import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB_yAD2uoloGUPU7QbXdmg6sA6gke1__Xo",
  authDomain: "musicsync-69339.firebaseapp.com",
  databaseURL: "https://musicsync-69339-default-rtdb.firebaseio.com",
  projectId: "musicsync-69339",
  storageBucket: "musicsync-69339.firebasestorage.app",
  messagingSenderId: "113150334014",
  appId: "1:113150334014:web:d2dbe6f70d7b7362d4ed6f",
  measurementId: "G-GTNR98NZGF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
export const analytics = getAnalytics(app);
