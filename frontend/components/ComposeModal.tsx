"use client";
import React, { useState, useEffect, useRef } from "react";

interface ComposeModalProps {
  userEmail: string;
  onClose: () => void;
  onSuccess: (msg?: string) => void;
}

export default function ComposeModal({
  userEmail,
  onClose,
  onSuccess,
}: ComposeModalProps) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [emails, setEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState("");

  const [delaySec, setDelaySec] = useState<number>(0);
  const [hourlyLimit, setHourlyLimit] = useState<number>(0);

  const [scheduledAt, setScheduledAt] = useState("");
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [tempSchedule, setTempSchedule] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    const formatted = now.toISOString().slice(0, 16);
    setScheduledAt(formatted);
    setTempSchedule(formatted);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const extractedEmails =
        text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi) || [];
      const uniqueEmails = Array.from(new Set([...emails, ...extractedEmails]));
      setEmails(uniqueEmails);
    };
    reader.readAsText(file);
    e.target.value = ""; // Reset input to allow re-uploading same file if needed
  };

  const handleAddEmail = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const newEmail = emailInput.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(newEmail) && !emails.includes(newEmail)) {
        setEmails([...emails, newEmail]);
        setEmailInput("");
      }
    }
  };

  const removeEmail = (emailToRemove: string) => {
    setEmails(emails.filter((e) => e !== emailToRemove));
  };

  // Rich Text Editor Command Execution
  const executeCommand = (command: string) => {
    document.execCommand(command, false, undefined);
    editorRef.current?.focus();
    if (editorRef.current) {
      setBody(editorRef.current.innerHTML);
    }
  };

  const handleEditorInput = () => {
    if (editorRef.current) {
      setBody(editorRef.current.innerHTML);
    }
  };

  const handleSubmit = async () => {
    setError("");
    if (emails.length === 0)
      return setError("Please add at least one recipient.");
    if (!scheduledAt) return setError("Please select a schedule time.");
    if (!body || body === "<br>")
      return setError("Please enter email body content.");

    setIsSubmitting(true);
    try {
      const res = await fetch("http://localhost:3001/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emails,
          subject,
          body, // Sending the formatted HTML body from the editor
          scheduledAt,
          senderId: userEmail,
          delaySec: delaySec || 2,
          hourlyLimit: hourlyLimit || 200,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to schedule");
      onSuccess(data.message);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickSchedule = (daysToAdd: number, hour?: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysToAdd);
    if (hour !== undefined) {
      d.setHours(hour, 0, 0, 0);
    }
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    setTempSchedule(d.toISOString().slice(0, 16));
  };

  return (
    // Fixed height wrapper prevents double scrollbars
    <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col h-screen overflow-hidden animate-fade-in font-sans">
      {/* Top Header Navbar */}
      <div className="flex-none flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-2 -ml-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </button>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">
            Compose New Campaign
          </h2>
        </div>

        <div className="flex items-center gap-4">
          {/* Schedule Popup */}
          <div className="relative">
            <button
              onClick={() => setIsScheduleOpen(!isScheduleOpen)}
              className={`p-2 rounded-full transition ${isScheduleOpen ? "bg-emerald-50 text-[#00A859]" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"}`}
              title="Schedule Time"
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

            {isScheduleOpen && (
              <div className="absolute right-0 top-12 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-5 z-50">
                <h3 className="text-sm font-bold text-slate-800 mb-4">
                  Schedule Campaign
                </h3>
                <div className="mb-4">
                  <input
                    type="datetime-local"
                    value={tempSchedule}
                    onChange={(e) => setTempSchedule(e.target.value)}
                    className="w-full text-sm text-slate-700 border border-slate-200 rounded-lg py-2.5 px-3 outline-none focus:border-[#00A859] focus:ring-1 focus:ring-[#00A859]"
                  />
                </div>
                <div className="space-y-1 mb-5">
                  <button
                    onClick={() => quickSchedule(1)}
                    className="block w-full text-left text-sm text-slate-600 hover:text-[#00A859] hover:bg-emerald-50 rounded-md px-3 py-2"
                  >
                    Tomorrow
                  </button>
                  <button
                    onClick={() => quickSchedule(1, 10)}
                    className="block w-full text-left text-sm text-slate-600 hover:text-[#00A859] hover:bg-emerald-50 rounded-md px-3 py-2"
                  >
                    Tomorrow, 10:00 AM
                  </button>
                  <button
                    onClick={() => quickSchedule(1, 15)}
                    className="block w-full text-left text-sm text-slate-600 hover:text-[#00A859] hover:bg-emerald-50 rounded-md px-3 py-2"
                  >
                    Tomorrow, 3:00 PM
                  </button>
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setIsScheduleOpen(false)}
                    className="text-sm font-semibold text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-md hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setScheduledAt(tempSchedule);
                      setIsScheduleOpen(false);
                    }}
                    className="text-sm font-semibold text-white bg-[#00A859] px-5 py-1.5 rounded-lg hover:bg-[#00924D] shadow-sm"
                  >
                    Set Time
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2 text-sm font-bold text-white bg-[#00A859] rounded-lg shadow-sm hover:bg-[#00924D] transition disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? "Scheduling..." : "Send Campaign"}
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
                d="M5 12h14M12 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Content Area - Inner Scroll Only */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
          {error && (
            <div className="m-6 mb-0 p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-sm font-semibold flex items-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {error}
            </div>
          )}

          <div className="divide-y divide-slate-100">
            {/* From Row */}
            <div className="flex flex-col sm:flex-row sm:items-center px-8 py-4 focus-within:bg-slate-50/50 transition">
              <span className="w-32 text-sm font-bold text-slate-500 mb-2 sm:mb-0">
                From
              </span>
              <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 cursor-not-allowed select-none w-fit">
                <span className="text-sm font-semibold text-slate-700">
                  {userEmail}
                </span>
                <svg
                  className="w-4 h-4 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>

            {/* To Row with Inline Upload Button */}
            <div className="flex flex-col sm:flex-row sm:items-start px-8 py-4 focus-within:bg-slate-50/50 transition relative">
              <span className="w-32 text-sm font-bold text-slate-500 pt-2 mb-2 sm:mb-0">
                To
              </span>

              <div className="flex-1 flex flex-wrap gap-2 items-center min-h-[36px] sm:pr-32">
                {emails.map((email) => (
                  <span
                    key={email}
                    className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-sm font-semibold px-3 py-1 rounded-md flex items-center gap-2 shadow-sm"
                  >
                    {email}
                    <button
                      onClick={() => removeEmail(email)}
                      className="text-emerald-400 hover:text-emerald-600 transition"
                    >
                      ✕
                    </button>
                  </span>
                ))}
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyDown={handleAddEmail}
                  placeholder={
                    emails.length === 0
                      ? "recipient@example.com (Press Enter)"
                      : ""
                  }
                  className="flex-1 min-w-[250px] outline-none text-sm text-slate-800 py-1.5 placeholder-slate-300 bg-transparent"
                />
              </div>

              {/* Upload List Button */}
              <div className="sm:absolute sm:right-8 sm:top-5 mt-3 sm:mt-0">
                <label className="cursor-pointer text-[#00A859] hover:text-[#00924D] text-sm font-bold flex items-center gap-1.5 transition select-none">
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
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                  Upload List
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Subject Row */}
            <div className="flex flex-col sm:flex-row sm:items-center px-8 py-4 focus-within:bg-slate-50/50 transition">
              <span className="w-32 text-sm font-bold text-slate-500 mb-2 sm:mb-0">
                Subject
              </span>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter campaign subject"
                className="flex-1 outline-none text-sm font-medium text-slate-800 placeholder-slate-300 bg-transparent"
              />
            </div>

            {/* Limits Row */}
            <div className="flex flex-col sm:flex-row sm:items-center px-8 py-4 focus-within:bg-slate-50/50 transition gap-8">
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold text-slate-500">
                  Delay between emails
                </span>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={delaySec === 0 ? "" : delaySec}
                    onChange={(e) => setDelaySec(Number(e.target.value))}
                    placeholder="2"
                    className="w-20 border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-center outline-none focus:border-[#00A859] focus:ring-1 focus:ring-[#00A859] bg-white"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-semibold text-slate-400">
                    sec
                  </span>
                </div>
              </div>

              <div className="hidden sm:block w-px h-8 bg-slate-200"></div>

              <div className="flex items-center gap-4">
                <span className="text-sm font-bold text-slate-500">
                  Hourly Limit
                </span>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={hourlyLimit === 0 ? "" : hourlyLimit}
                    onChange={(e) => setHourlyLimit(Number(e.target.value))}
                    placeholder="200"
                    className="w-24 border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold text-center outline-none focus:border-[#00A859] focus:ring-1 focus:ring-[#00A859] bg-white"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-semibold text-slate-400">
                    /hr
                  </span>
                </div>
              </div>
            </div>

            {/* Editor Area */}
            <div className="flex flex-col relative group">
              {/* Working Toolbar */}
              <div className="flex items-center gap-4 px-8 py-3 bg-slate-50 border-b border-slate-100 text-slate-500 select-none">
                <button
                  type="button"
                  onClick={() => executeCommand("undo")}
                  className="hover:text-slate-800 transition p-1"
                  title="Undo"
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
                      d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => executeCommand("redo")}
                  className="hover:text-slate-800 transition p-1"
                  title="Redo"
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
                      d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6"
                    />
                  </svg>
                </button>
                <span className="w-px h-5 bg-slate-300"></span>
                <button
                  type="button"
                  onClick={() => executeCommand("bold")}
                  className="hover:text-slate-800 transition font-black text-sm p-1 w-6"
                  title="Bold"
                >
                  B
                </button>
                <button
                  type="button"
                  onClick={() => executeCommand("italic")}
                  className="hover:text-slate-800 transition italic text-sm font-bold p-1 w-6"
                  title="Italic"
                >
                  I
                </button>
                <button
                  type="button"
                  onClick={() => executeCommand("underline")}
                  className="hover:text-slate-800 transition underline text-sm font-bold p-1 w-6"
                  title="Underline"
                >
                  U
                </button>
                <span className="w-px h-5 bg-slate-300"></span>
                <button
                  type="button"
                  onClick={() => executeCommand("insertUnorderedList")}
                  className="hover:text-slate-800 transition p-1"
                  title="Bullet List"
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
                      d="M4 6h16M4 12h16M4 18h7"
                    />
                  </svg>
                </button>
              </div>

              {/* Actual ContentEditable Rich Text Editor */}
              <div
                ref={editorRef}
                contentEditable
                onInput={handleEditorInput}
                className="w-full min-h-[300px] px-8 py-6 outline-none text-sm font-medium text-slate-800 bg-white leading-relaxed focus:bg-slate-50/30 transition custom-scrollbar empty:before:content-['Type_your_email_content_here...'] empty:before:text-slate-300"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
