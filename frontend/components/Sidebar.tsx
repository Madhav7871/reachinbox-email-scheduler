"use client";
import React from "react";

interface SidebarProps {
  activeTab: "scheduled" | "sent";
  setActiveTab: (tab: "scheduled" | "sent") => void;
  scheduledCount: number;
  sentCount: number;
  onOpenCompose: () => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  scheduledCount,
  sentCount,
  onOpenCompose,
}: SidebarProps) {
  return (
    <aside className="w-64 h-screen border-r border-slate-100 bg-white flex flex-col select-none shadow-[4px_0_24px_rgba(0,0,0,0.01)] z-10 pt-8">
      <div className="px-5 space-y-8">
        {/* Compose Button */}
        <button
          onClick={onOpenCompose}
          className="w-full bg-[#00A859] hover:bg-[#00924D] active:bg-[#007F43] text-white font-bold py-3.5 px-5 rounded-xl shadow-sm hover:shadow-md hover:shadow-[#00A859]/20 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer text-sm"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
            />
          </svg>
          <span>Compose Email</span>
        </button>

        {/* Navigation Links */}
        <div className="space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 mb-4">
            Core Navigation
          </p>

          <button
            onClick={() => setActiveTab("scheduled")}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer ${
              activeTab === "scheduled"
                ? "bg-emerald-50/80 text-[#00A859]"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            }`}
          >
            <div className="flex items-center gap-3">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Scheduled</span>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-colors duration-200 ${activeTab === "scheduled" ? "bg-emerald-100/80 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
            >
              {scheduledCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("sent")}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer ${
              activeTab === "sent"
                ? "bg-emerald-50/80 text-[#00A859]"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            }`}
          >
            <div className="flex items-center gap-3">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
              <span>Sent</span>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-colors duration-200 ${activeTab === "sent" ? "bg-emerald-100/80 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
            >
              {sentCount}
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
}
