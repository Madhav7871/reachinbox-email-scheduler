"use client";
import React, { useEffect } from "react";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "warning";
  onClose: () => void;
}

export default function Toast({
  message,
  type = "success",
  onClose,
}: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4500); // Auto close after 4.5 seconds
    return () => clearTimeout(timer);
  }, [onClose]);

  // Clean Light Theme Styling
  const themeStyles = {
    success: "bg-white border-emerald-200 text-slate-800 shadow-emerald-500/10",
    error: "bg-white border-rose-200 text-slate-800 shadow-rose-500/10",
    warning: "bg-white border-amber-200 text-slate-800 shadow-amber-500/10",
  };

  const lineColors = {
    success: "bg-[#00A859]",
    error: "bg-rose-500",
    warning: "bg-amber-500",
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up select-none">
      <div
        className={`relative overflow-hidden rounded-2xl shadow-2xl border px-5 py-4 min-w-[320px] max-w-md backdrop-blur-md ${themeStyles[type]}`}
      >
        <div className="flex items-start gap-3.5">
          <span className="text-xl mt-0.5">
            {type === "success" ? "🚀" : type === "error" ? "❌" : "⚠️"}
          </span>
          <div className="flex-1 pr-4">
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              {type === "success"
                ? "Campaign Notification"
                : type === "error"
                  ? "System Error"
                  : "Rate Limit Warning"}
            </p>
            <p className="text-xs text-slate-700 mt-1 leading-relaxed font-semibold">
              {message}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 transition text-xs font-bold cursor-pointer w-6 h-6 rounded-full flex items-center justify-center hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        {/* Bottom Timer Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100">
          <div
            className={`h-full w-full animate-shrink-timer ${lineColors[type]}`}
          ></div>
        </div>
      </div>
    </div>
  );
}
