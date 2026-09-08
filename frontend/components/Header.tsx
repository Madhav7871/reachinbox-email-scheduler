"use client";
import React, { useState } from "react";
import { User } from "../types";

interface HeaderProps {
  user: User;
  onLogout: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export default function Header({
  user,
  onLogout,
  searchQuery,
  setSearchQuery,
}: HeaderProps) {
  const profileUser = user as typeof user & {
    avatar?: string;
    photoURL?: string;
    displayName?: string;
  };

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSlackModalOpen, setIsSlackModalOpen] = useState(false);
  const [slackWebhook, setSlackWebhook] = useState("");
  const [savingSlack, setSavingSlack] = useState(false);
  const [slackMessage, setSlackMessage] = useState<string | null>(null);

  const handleSaveSlack = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSlack(true);
    setSlackMessage(null);

    try {
      const res = await fetch("http://localhost:3001/api/settings/slack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderId: user.email, slackWebhook }),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Failed to save Slack webhook");

      setSlackMessage("✅ Slack connected successfully!");
      setTimeout(() => {
        setIsSlackModalOpen(false);
        setSlackMessage(null);
      }, 2000);
    } catch (err: any) {
      setSlackMessage(`❌ ${err.message}`);
    } finally {
      setSavingSlack(false);
    }
  };

  return (
    <header className="h-[96px] bg-white border-b border-slate-100 flex items-center justify-between px-8 w-full relative z-30 select-none">
      {/* Left Side: Premium ReachInbox Logo */}
      <div className="flex items-center gap-3.5 mr-8 shrink-0">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00c96a] to-[#00924D] flex items-center justify-center shadow-md shadow-[#00A859]/30 border border-[#00A859]/20">
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <div className="flex flex-col mt-0.5 hidden sm:flex">
          <div className="flex items-baseline gap-0.5">
            <span className="text-[20px] font-extrabold text-slate-800 tracking-tight">
              Reach
            </span>
            <span className="text-[20px] font-extrabold text-[#00A859] tracking-tight">
              Inbox
            </span>
          </div>
          <span className="text-[9px] font-black text-slate-400 tracking-[0.18em] uppercase mt-0.5">
            Production Engine
          </span>
        </div>
      </div>

      {/* Middle: Search Bar */}
      <div className="flex-1 max-w-2xl mx-4">
        <div className="relative group">
          <svg
            className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#00A859] transition-colors"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by recipient, subject, or content..."
            className="w-full bg-slate-50/70 border border-slate-200 text-sm text-slate-800 font-medium rounded-full pl-11 pr-4 py-2.5 focus:outline-none focus:ring-4 focus:ring-[#00A859]/10 focus:border-[#00A859]/50 focus:bg-white transition-all placeholder-slate-400"
          />
        </div>
      </div>

      {/* Right Side: User Profile & Dropdown */}
      <div className="relative ml-4 shrink-0">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-3 p-1.5 pr-3 rounded-full hover:bg-slate-50 transition cursor-pointer border border-transparent hover:border-slate-100 group"
        >
          <img
            src={
              user.avatar ||
              profileUser.photoURL ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || "User")}&background=00A859&color=fff`
            }
            alt="Profile"
            className="w-10 h-10 rounded-full object-cover shadow-sm border border-slate-100"
          />
          <div className="text-left hidden lg:block">
            <p className="text-sm font-bold text-slate-800 leading-tight group-hover:text-[#00A859] transition-colors">
              {user.name || "User"}
            </p>
            <p className="text-[10px] text-slate-400 font-medium truncate max-w-[140px]">
              {user.email}
            </p>
          </div>
          <svg
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isDropdownOpen ? "rotate-180 text-[#00A859]" : "group-hover:text-[#00A859]"}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-slide-up">
            <div className="px-4 py-3 border-b border-slate-100 lg:hidden">
              <p className="text-sm font-bold text-slate-800">
                {user.name || profileUser.displayName || "User"}
              </p>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">
                {user.email}
              </p>
            </div>

            {/* Connect Slack */}
            <button
              onClick={() => {
                setIsDropdownOpen(false);
                setIsSlackModalOpen(true);
              }}
              className="w-full text-left px-4 py-3 text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-[#00A859] transition flex items-center gap-3 cursor-pointer"
            >
              <svg
                className="w-4 h-4 text-[#00A859]"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52-2.523c0-1.394 1.127-2.52 2.52-2.52h2.524v2.52c0 1.396-1.13 2.523-2.524 2.523zm3.784 0a2.528 2.528 0 0 1 2.521-2.523c1.394 0 2.52 1.127 2.52 2.52v6.31c0 1.395-1.126 2.521-2.52 2.521a2.528 2.528 0 0 1-2.521-2.52v-6.308zm1.26-6.31a2.528 2.528 0 0 1-2.523-2.52c0-1.395 1.129-2.522 2.523-2.522 1.393 0 2.52 1.127 2.52 2.522v2.52h-2.52zm0 3.785a2.528 2.528 0 0 1 2.52-2.52c1.396 0 2.523 1.126 2.523 2.52v2.524H10.086v-2.524zm6.307-5.045c0-1.395 1.127-2.522 2.52-2.522a2.528 2.528 0 0 1 2.523 2.522c0 1.393-1.127 2.52-2.523 2.52h-2.52v-2.52zm0 3.785h6.31c1.393 0 2.52 1.127 2.52 2.52a2.528 2.528 0 0 1-2.52 2.523h-6.31v-5.043zm-1.26 6.308a2.528 2.528 0 0 1 2.523 2.52c0 1.396-1.13 2.524-2.523 2.524-1.394 0-2.52-1.128-2.52-2.524v-2.52h2.52zm0-3.785a2.528 2.528 0 0 1-2.52 2.524c-1.397 0-2.524-1.128-2.524-2.524v-2.523h5.044v2.523z" />
              </svg>
              <span>Connect Slack Alerts</span>
            </button>

            {/* Logout */}
            <button
              onClick={onLogout}
              className="w-full text-left px-4 py-3 text-xs font-bold text-rose-600 hover:bg-rose-50 transition flex items-center gap-3 cursor-pointer"
            >
              <svg
                className="w-4 h-4 text-rose-600"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>

      {/* Connect Slack Modal Overlay */}
      {isSlackModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 border border-slate-100 relative animate-fade-in">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#00A859] flex items-center justify-center">
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52-2.523c0-1.394 1.127-2.52 2.52-2.52h2.524v2.52c0 1.396-1.13 2.523-2.524 2.523zm3.784 0a2.528 2.528 0 0 1 2.521-2.523c1.394 0 2.52 1.127 2.52 2.52v6.31c0 1.395-1.126 2.521-2.52 2.521a2.528 2.528 0 0 1-2.521-2.52v-6.308zm1.26-6.31a2.528 2.528 0 0 1-2.523-2.52c0-1.395 1.129-2.522 2.523-2.522 1.393 0 2.52 1.127 2.52 2.522v2.52h-2.52zm0 3.785a2.528 2.528 0 0 1 2.52-2.52c1.396 0 2.523 1.126 2.523 2.52v2.524H10.086v-2.524zm6.307-5.045c0-1.395 1.127-2.522 2.52-2.522a2.528 2.528 0 0 1 2.523 2.522c0 1.393-1.127 2.52-2.523 2.52h-2.52v-2.52zm0 3.785h6.31c1.393 0 2.52 1.127 2.52 2.52a2.528 2.528 0 0 1-2.52 2.523h-6.31v-5.043zm-1.26 6.308a2.528 2.528 0 0 1 2.523 2.52c0 1.396-1.13 2.524-2.523 2.524-1.394 0-2.52-1.128-2.52-2.524v-2.52h2.52zm0-3.785a2.528 2.528 0 0 1-2.52 2.524c-1.397 0-2.524-1.128-2.524-2.524v-2.523h5.044v2.523z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-800">
                    Connect Slack
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Receive hourly rate limit alerts
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSlackModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSlack} className="space-y-5">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-wider">
                  Webhook URL
                </label>
                <input
                  type="url"
                  placeholder="https://hooks.slack.com/services/T00..."
                  value={slackWebhook}
                  onChange={(e) => setSlackWebhook(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:ring-4 focus:ring-[#00A859]/10 focus:border-[#00A859] transition-all"
                  required
                />
              </div>

              {slackMessage && (
                <div
                  className={`p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 ${slackMessage.includes("❌") ? "bg-rose-50 text-rose-600 border border-rose-100" : "bg-emerald-50 text-emerald-700 border border-emerald-100"}`}
                >
                  {slackMessage}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSlackModalOpen(false)}
                  className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSlack}
                  className="px-6 py-2.5 bg-[#00A859] hover:bg-[#00924D] text-white text-xs font-extrabold rounded-xl shadow-md shadow-[#00A859]/20 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {savingSlack ? "Connecting..." : "Save Connection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
