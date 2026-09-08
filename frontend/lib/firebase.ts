import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDxpT4RoCN-kQHa495otfpSmyzot9dbcAQ",
  authDomain: "reachinbox-b7726.firebaseapp.com",
  projectId: "reachinbox-b7726",
  storageBucket: "reachinbox-b7726.firebasestorage.app",
  messagingSenderId: "336375117360",
  appId: "1:336375117360:web:a90b327fdd0075da029ff5",
  measurementId: "G-61JHVJMRVG",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
