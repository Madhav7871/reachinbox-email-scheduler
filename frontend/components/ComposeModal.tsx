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
  const [recipients, setRecipients] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [detectedEmails, setDetectedEmails] = useState<number>(0);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // File Upload Handler for CSV/TXT
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const extracted = text.match(emailRegex) || [];

      const uniqueEmails = Array.from(new Set(extracted));

      if (uniqueEmails.length > 0) {
        setDetectedEmails(uniqueEmails.length);
        const existing = recipients ? recipients + ", " : "";
        setRecipients(existing + uniqueEmails.join(", "));
      } else {
        alert("No valid email addresses found in this file.");
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const emailArray = recipients
      .split(",")
      .map((email) => email.trim())
      .filter((email) => email !== "");

    if (emailArray.length === 0) {
      alert("Please provide at least one valid email address.");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        emails: emailArray,
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

      // Show professional Toast Popup before closing
      setToastMessage(
        data.message ||
          `Successfully scheduled ${emailArray.length} email(s)! Excess items will be safely rescheduled if rate limits are hit.`,
      );

      setTimeout(() => {
        onSuccess();
      }, 2500); // Wait 2.5 seconds so user can read the toast popup
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Error scheduling emails");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden border border-slate-100 relative">
        {/* Toast Notification Popup Overlay */}
        {toastMessage && (
          <div className="absolute inset-x-0 top-0 z-50 bg-emerald-600 text-white px-6 py-4 flex items-center gap-3 shadow-xl animate-fade-in">
            <span className="text-xl">🚀</span>
            <div className="flex-1">
              <p className="text-xs font-bold uppercase tracking-wider">
                Campaign Queued Successfully
              </p>
              <p className="text-xs text-emerald-50 mt-0.5">{toastMessage}</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
          <h3 className="font-extrabold text-lg text-slate-800 tracking-tight">
            Compose New Campaign
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
          <div className="p-5 border border-dashed border-emerald-300 bg-[#F2FAF5] rounded-2xl flex items-center justify-between transition-colors hover:bg-emerald-50/80">
            <div>
              <p className="text-sm font-bold text-emerald-800">
                Import Leads (CSV/TXT)
              </p>
              <p className="text-xs font-medium text-emerald-600/80 mt-1">
                {detectedEmails > 0
                  ? `✅ Successfully extracted ${detectedEmails} emails`
                  : "Upload a file to auto-extract emails"}
              </p>
            </div>
            <label className="bg-white border border-emerald-200 text-emerald-700 px-5 py-2 rounded-xl text-xs font-bold cursor-pointer hover:bg-emerald-60 transition shadow-sm">
              Choose File
              <input
                type="file"
                accept=".csv, .txt"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-500 mb-2 uppercase tracking-widest">
              Recipients
            </label>
            <textarea
              placeholder="e.g. lead1@gmail.com, lead2@yahoo.com"
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
              className="w-full px-5 py-3 rounded-2xl bg-[#F4F6F8] border-none text-slate-900 text-sm focus:ring-2 focus:ring-[#00A859]/40 transition shadow-inner"
              required
              rows={2}
            />
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
              Schedule Time
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
              rows={6}
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
