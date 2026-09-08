"use client";
import React, { useState } from "react";
import { User } from "../types";

interface HeaderProps {
  user: User;
  onLogout: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export default function Header({
  user,
  onLogout,
  searchQuery,
  setSearchQuery,
}: HeaderProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="bg-white border-b border-slate-100 px-8 py-3.5 flex items-center justify-between relative z-30">
      {/* Brand Logo & Profile Pill */}
      <div className="flex items-center gap-6">
        <span className="text-2xl font-black text-slate-900 tracking-tight select-none">
          ONG
        </span>

        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 bg-[#F8FAFC] hover:bg-slate-100 border border-slate-200/80 px-3 py-1.5 rounded-2xl transition cursor-pointer text-left"
          >
            <div className="relative">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover border border-slate-200"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
            </div>
            <div className="leading-tight">
              <p className="text-xs font-bold text-slate-800">{user.name}</p>
              <p className="text-[10px] text-slate-400 truncate max-w-[140px]">
                {user.email}
              </p>
            </div>
            <svg
              className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showProfileMenu ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-3 space-y-2 z-50">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900">{user.name}</p>
                <p className="text-[11px] text-slate-400 truncate">
                  {user.email}
                </p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  SMTP: Connected
                </div>
              </div>

              <div className="space-y-1 text-xs text-slate-600">
                <button
                  onClick={() => setShowProfileMenu(false)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 transition flex items-center justify-between"
                >
                  <span>Queue Engine</span>
                  <span className="text-[10px] font-bold text-slate-400">
                    BullMQ
                  </span>
                </button>
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onLogout();
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-50 text-red-600 font-semibold transition flex items-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Real-time Search Input Bar */}
      <div className="flex items-center gap-3 flex-1 max-w-xl mx-8">
        <div className="relative w-full">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search by recipient, subject, or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F3F4F6] border-none rounded-full pl-10 pr-10 py-2 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/30 transition shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="w-12"></div>
    </header>
  );
}
