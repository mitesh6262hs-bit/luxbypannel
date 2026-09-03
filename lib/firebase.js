import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDNGj5RkJJmazE73wNC4Wu7T6V6F3J93UQ",
  authDomain: "mrjaggu193.firebaseapp.com",
  databaseURL: "https://mrjaggu193-default-rtdb.firebaseio.com",
  projectId: "mrjaggu193",
  storageBucket: "mrjaggu193.firebasestorage.app",
  messagingSenderId: "1049164532804",
  appId: "1:1049164532804:web:d7461b42a58cc061f7c011"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getDatabase(app);
