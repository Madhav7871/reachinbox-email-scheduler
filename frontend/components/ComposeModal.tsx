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
  const [emails, setEmails] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Email validation regex
  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Handle typing recipients with chips (Comma/Space trigger)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (["Enter", ",", " "].includes(e.key)) {
      e.preventDefault();
      const trimmed = currentInput.trim().replace(/,/g, "");
      if (trimmed) {
        if (isValidEmail(trimmed)) {
          if (!emails.includes(trimmed)) {
            setEmails([...emails, trimmed]);
            setCurrentInput("");
            setErrorMsg(null);
          } else {
            setErrorMsg("Email already added.");
          }
        } else {
          setErrorMsg(`"${trimmed}" is not a valid email address.`);
        }
      }
    }
  };

  const removeEmail = (indexToRemove: number) => {
    setEmails(emails.filter((_, idx) => idx !== indexToRemove));
  };

  // File Upload Handler for CSV/TXT with Validation
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const extracted =
        text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];

      const validExtracted = extracted.filter(isValidEmail);
      const uniqueEmails = Array.from(new Set([...emails, ...validExtracted]));

      if (uniqueEmails.length > emails.length) {
        setEmails(uniqueEmails);
        setErrorMsg(null);
      } else {
        setErrorMsg("No valid new emails found in file.");
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Include whatever is typed in current input if valid
    let finalEmails = [...emails];
    const leftover = currentInput.trim();
    if (leftover) {
      if (isValidEmail(leftover) && !finalEmails.includes(leftover)) {
        finalEmails.push(leftover);
      }
    }

    if (finalEmails.length === 0) {
      setErrorMsg("Please enter at least one valid recipient email.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const payload = {
        emails: finalEmails,
        subject,
        body,
        senderId: userEmail,
        scheduledAt: scheduledAt
          ? new Date(scheduledAt).toISOString()
          : new Date().toISOString(),
      };

      const res = await fetch("http://localhost:3001/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to schedule emails");

      setToastMessage(
        data.message ||
          `Successfully scheduled ${finalEmails.length} campaign(s)!`,
      );

      setTimeout(() => {
        onSuccess();
      }, 2500);
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message || "Error scheduling emails");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-100 relative">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="absolute inset-x-0 top-0 z-50 bg-emerald-600 text-white px-6 py-4 flex items-center gap-3 shadow-xl">
            <span className="text-xl">🚀</span>
            <div className="flex-1">
              <p className="text-xs font-bold uppercase tracking-wider">
                Campaign Queued
              </p>
              <p className="text-xs text-emerald-50 mt-0.5">{toastMessage}</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
          <h3 className="font-extrabold text-lg text-slate-800 tracking-tight flex items-center gap-2">
            <span>Compose New Campaign</span>
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 w-8 h-8 rounded-full flex items-center justify-center transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="p-8 flex-1 overflow-y-auto space-y-5 custom-scrollbar"
        >
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-xs font-semibold">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* CSV File Upload Box */}
          <div className="p-5 border border-dashed border-emerald-300 bg-[#F2FAF5] rounded-2xl flex items-center justify-between transition-colors hover:bg-emerald-50/80">
            <div>
              <p className="text-sm font-bold text-emerald-800">
                Import Leads (CSV/TXT)
              </p>
              <p className="text-xs font-medium text-emerald-600/80 mt-1">
                {emails.length > 0
                  ? `✅ ${emails.length} valid recipient(s) added`
                  : "Upload file to auto-extract valid emails"}
              </p>
            </div>
            <label className="bg-white border border-emerald-200 text-emerald-700 px-5 py-2 rounded-xl text-xs font-bold cursor-pointer hover:bg-emerald-50 transition shadow-sm">
              Choose File
              <input
                type="file"
                accept=".csv, .txt"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          </div>

          {/* Professional Mailbox Chip Input for Recipients */}
          <div>
            <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase tracking-widest">
              Recipients
            </label>
            <div className="w-full min-h-[50px] px-4 py-2.5 rounded-2xl bg-[#F4F6F8] border-none flex flex-wrap items-center gap-2 shadow-inner focus-within:ring-2 focus-within:ring-[#00A859]/40 transition">
              {emails.map((email, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold"
                >
                  {email}
                  <button
                    type="button"
                    onClick={() => removeEmail(idx)}
                    className="hover:text-rose-600 transition cursor-pointer"
                  >
                    ✕
                  </button>
                </span>
              ))}
              <input
                type="email"
                placeholder={
                  emails.length === 0
                    ? "Type email & press space/comma..."
                    : "Add more..."
                }
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent border-none text-slate-900 text-sm focus:outline-none min-w-[200px]"
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Press space, comma, or enter to add multiple valid email
              recipients.
            </span>
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase tracking-widest">
              Subject
            </label>
            <input
              type="text"
              placeholder="Campaign Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-5 py-3 rounded-2xl bg-[#F4F6F8] border-none text-slate-900 text-sm focus:ring-2 focus:ring-[#00A859]/40 transition shadow-inner"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase tracking-widest">
              Schedule Date & Time
            </label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full px-5 py-3 rounded-2xl bg-[#F4F6F8] border-none text-slate-900 text-sm focus:ring-2 focus:ring-[#00A859]/40 transition shadow-inner"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase tracking-widest">
              Email Content
            </label>
            <textarea
              placeholder="Write your email body here..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              className="w-full px-5 py-4 rounded-2xl bg-[#F4F6F8] border-none text-slate-900 text-sm focus:ring-2 focus:ring-[#00A859]/40 transition shadow-inner resize-none"
              required
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-6 pb-2 flex justify-end gap-3 border-t border-slate-100 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !!toastMessage}
              className="px-8 py-3 bg-[#00A859] hover:bg-[#00924D] text-white text-sm font-extrabold rounded-xl shadow-lg hover:shadow-xl transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Processing..." : "Schedule Campaign"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
