"use client";
import React, { useState } from "react";
import { EmailJob } from "../types";

interface EmailTableProps {
  activeTab: "scheduled" | "sent";
  scheduledJobs: EmailJob[];
  sentJobs: EmailJob[];
  initialLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export default function EmailTable({
  activeTab,
  scheduledJobs,
  sentJobs,
  initialLoading,
  isRefreshing,
  onRefresh,
}: EmailTableProps) {
  // Modal & Delete States
  const [selectedEmail, setSelectedEmail] = useState<EmailJob | null>(null);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);
  const [deletedIds, setDeletedIds] = useState<(string | number)[]>([]);

  // Custom Delete Confirmation Modal State
  const [confirmDeleteId, setConfirmDeleteId] = useState<
    string | number | null
  >(null);

  // Filter out locally deleted items
  const baseJobs = activeTab === "scheduled" ? scheduledJobs : sentJobs;
  const jobs = (Array.isArray(baseJobs) ? baseJobs : []).filter(
    (job) => !deletedIds.includes(job.id),
  );

  // 1. Triggered when trash icon is clicked (opens custom modal instead of browser alert)
  const initiateDelete = (e: React.MouseEvent, id: string | number) => {
    e.stopPropagation();
    setConfirmDeleteId(id);
  };

  // 2. Triggered when "Yes, Delete" is clicked inside the custom modal
  const executeDelete = async () => {
    if (!confirmDeleteId) return;

    setDeletingId(confirmDeleteId);
    try {
      const res = await fetch(
        `http://localhost:3001/api/jobs/${confirmDeleteId}`,
        {
          method: "DELETE",
        },
      );
      if (!res.ok) throw new Error("Failed to delete email");

      setDeletedIds((prev) => [...prev, confirmDeleteId]);
      if (selectedEmail?.id === confirmDeleteId) setSelectedEmail(null);
      onRefresh();
    } catch (err) {
      alert("Error deleting email. Please check server.");
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null); // Close confirmation modal
    }
  };

  // Helper functions
  const formatTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
    } catch {
      return dateStr;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString([], {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  return (
    <section className="flex-1 p-8 bg-white min-h-[calc(100vh-73px)] relative">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6 pb-3 border-b border-slate-100">
        <h2 className="text-lg font-bold text-slate-800 capitalize">
          {activeTab === "scheduled" ? "Scheduled Emails" : "Sent Emails"}
        </h2>

        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="text-xs font-semibold text-[#00A859] hover:underline flex items-center gap-1.5 transition"
        >
          <svg
            className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span>{isRefreshing ? "Updating..." : "Refresh List"}</span>
        </button>
      </div>

      {/* Empty / Loading States */}
      {initialLoading && jobs.length === 0 ? (
        <div className="py-24 text-center text-slate-400 text-sm">
          Loading emails...
        </div>
      ) : jobs.length === 0 ? (
        <div className="py-28 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
              />
            </svg>
          </div>
          <p className="text-slate-500 font-medium text-sm">
            No {activeTab} emails found.
          </p>
          {activeTab === "scheduled" && (
            <p className="text-xs text-slate-400 mt-1">
              Click &quot;Compose&quot; to schedule campaigns.
            </p>
          )}
        </div>
      ) : (
        /* Job List Cards */
        <div className="space-y-2">
          {jobs.map((job) => (
            <div
              key={job.id}
              onClick={() => setSelectedEmail(job)}
              className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/60 transition group cursor-pointer"
            >
              <div className="flex items-center gap-5 flex-1 min-w-0">
                <span className="text-sm font-semibold text-slate-800 shrink-0">
                  To: {job.recipient}
                </span>

                {activeTab === "scheduled" ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#FFF3DC] text-[#B56700] border border-[#FFE0A3]">
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
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {new Date(job.scheduledAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                ) : (
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      job.status === "SENT"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {job.status}
                  </span>
                )}

                <div className="text-xs text-slate-500 truncate flex-1">
                  <span className="font-semibold text-slate-700">
                    {job.subject}
                  </span>
                  <span className="mx-1.5 text-slate-300">—</span>
                  <span>
                    {job.body.replace(/(<([^>]+)>)/gi, "").replace(/\n/g, " ")}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                {activeTab === "scheduled" && (
                  <button
                    onClick={(e) => initiateDelete(e, job.id)}
                    title="Delete Email"
                    className="text-slate-300 hover:text-rose-500 transition p-1"
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
                        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                      />
                    </svg>
                  </button>
                )}

                <button className="text-slate-300 hover:text-amber-400 transition pl-2">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================== */}
      {/* Full Email Preview Modal                   */}
      {/* ========================================== */}
      {selectedEmail && (
        <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scale-in">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                    selectedEmail.status === "SENT"
                      ? "bg-emerald-100 text-[#00A859]"
                      : selectedEmail.status === "FAILED"
                        ? "bg-rose-100 text-rose-600"
                        : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {selectedEmail.status}
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  Campaign Preview
                </span>
              </div>

              <div className="flex items-center gap-2">
                {activeTab === "scheduled" && (
                  <button
                    type="button"
                    onClick={(e) => initiateDelete(e, selectedEmail.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Delete Campaign"
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
                        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                      />
                    </svg>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedEmail(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition"
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="px-6 py-4 border-b border-slate-100 bg-white space-y-2">
              <h3 className="text-lg font-bold text-slate-900 leading-snug">
                {selectedEmail.subject || "(No Subject)"}
              </h3>
              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs font-semibold text-slate-500 pt-1">
                <div>
                  <span className="text-slate-400 font-normal">To: </span>
                  <span className="text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                    {selectedEmail.recipient}
                  </span>
                </div>
                {(selectedEmail as any).senderId && (
                  <div>
                    <span className="text-slate-400 font-normal">From: </span>
                    <span className="text-slate-700">
                      {(selectedEmail as any).senderId}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-slate-400 font-normal">
                    {selectedEmail.status === "SENT"
                      ? "Sent At: "
                      : "Scheduled For: "}
                  </span>
                  <span className="text-[#00A859] font-bold">
                    {formatDate(selectedEmail.scheduledAt)}{" "}
                    {formatTime(selectedEmail.scheduledAt)}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
              <div
                className="bg-white p-6 rounded-xl border border-slate-200 text-slate-800 text-sm leading-relaxed prose prose-sm max-w-none shadow-xs"
                dangerouslySetInnerHTML={{
                  __html:
                    selectedEmail.body ||
                    "<p class='text-slate-400 italic'>No content in body</p>",
                }}
              />
            </div>

            <div className="px-6 py-3.5 bg-white border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedEmail(null)}
                className="px-5 py-2 text-sm font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* Custom Pro Delete Confirmation Modal       */}
      {/* ========================================== */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-[360px] overflow-hidden p-6 animate-scale-in text-center">
            {/* Warning Icon */}
            <div className="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 mx-auto mb-4">
              <svg
                className="w-7 h-7"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-1.5">
              Cancel Campaign?
            </h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              Are you sure you want to remove this scheduled email? This action
              cannot be undone.
            </p>

            <div className="flex gap-3 w-full">
              <button
                onClick={() => setConfirmDeleteId(null)}
                disabled={deletingId !== null}
                className="flex-1 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              >
                Keep It
              </button>
              <button
                onClick={executeDelete}
                disabled={deletingId !== null}
                className="flex-1 py-2.5 text-sm font-bold text-white bg-rose-500 hover:bg-rose-600 rounded-lg transition flex items-center justify-center gap-2"
              >
                {deletingId !== null ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Deleting
                  </>
                ) : (
                  "Yes, Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
