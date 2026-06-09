// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAZfsis8hYFMfu6J_Z6c5nLWo3aXxtrFlU",
  authDomain: "macrotrack-db.firebaseapp.com",
  databaseURL: "https://macrotrack-db-default-rtdb.firebaseio.com",
  projectId: "macrotrack-db",
  storageBucket: "macrotrack-db.firebasestorage.app",
  messagingSenderId: "999050040002",
  appId: "1:999050040002:web:7d01894b633c41c775215b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const db = getDatabase(app);