"use client";
import { useState, useEffect } from "react";

interface User {
  name: string;
  email: string;
  avatar: string;
}

interface EmailJob {
  id: string;
  recipient: string;
  subject: string;
  body: string;
  status: string;
  scheduledAt: string;
  createdAt: string;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<"scheduled" | "sent">("scheduled");
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  // Form States
  const [recipients, setRecipients] = useState<string[]>([]);
  const [recipientInput, setRecipientInput] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [delay, setDelay] = useState("2");
  const [hourlyLimit, setHourlyLimit] = useState("200");
  const [scheduledAt, setScheduledAt] = useState("");
  const [showSendLater, setShowSendLater] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Data Lists
  const [scheduledJobs, setScheduledJobs] = useState<EmailJob[]>([]);
  const [sentJobs, setSentJobs] = useState<EmailJob[]>([]);
  const [fetchingData, setFetchingData] = useState(false);

  // Google Login Handler (OAuth simulation / popup flow)
  const handleGoogleLogin = () => {
    // In production, integrate Supabase/Firebase Google Auth or direct OAuth redirect
    setUser({
      name: "Oliver Brown",
      email: "oliver.brown@domain.io",
      avatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces",
    });
  };

  const handleLogout = () => setUser(null);

  // Fetch Jobs from Backend
  const fetchJobs = async () => {
    if (!user) return;
    setFetchingData(true);
    try {
      const resSched = await fetch("http://localhost:3001/api/jobs/scheduled");
      const dataSched = await resSched.json();
      if (Array.isArray(dataSched)) setScheduledJobs(dataSched);

      const resSent = await fetch("http://localhost:3001/api/jobs/sent");
      const dataSent = await resSent.json();
      if (Array.isArray(dataSent)) setSentJobs(dataSent);
    } catch (err) {
      console.error("Failed to fetch jobs", err);
    } finally {
      setFetchingData(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchJobs();
      const interval = setInterval(fetchJobs, 5000); // Auto-refresh
      return () => clearInterval(interval);
    }
  }, [user]);

  // CSV / Text File Parser
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

