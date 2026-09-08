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

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

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
      if (err.code !== "auth/popup-closed-by-user") {
        setError(err?.message || "Google authentication failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password)
      return setError("Please provide both email and password.");
    try {
      setLoading(true);
      setError("");
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;
      onLogin({
        name: user.displayName || (user.email || email).split("@")[0],
        email: user.email || email,
        avatar:
          user.photoURL ||
          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop&crop=faces",
      });
    } catch (err: any) {
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

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password)
      return setError("Please fill in all fields.");
    if (password.length < 6)
      return setError("Password must be at least 6 characters.");
    if (password !== confirmPassword)
      return setError("Passwords do not match.");
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
    <div className="w-screen h-screen min-h-screen overflow-hidden flex relative bg-white font-sans select-none">
      {/* ========================================================================= */}
      {/* 1. GREEN BRAND PANEL: Slides Left (0) <-> Right (100%)                    */}
      {/* ========================================================================= */}
      <div
        className={`hidden md:flex w-full md:w-1/2 h-full absolute top-0 bottom-0 left-0 bg-gradient-to-br from-[#003820] via-[#007040] to-[#00A859] text-white p-10 md:p-16 flex-col justify-between transition-transform duration-1000 ease-[cubic-bezier(0.82,0.0,0.18,1.0)] z-20 shadow-2xl ${
          isSignUp ? "md:translate-x-full" : "md:translate-x-0"
        }`}
      >
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/15 via-transparent to-transparent pointer-events-none"></div>

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
              <svg
                className="w-5 h-5 text-[#00A859]"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight">ReachInbox</span>
          </div>
          <span className="px-3 py-1 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-[10px] font-bold uppercase tracking-wider">
            v2.4 Production
          </span>
        </div>

        <div className="relative z-10 flex-1 flex flex-col justify-center">
          {/* SMOOTH TEXT CROSSFADE WRAPPER */}
          <div className="relative w-full h-[220px]">
            {/* Sign Up Text */}
            <div
              className={`absolute top-0 left-0 w-full transition-all duration-700 ease-in-out transform ${isSignUp ? "opacity-100 translate-x-0 delay-200" : "opacity-0 -translate-x-12 pointer-events-none"}`}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold mb-6 backdrop-blur-md text-emerald-100">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Automated Lead Scaling
              </div>
              <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.15] mb-5">
                Scale Cold Outreach with Zero Dropouts.
              </h2>
              <p className="text-sm lg:text-base text-emerald-50 leading-relaxed font-medium max-w-lg">
                Create sequences, enforce hourly throttling, and ensure
                fault-tolerant email execution backed by BullMQ and Redis
                queues.
              </p>
            </div>

            {/* Login Text */}
            <div
              className={`absolute top-0 left-0 w-full transition-all duration-700 ease-in-out transform ${!isSignUp ? "opacity-100 translate-x-0 delay-200" : "opacity-0 translate-x-12 pointer-events-none"}`}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold mb-6 backdrop-blur-md text-emerald-100">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Intelligent Email Infrastructure
              </div>
              <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.15] mb-5">
                Supercharge Your Email Scheduler at Scale.
              </h2>
              <p className="text-sm lg:text-base text-emerald-50 leading-relaxed font-medium max-w-lg">
                Manage persistent scheduled jobs, monitor deliverability, and
                send high-converting outreach sequences effortlessly.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4 max-w-md mt-6">
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="p-2.5 bg-emerald-500/20 rounded-xl">
                <svg
                  className="w-6 h-6 text-emerald-200"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-white mb-0.5">BullMQ Queues</h3>
                <p className="text-xs text-emerald-100/80">
                  Sub-second delayed jobs with Redis
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="p-2.5 bg-emerald-500/20 rounded-xl">
                <svg
                  className="w-6 h-6 text-emerald-200"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-white mb-0.5">Rate Throttling</h3>
                <p className="text-xs text-emerald-100/80">
                  Anti-spam safe dispatch & Slack alerts
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-emerald-200/70 font-semibold">
          <span>Worker Concurrency: Active (5x)</span>
          <span>99.9% Uptime Guarantee</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. WHITE FORM PANEL: Slides Right (100%) <-> Left (0)                     */}
      {/* ========================================================================= */}
      <div
        className={`w-full md:w-1/2 h-full absolute top-0 bottom-0 left-0 bg-white transition-transform duration-1000 ease-[cubic-bezier(0.82,0.0,0.18,1.0)] z-10 flex flex-col justify-center items-center p-8 sm:p-12 lg:p-16 ${
          isSignUp ? "md:translate-x-0" : "md:translate-x-full"
        }`}
      >
        <div className="w-full max-w-sm relative min-h-[580px] flex items-center">
          {/* FLOATING ERROR MESSAGE */}
          <div
            className={`absolute top-0 left-0 w-full transition-all duration-300 z-30 ${error ? "opacity-100 -translate-y-4" : "opacity-0 translate-y-0 pointer-events-none"}`}
          >
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-sm font-semibold flex items-center gap-2 shadow-sm">
              <svg
                className="w-5 h-5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {error}
            </div>
          </div>

          {/* ------------------ SIGN UP FORM ------------------ */}
          <div
            className={`absolute top-12 left-0 w-full transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] transform ${isSignUp ? "opacity-100 translate-x-0 z-20 delay-100" : "opacity-0 -translate-x-16 pointer-events-none z-0"}`}
          >
            <div className="text-center mb-8">
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
                Create an Account
              </h3>
              <p className="text-sm font-medium text-slate-500">
                Start scheduling campaigns in seconds
              </p>
            </div>

            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 group disabled:opacity-50"
            >
              <svg
                className="w-5 h-5 group-hover:scale-105 transition-transform"
                viewBox="0 0 24 24"
              >
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span className="text-sm font-bold text-slate-700">
                {loading ? "Connecting..." : "Sign up with Google"}
              </span>
            </button>

            <div className="relative flex py-6 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-4 text-slate-400 text-[11px] font-bold tracking-widest uppercase">
                Or register with email
              </span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <form onSubmit={handleEmailSignup} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 ml-1">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#00A859]/10 focus:border-[#00A859] transition-all"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 ml-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#00A859]/10 focus:border-[#00A859] transition-all"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 ml-1">
                    Password
                  </label>
                  <input
                    type="password"
                    placeholder="Min 6 chars"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#00A859]/10 focus:border-[#00A859] transition-all"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 ml-1">
                    Confirm
                  </label>
                  <input
                    type="password"
                    placeholder="Confirm"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#00A859]/10 focus:border-[#00A859] transition-all"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 px-4 py-3 text-sm font-extrabold text-white bg-[#00A859] rounded-xl hover:bg-[#00924D] shadow-lg shadow-[#00A859]/25 transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm font-medium text-slate-500">
              Already have an account?{" "}
              <button
                type="button"
                onClick={toggleMode}
                className="font-bold text-[#00A859] hover:text-[#00924D] transition"
              >
                Log In
              </button>
            </p>
          </div>

          {/* ------------------ LOGIN FORM ------------------ */}
          <div
            className={`absolute top-12 left-0 w-full transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] transform ${!isSignUp ? "opacity-100 translate-x-0 z-20 delay-100" : "opacity-0 translate-x-16 pointer-events-none z-0"}`}
          >
            <div className="text-center mb-8">
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
                Welcome Back
              </h3>
              <p className="text-sm font-medium text-slate-500">
                Sign in to manage your scheduled campaigns
              </p>
            </div>

            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 group disabled:opacity-50"
            >
              <svg
                className="w-5 h-5 group-hover:scale-105 transition-transform"
                viewBox="0 0 24 24"
              >
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span className="text-sm font-bold text-slate-700">
                {loading ? "Authenticating..." : "Sign in with Google"}
              </span>
            </button>

            <div className="relative flex py-6 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-4 text-slate-400 text-[11px] font-bold tracking-widest uppercase">
                Or sign in with email
              </span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 ml-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#00A859]/10 focus:border-[#00A859] transition-all"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-xs font-bold text-slate-700">
                    Password
                  </label>
                  <a
                    href="#"
                    className="text-xs font-bold text-[#00A859] hover:text-[#00924D] transition"
                  >
                    Forgot?
                  </a>
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-[#00A859]/10 focus:border-[#00A859] transition-all"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 px-4 py-3 text-sm font-extrabold text-white bg-[#00A859] rounded-xl hover:bg-[#00924D] shadow-lg shadow-[#00A859]/25 transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? "Signing In..." : "Log In"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm font-medium text-slate-500">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={toggleMode}
                className="font-bold text-[#00A859] hover:text-[#00924D] transition"
              >
                Create an Account
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
