"use client";
import React, { useState } from "react";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";
import { User } from "../types";

interface AuthScreenProps {
  onLogin: (user: User) => void;
}

export default function AuthScreen({ onLogin }: AuthScreenProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // 1. Google OAuth Popup
  const handleGoogleAuth = async () => {
    try {
      setLoading(true);
      setError("");
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const userEmail = user.email || "";

      onLogin({
        name:
          user.displayName ||
          (userEmail ? userEmail.split("@")[0] : "Developer"),
        email: userEmail,
        avatar:
          user.photoURL ||
          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop&crop=faces",
      });
    } catch (err: any) {
      console.error("Google Sign-In Error:", err);
      if (err.code !== "auth/popup-closed-by-user") {
        setError(err?.message || "Google authentication failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  // 2. Email & Password Login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please provide both email and password.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;
      const userEmail = user.email || email;

      onLogin({
        name: user.displayName || userEmail.split("@")[0],
        email: userEmail,
        avatar:
          user.photoURL ||
          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop&crop=faces",
      });
    } catch (err: any) {
      console.error("Login Error:", err);
      if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/user-not-found"
      ) {
        setError("Invalid email or password.");
      } else {
        setError(err.message || "Login failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  // 3. Email & Password Signup
  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;

      await updateProfile(user, { displayName: name });

      onLogin({
        name,
        email: user.email || email,
        avatar:
          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop&crop=faces",
      });
    } catch (err: any) {
      console.error("Signup Error:", err);
      if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered. Please log in.");
      } else {
        setError(err.message || "Failed to create account.");
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setError("");
    setIsSignUp(!isSignUp);
  };

  return (
    <div className="w-screen h-screen min-h-screen overflow-hidden flex relative bg-white font-sans select-none selection:bg-[#00A859] selection:text-white">
      {/* ========================================================================= */}
      {/* 1. GREEN BRAND PANEL: Slides between Left (0) and Right (100%)             */}
      {/* ========================================================================= */}
      <div
        className={`w-full md:w-1/2 h-full absolute top-0 bottom-0 left-0 bg-gradient-to-br from-[#00A859] via-[#008f4c] to-[#005e32] text-white p-10 md:p-16 flex flex-col justify-between transition-transform duration-700 ease-in-out z-20 shadow-2xl ${
          isSignUp ? "md:translate-x-full" : "md:translate-x-0"
        }`}
      >
        {/* Glow Spheres */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none -mr-24 -mt-24"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-black/10 rounded-full blur-2xl pointer-events-none -ml-20 -mb-20"></div>

        {/* Brand Header */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-xl border border-white/30 shadow-inner">
              ⚡
            </span>
            <span className="text-3xl font-black tracking-tight">
              ReachInbox
            </span>
          </div>
          <span className="text-xs font-semibold bg-white/15 px-3.5 py-1 rounded-full border border-white/20 backdrop-blur-xs">
            v2.4 Production
          </span>
        </div>

        {/* Feature Copy */}
        <div className="relative z-10 my-auto py-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-semibold mb-6 backdrop-blur-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
            {isSignUp
              ? "Automated Lead Scaling"
              : "Intelligent Email Infrastructure"}
          </div>

          <h2 className="text-4xl lg:text-5xl font-black tracking-tight leading-tight mb-5">
            {isSignUp
              ? "Scale Cold Outreach with Zero Dropouts."
              : "Supercharge Your Email Scheduler at Scale."}
          </h2>

          <p className="text-base text-emerald-50/90 leading-relaxed font-normal mb-10 max-w-lg">
            {isSignUp
              ? "Create sequences, enforce hourly throttling, and ensure fault-tolerant email execution backed by BullMQ and Redis queues."
              : "Manage persistent scheduled jobs, monitor deliverability, and send high-converting outreach sequences effortlessly."}
          </p>

          {/* Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
            <div className="bg-white/10 backdrop-blur-md border border-white/15 p-4 rounded-2xl flex items-center gap-3.5">
              <span className="text-2xl">🚀</span>
              <div>
                <p className="text-sm font-bold text-white">BullMQ Queues</p>
                <p className="text-xs text-emerald-100/70">
                  Sub-second delayed jobs
                </p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/15 p-4 rounded-2xl flex items-center gap-3.5">
              <span className="text-2xl">🛡️</span>
              <div>
                <p className="text-sm font-bold text-white">Rate Throttling</p>
                <p className="text-xs text-emerald-100/70">
                  Anti-spam safe dispatch
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Metrics Footer */}
        <div className="relative z-10 pt-6 border-t border-white/20 flex items-center justify-between text-xs text-emerald-100">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Worker Concurrency: Active (5x)</span>
          </div>
          <span className="font-semibold text-white tracking-wide">
            99.9% Uptime Guarantee
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. WHITE FORM PANEL: Slides between Right (100%) and Left (0)              */}
      {/* ========================================================================= */}
      <div
        className={`w-full md:w-1/2 h-full absolute top-0 bottom-0 left-0 bg-white transition-transform duration-700 ease-in-out z-10 flex flex-col justify-center items-center p-8 sm:p-12 lg:p-16 ${
          isSignUp ? "md:translate-x-0" : "md:translate-x-full"
        }`}
      >
        <div className="w-full max-w-md">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-medium text-center">
              {error}
            </div>
          )}

          {isSignUp ? (
            /* ------------------ SIGN UP VIEW ------------------ */
            <div>
              <div className="text-center mb-6">
                <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  Create an Account
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Start scheduling campaigns in seconds
                </p>
              </div>

              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-[#EBF7EE] hover:bg-[#E0F2E4] border border-[#CDE9D3] text-slate-800 font-semibold py-3 px-4 rounded-xl transition duration-150 cursor-pointer disabled:opacity-50 text-sm"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{loading ? "Connecting..." : "Sign up with Google"}</span>
              </button>

              <div className="relative flex py-5 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-3 text-slate-400 text-[10px] font-bold tracking-wider uppercase">
                  or register with email
                </span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <form onSubmit={handleEmailSignup} className="space-y-3.5">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#F1F4F6] border-none text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00A859]/30"
                  required
                />
                <input
                  type="email"
                  placeholder="Email ID"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#F1F4F6] border-none text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00A859]/30"
                  required
                />
                <input
                  type="password"
                  placeholder="Password (min 6 chars)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#F1F4F6] border-none text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00A859]/30"
                  required
                />
                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#F1F4F6] border-none text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00A859]/30"
                  required
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 bg-[#00A859] hover:bg-[#00924D] active:bg-[#007F43] text-white font-semibold py-3.5 rounded-xl transition duration-150 shadow-md text-sm cursor-pointer disabled:opacity-50"
                >
                  {loading ? "Creating Account..." : "Create Account"}
                </button>
              </form>

              <p className="mt-6 text-center text-xs text-slate-500">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={toggleMode}
                  className="text-[#00A859] font-bold hover:underline cursor-pointer ml-1"
                >
                  Log In
                </button>
              </p>
            </div>
          ) : (
            /* ------------------ LOGIN VIEW ------------------ */
            <div>
              <div className="text-center mb-8">
                <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  Welcome Back
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Sign in to manage your scheduled emails
                </p>
              </div>

              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-[#EBF7EE] hover:bg-[#E0F2E4] border border-[#CDE9D3] text-slate-800 font-semibold py-3 px-4 rounded-xl transition duration-150 cursor-pointer disabled:opacity-50 text-sm"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>
                  {loading ? "Authenticating..." : "Sign in with Google"}
                </span>
              </button>

              <div className="relative flex py-6 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-3 text-slate-400 text-[10px] font-bold tracking-wider uppercase">
                  or sign in through email
                </span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <form onSubmit={handleEmailLogin} className="space-y-4">
                <input
                  type="email"
                  placeholder="Email ID"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#F1F4F6] border-none text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00A859]/30"
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#F1F4F6] border-none text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00A859]/30"
                  required
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 bg-[#00A859] hover:bg-[#00924D] active:bg-[#007F43] text-white font-semibold py-3.5 rounded-xl transition duration-150 shadow-md text-sm cursor-pointer disabled:opacity-50"
                >
                  {loading ? "Signing In..." : "Log In"}
                </button>
              </form>

              <p className="mt-6 text-center text-xs text-slate-500">
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={toggleMode}
                  className="text-[#00A859] font-bold hover:underline cursor-pointer ml-1"
                >
                  Create an Account
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
