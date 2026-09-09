"use client";
import React, { useEffect } from "react";

export interface ToastProps {
  message: string;
  type?: "success" | "error" | "warning" | "info";
  onClose: () => void;
  duration?: number;
}

export default function Toast({
  message,
  type = "success",
  onClose,
  duration = 4000,
}: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const getTitle = () => {
    switch (type) {
      case "success":
        return "Campaign Scheduled";
      case "error":
        return "Action Failed";
      case "warning":
        return "Rate Limit Notice";
      default:
        return "Notification";
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center max-w-md animate-fade-in">
      <div className="bg-white border border-slate-200/90 shadow-xl shadow-slate-900/5 rounded-2xl p-4 flex items-start gap-3.5 min-w-[340px] transition-all">
        {/* Professional Status Micro-Icon */}
        <div className="mt-0.5 shrink-0">
          {type === "success" && (
            <div className="w-6 h-6 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#00A859]">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
            </div>
          )}

          {type === "error" && (
            <div className="w-6 h-6 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
          )}

          {type !== "success" && type !== "error" && (
            <div className="w-6 h-6 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 pr-2">
          <p
            className={`text-[11px] font-black uppercase tracking-wider ${
              type === "success"
                ? "text-[#00A859]"
                : type === "error"
                  ? "text-rose-600"
                  : "text-amber-600"
            }`}
          >
            {getTitle()}
          </p>
          <p className="text-sm font-medium text-slate-700 mt-0.5 leading-snug break-words">
            {message}
          </p>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg p-1 transition shrink-0"
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
