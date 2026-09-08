"use client";
import React from "react";
import { User } from "../types";

interface HeaderProps {
  user: User;
  onLogout: () => void;
}

export default function Header({ user, onLogout }: HeaderProps) {
  return (
    <header className="bg-white border-b border-slate-100 px-8 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-6">
        {/* Brand Name */}
        <span className="text-2xl font-black text-slate-900 tracking-tight select-none">
          ONG
        </span>

        {/* User Card Pill */}
        <div className="flex items-center gap-3 bg-[#F8FAFC] border border-slate-200/80 px-3 py-1.5 rounded-2xl">
          <img
            src={user.avatar}
            alt={user.name}
            className="w-8 h-8 rounded-full object-cover shadow-xs"
          />
          <div className="leading-tight">
            <p className="text-xs font-bold text-slate-800">{user.name}</p>
            <p className="text-[10px] text-slate-400">{user.email}</p>
          </div>
          <button
            onClick={onLogout}
            title="Logout"
            className="ml-2 text-xs text-slate-400 hover:text-red-500 transition px-1"
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
          </button>
        </div>
      </div>

      {/* Centered Search Bar */}
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
            placeholder="Search"
            className="w-full bg-[#F3F4F6] border-none rounded-full pl-10 pr-4 py-2 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200 transition"
          />
        </div>
      </div>

      <div className="w-12"></div>
    </header>
  );
}
