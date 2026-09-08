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
    <aside className="w-64 border-r border-slate-100 p-5 flex flex-col gap-6 bg-white min-h-[calc(100vh-73px)]">
      {/* Compose Pill Button */}
      <button
        onClick={onOpenCompose}
        className="w-full border-2 border-[#00A859] text-[#00A859] hover:bg-[#00A859] hover:text-white font-semibold py-2.5 px-6 rounded-full transition-all duration-200 shadow-xs text-sm text-center"
      >
        Compose
      </button>

      {/* Navigation Group */}
      <div className="space-y-1.5">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
          CORE
        </p>

        {/* Scheduled Tab */}
        <button
          onClick={() => setActiveTab("scheduled")}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
            activeTab === "scheduled"
              ? "bg-[#D6F5E3] text-[#008746] font-bold"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <div className="flex items-center gap-3">
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
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Scheduled</span>
          </div>
          <span className="text-xs bg-white text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200 shadow-2xs font-semibold">
            {scheduledCount}
          </span>
        </button>

        {/* Sent Tab */}
        <button
          onClick={() => setActiveTab("sent")}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
            activeTab === "sent"
              ? "bg-[#D6F5E3] text-[#008746] font-bold"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <div className="flex items-center gap-3">
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
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
            <span>Sent</span>
          </div>
          <span className="text-xs bg-white text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200 shadow-2xs font-semibold">
            {sentCount}
          </span>
        </button>
      </div>
    </aside>
  );
}