  // Submit Schedule Form
  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (recipients.length === 0) {
      alert("Please add at least one recipient or upload a CSV list.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("http://localhost:3001/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emails: recipients,
          subject,
          body,
          scheduledAt: scheduledAt
            ? new Date(scheduledAt).toISOString()
            : new Date().toISOString(),
          senderId: user?.email || "user_123",
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(`Success! ${data.count} emails scheduled.`);
        setIsComposeOpen(false);
        setRecipients([]);
        setSubject("");
        setBody("");
        fetchJobs();
      } else {
        setMessage(`Error: ${data.error || "Failed to schedule"}`);
      }
    } catch (err) {
      console.error(err);
      setMessage("Network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // 1️⃣ LOGIN SCREEN (Matching Figma)
  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 border border-neutral-200">
          <h2 className="text-3xl font-bold text-center text-neutral-900 mb-8">
            Login
          </h2>

          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-neutral-50 border border-neutral-300 text-neutral-700 font-medium py-3 px-4 rounded-lg transition duration-200 shadow-sm mb-6"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Login with Google
          </button>

          <div className="relative flex py-2 items-center mb-6">
            <div className="flex-grow border-t border-neutral-200"></div>
            <span className="flex-shrink mx-4 text-neutral-400 text-xs uppercase tracking-wider">
              or sign up through email
            </span>
            <div className="flex-grow border-t border-neutral-200"></div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleGoogleLogin();
            }}
            className="space-y-4"
          >
            <input
              type="email"
              placeholder="Email ID"
              className="w-full p-3 rounded-lg bg-neutral-50 border border-neutral-200 text-neutral-800 text-sm focus:outline-none focus:border-emerald-500"
              required
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full p-3 rounded-lg bg-neutral-50 border border-neutral-200 text-neutral-800 text-sm focus:outline-none focus:border-emerald-500"
              required
            />
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-lg transition duration-200 shadow-md"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2️⃣ MAIN DASHBOARD (Matching Figma Layout)
  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-800 flex flex-col">
      {/* Top Header Bar */}
      <header className="bg-white border-b border-neutral-200 px-6 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-black tracking-wider text-neutral-900">
            ONG
          </h1>
          {/* User Profile Card */}
          <div className="flex items-center gap-3 bg-neutral-50 border border-neutral-200 px-3 py-1.5 rounded-lg">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover"
            />
            <div>
              <p className="text-xs font-bold text-neutral-900">{user.name}</p>
              <p className="text-[10px] text-neutral-500">{user.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="ml-2 text-xs text-red-600 hover:underline font-semibold"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center gap-4 flex-1 max-w-md mx-8">
          <input
            type="text"
            placeholder="Search"
            className="w-full bg-neutral-100 border border-neutral-200 rounded-full px-4 py-1.5 text-sm focus:outline-none focus:bg-white"
          />
        </div>
      </header>

      {/* Main App Layout */}
      <div className="flex flex-1 bg-white m-4 rounded-xl shadow-lg overflow-hidden border border-neutral-200">
        {/* Sidebar */}
        <aside className="w-64 border-r border-neutral-200 p-4 flex flex-col gap-4 bg-white">
          <button
            onClick={() => setIsComposeOpen(true)}
            className="w-full bg-white border border-emerald-600 text-emerald-600 hover:bg-emerald-50 font-semibold py-2.5 px-4 rounded-full transition duration-200 shadow-xs text-center"
          >
            Compose
          </button>

          <div className="mt-2 space-y-1">
            <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider px-3 mb-2">
              Core
            </p>
            <button
              onClick={() => setActiveTab("scheduled")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === "scheduled"
                  ? "bg-emerald-100 text-emerald-800"
                  : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              <span>Scheduled</span>
              <span className="text-xs bg-white px-2 py-0.5 rounded-full border border-neutral-200">
                {scheduledJobs.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("sent")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === "sent"
                  ? "bg-emerald-100 text-emerald-800"
                  : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              <span>Sent</span>
              <span className="text-xs bg-white px-2 py-0.5 rounded-full border border-neutral-200">
                {sentJobs.length}
              </span>
            </button>
          </div>
        </aside>

        {/* Content Area / Tables */}
        <main className="flex-1 p-6 overflow-y-auto bg-white">
          <div className="flex justify-between items-center mb-6 border-b border-neutral-200 pb-4">
            <h2 className="text-lg font-bold text-neutral-800 capitalize">
              {activeTab} Emails
            </h2>
            <button
              onClick={fetchJobs}
              className="text-xs text-emerald-600 hover:underline font-medium"
            >
              Refresh List
            </button>
          </div>

          {fetchingData ? (
            <p className="text-sm text-neutral-400 text-center py-10">
              Loading emails...
            </p>
          ) : activeTab === "scheduled" ? (
            scheduledJobs.length === 0 ? (
              <div className="text-center py-16 text-neutral-400">
                <p>No scheduled emails found.</p>
                <p className="text-xs mt-1">
                  Click Compose to schedule new campaigns.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {scheduledJobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-semibold bg-amber-100 text-amber-800 px-2 py-1 rounded">
                        {new Date(job.scheduledAt).toLocaleString()}
                      </span>
                      <div>
                        <p className="text-sm font-bold text-neutral-800">
                          To: {job.recipient}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {job.subject} - {job.body.slice(0, 40)}...
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full">
                      {job.status}
                    </span>
                  </div>
                ))}
              </div>
            )
          ) : sentJobs.length === 0 ? (
            <div className="text-center py-16 text-neutral-400">
              <p>No sent emails found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sentJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition"
                >
                  <div className="flex items-center gap-4">
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded ${job.status === "SENT" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}
                    >
                      {job.status}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-neutral-800">
                        To: {job.recipient}
                      </p>
                      <p className="text-xs text-neutral-500">{job.subject}</p>
                    </div>
                  </div>
                  <span className="text-xs text-neutral-400">
                    {new Date(job.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* 3️⃣ COMPOSE MODAL (Matching Figma Compose & Send Later Popups) */}
      {isComposeOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden border border-neutral-200 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
              <h3 className="text-base font-bold text-neutral-900">
                Compose New Email
              </h3>
              <div className="flex items-center gap-3">
                {/* Upload List Button */}
                <label className="cursor-pointer text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-3 py-1.5 rounded-md border border-neutral-300 transition">
                  Upload CSV List
                  <input
                    type="file"
                    accept=".csv, .txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                {/* Send Later Toggle */}
                <button
                  type="button"
                  onClick={() => setShowSendLater(!showSendLater)}
                  className="text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-3 py-1.5 rounded-md border border-neutral-300 transition"
                >
                  Send Later
                </button>
                <button
                  onClick={() => setIsComposeOpen(false)}
                  className="text-neutral-400 hover:text-neutral-600 font-bold text-lg"
                >
                  &times;
                </button>
              </div>
            </div>

            {/* Modal Body / Form */}
            <form
              onSubmit={handleScheduleSubmit}
              className="p-6 space-y-4 overflow-y-auto flex-1"
            >
              {/* From & To */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 mb-1">
                    From
                  </label>
                  <input
                    type="text"
                    disabled
                    value={user.email}
                    className="w-full p-2 text-xs bg-neutral-100 rounded border border-neutral-200 text-neutral-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 mb-1">
                    Recipients ({recipients.length} added)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      placeholder="Add email & press add"
                      value={recipientInput}
                      onChange={(e) => setRecipientInput(e.target.value)}
                      className="flex-1 p-2 text-xs bg-white rounded border border-neutral-300 focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={addManualRecipient}
                      className="bg-neutral-800 text-white text-xs px-3 py-1 rounded"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Recipient Chips preview */}
              {recipients.length > 0 && (
                <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto p-2 bg-neutral-50 rounded border border-neutral-200">
                  {recipients.map((email, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-medium"
                    >
                      {email}
                    </span>
                  ))}
                </div>
              )}

              {/* Subject */}
              <div>
                <label className="block text-xs font-semibold text-neutral-500 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  placeholder="Subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full p-2 text-sm bg-white rounded border border-neutral-300 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              {/* Rate Limit controls */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 mb-1">
                    Delay Between Emails (seconds)
                  </label>
                  <input
                    type="number"
                    value={delay}
                    onChange={(e) => setDelay(e.target.value)}
                    className="w-full p-2 text-xs bg-white rounded border border-neutral-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-500 mb-1">
                    Hourly Limit
                  </label>
                  <input
                    type="number"
                    value={hourlyLimit}
                    onChange={(e) => setHourlyLimit(e.target.value)}
                    className="w-full p-2 text-xs bg-white rounded border border-neutral-300"
                  />
                </div>
              </div>

              {/* Send Later Picker Popup */}
              {showSendLater && (
                <div className="bg-neutral-50 border border-neutral-200 p-4 rounded-lg space-y-3">
                  <p className="text-xs font-bold text-neutral-800">
                    Pick Schedule Date & Time
                  </p>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full p-2 text-xs bg-white rounded border border-neutral-300"
                  />
                </div>
              )}

              {/* Body */}
              <div>
                <label className="block text-xs font-semibold text-neutral-500 mb-1">
                  Email Body
                </label>
                <textarea
                  rows={5}
                  placeholder="Type your message..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full p-2 text-sm bg-white rounded border border-neutral-300 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              {/* Submit button */}
              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setIsComposeOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md shadow-sm transition"
                >
                  {loading ? "Scheduling..." : "Schedule & Send"}
                </button>
              </div>

              {message && (
                <p className="text-center text-xs font-medium text-emerald-600">
                  {message}
                </p>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
