"use client";
import React, { useState } from "react";

interface ComposeModalProps {
  userEmail: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ComposeModal({
  userEmail,
  onClose,
  onSuccess,
}: ComposeModalProps) {
  const [recipients, setRecipients] = useState<string[]>([]);
  const [recipientInput, setRecipientInput] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [delay, setDelay] = useState("00");
  const [hourlyLimit, setHourlyLimit] = useState("00");
  const [scheduledAt, setScheduledAt] = useState("");
  const [showSendLater, setShowSendLater] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const extractedEmails = text.match(/[\w.-]+@[\w.-]+\.\w+/g) || [];
      setRecipients((prev) =>
        Array.from(new Set([...prev, ...extractedEmails])),
      );
    };
    reader.readAsText(file);
  };

  const addManualRecipient = () => {
    if (recipientInput && recipientInput.includes("@")) {
      setRecipients([...recipients, recipientInput.trim()]);
      setRecipientInput("");
    }
  };

  const removeRecipient = (indexToRemove: number) => {
    setRecipients(recipients.filter((_, idx) => idx !== indexToRemove));
  };

  const handleScheduleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (recipients.length === 0) {
      alert("Please add at least one recipient or upload a CSV list.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("http://localhost:3001/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emails: recipients,
          subject: subject || "No Subject",
          body,
          scheduledAt: scheduledAt
            ? new Date(scheduledAt).toISOString()
            : new Date().toISOString(),
          senderId: userEmail,
        }),
      });

      if (res.ok) {
        onSuccess();
      } else {
        const data = await res.json();
        alert(`Error: ${data.error || "Failed to schedule"}`);
      }
    } catch (err) {
      console.error(err);
      alert("Network error communicating with backend server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200 flex flex-col relative max-h-[92vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-800 transition"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </button>
            <h2 className="text-base font-bold text-slate-800">
              Compose New Email
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Attachment icon */}
            <label
              className="cursor-pointer text-slate-400 hover:text-slate-600 transition"
              title="Attach CSV leads"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                />
              </svg>
              <input
                type="file"
                accept=".csv, .txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {/* Timer icon for Send Later */}
            <button
              type="button"
              onClick={() => setShowSendLater(!showSendLater)}
              className={`transition ${showSendLater ? "text-[#00A859]" : "text-slate-400 hover:text-slate-600"}`}
              title="Schedule Options"
            >
              <svg
                className="w-5 h-5"
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
            </button>

            {/* Main Action Button */}
            <button
              onClick={() => handleScheduleSubmit()}
              disabled={loading}
              className="bg-transparent border border-[#00A859] hover:bg-[#00A859] text-[#00A859] hover:text-white font-semibold text-xs py-1.5 px-5 rounded-full transition shadow-2xs"
            >
              {loading ? "Processing..." : scheduledAt ? "Send Later" : "Send"}
            </button>
          </div>
        </div>

        {/* Modal Form */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* From */}
          <div className="flex items-center gap-4 text-xs">
            <span className="w-20 text-slate-400 font-medium">From</span>
            <div className="bg-slate-100 text-slate-700 font-semibold px-3 py-1.5 rounded-lg flex items-center gap-2">
              <span>{userEmail}</span>
              <svg
                className="w-3.5 h-3.5 text-slate-400"
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
            </div>
          </div>

          {/* To Field & CSV Upload */}
          <div className="flex items-start gap-4 text-xs">
            <span className="w-20 pt-2 text-slate-400 font-medium">To</span>
            <div className="flex-1 flex flex-wrap items-center gap-2">
              {recipients.map((em, idx) => (
                <span
                  key={idx}
                  className="bg-[#D6F5E3] text-[#008746] border border-[#BBEBD0] px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5"
                >
                  {em}
                  <button
                    type="button"
                    onClick={() => removeRecipient(idx)}
                    className="hover:text-red-500 font-bold"
                  >
                    &times;
                  </button>
                </span>
              ))}

              <input
                type="email"
                placeholder="recipient@example.com"
                value={recipientInput}
                onChange={(e) => setRecipientInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  (e.preventDefault(), addManualRecipient())
                }
                className="flex-1 min-w-[200px] py-1 text-slate-800 text-xs focus:outline-none placeholder-slate-300"
              />

              {/* Upload CSV List Link */}
              <label className="cursor-pointer text-[#00A859] hover:underline font-semibold flex items-center gap-1 shrink-0 ml-auto">
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
                <span>Upload List</span>
                <input
                  type="file"
                  accept=".csv, .txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="border-b border-slate-100 my-1"></div>

          {/* Subject */}
          <div className="flex items-center gap-4 text-xs">
            <span className="w-20 text-slate-400 font-medium">Subject</span>
            <input
              type="text"
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="flex-1 py-1 text-slate-800 text-sm focus:outline-none placeholder-slate-300 font-medium"
            />
          </div>

          <div className="border-b border-slate-100 my-1"></div>

          {/* Delays & Limits */}
          <div className="flex items-center gap-8 text-xs py-1 text-slate-600">
            <div className="flex items-center gap-2">
              <span>Delay between 2 emails:</span>
              <input
                type="text"
                value={delay}
                onChange={(e) => setDelay(e.target.value)}
                className="w-12 px-2 py-1 bg-slate-100 rounded border-none text-center font-semibold focus:bg-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <span>Hourly Limit:</span>
              <input
                type="text"
                value={hourlyLimit}
                onChange={(e) => setHourlyLimit(e.target.value)}
                className="w-14 px-2 py-1 bg-slate-100 rounded border-none text-center font-semibold focus:bg-white"
              />
            </div>
          </div>

          {/* Body Editor with Figma Mock Toolbar */}
          <div className="bg-[#F8FAFC] border border-slate-200/80 rounded-2xl overflow-hidden mt-3">
            {/* Figma-Style Formatting Toolbar */}
            <div className="flex items-center gap-3 px-4 py-2 border-b border-slate-200/60 text-slate-400 text-xs">
              <button type="button" className="hover:text-slate-700">
                ↶
              </button>
              <button type="button" className="hover:text-slate-700">
                ↷
              </button>
              <div className="w-[1px] h-3 bg-slate-200"></div>
              <button type="button" className="hover:text-slate-700 font-bold">
                B
              </button>
              <button type="button" className="hover:text-slate-700 italic">
                I
              </button>
              <button type="button" className="hover:text-slate-700 underline">
                U
              </button>
              <div className="w-[1px] h-3 bg-slate-200"></div>
              <button type="button" className="hover:text-slate-700">
                ≡
              </button>
              <button type="button" className="hover:text-slate-700">
                “
              </button>
              <button type="button" className="hover:text-slate-700">
                🔗
              </button>
            </div>

            <textarea
              rows={8}
              placeholder="Type Your Reply..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full p-4 bg-transparent border-none text-slate-800 text-sm placeholder-slate-400 focus:outline-none resize-none"
            />
          </div>
        </div>

        {/* Figma "Send Later" Popover Modal */}
        {showSendLater && (
          <div className="absolute right-6 top-16 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 z-20">
            <h4 className="font-bold text-slate-900 text-sm mb-3">
              Send Later
            </h4>

            <div className="mb-4">
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Pick date & time
              </label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 mb-5">
              <p
                className="hover:bg-slate-50 p-1.5 rounded cursor-pointer"
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() + 1);
                  d.setHours(9, 0, 0, 0);
                  setScheduledAt(d.toISOString().slice(0, 16));
                }}
              >
                Tomorrow, 09:00 AM
              </p>
              <p
                className="hover:bg-slate-50 p-1.5 rounded cursor-pointer"
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() + 1);
                  d.setHours(11, 0, 0, 0);
                  setScheduledAt(d.toISOString().slice(0, 16));
                }}
              >
                Tomorrow, 11:00 AM
              </p>
              <p
                className="hover:bg-slate-50 p-1.5 rounded cursor-pointer"
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() + 1);
                  d.setHours(15, 0, 0, 0);
                  setScheduledAt(d.toISOString().slice(0, 16));
                }}
              >
                Tomorrow, 03:00 PM
              </p>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setShowSendLater(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setShowSendLater(false)}
                className="px-4 py-1.5 text-xs font-semibold border border-[#00A859] text-[#00A859] hover:bg-[#00A859] hover:text-white rounded-lg transition"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
