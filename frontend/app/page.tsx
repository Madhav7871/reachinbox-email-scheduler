"use client";
import { useState } from "react";
import { User } from "../types";
import LoginScreen from "../components/LoginScreen";
import Dashboard from "../components/Dashboard";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);

  if (!user) {
    return <LoginScreen onLogin={(loggedInUser) => setUser(loggedInUser)} />;
  }

  return <Dashboard user={user} onLogout={() => setUser(null)} />;
}
