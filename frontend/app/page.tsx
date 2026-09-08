"use client";
import { useState, useEffect } from "react";
import {
  onAuthStateChanged,
  signOut,
  User as FirebaseUser,
} from "firebase/auth";
import { auth } from "../lib/firebase";
import { User } from "../types";
import AuthScreen from "../components/AuthScreen";
import Dashboard from "../components/Dashboard";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
          const emailStr = firebaseUser.email || "";
          const nameStr =
            firebaseUser.displayName ||
            (emailStr ? emailStr.split("@")[0] : "") ||
            "Developer";
          const avatarStr =
            firebaseUser.photoURL ||
            "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop&crop=faces";

          setUser({
            name: nameStr,
            email: emailStr,
            avatar: avatarStr,
          });
        } else {
          setUser(null);
        }
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-screen bg-[#F0F4F2] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#00A859] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    // Error fixed here by adding ': User' type definition
    return (
      <AuthScreen onLogin={(loggedInUser: User) => setUser(loggedInUser)} />
    );
  }

  return <Dashboard user={user} onLogout={handleLogout} />;
}
