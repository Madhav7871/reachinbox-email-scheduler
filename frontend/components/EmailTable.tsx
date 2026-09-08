"use client";
import React from "react";
import { EmailJob } from "../types";

interface EmailTableProps {
  activeTab: "scheduled" | "sent";
  scheduledJobs: EmailJob[];
  sentJobs: EmailJob[];
  fetchingData: boolean;
  onRefresh: () => void;
}

export default function EmailTable({
  activeTab,
  scheduledJobs,
  sentJobs,
  fetchingData,
  onRefresh,
}: EmailTableProps) {
  const jobs = activeTab === "scheduled" ? scheduledJobs : sentJobs;

  return (
    <section className="flex-1 p-8 bg-white min-h-[calc(100vh-73px)]">
      <div className="flex justify-between items-center mb-6 pb-3 border-b border-slate-100">
        <h2 className="text-lg font-bold text-slate-800 capitalize">
          {activeTab === "scheduled" ? "Scheduled Emails" : "Sent Emails"}
        </h2>
        <button
          onClick={onRefresh}
          className="text-xs font-semibold text-[#00A859] hover:underline flex items-center gap-1.5"
        >
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
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh List
        </button>
      </div>

      {fetchingData ? (
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
        <div className="space-y-2">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/60 transition group"
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
                  <span>{job.body.replace(/\n/g, " ")}</span>
                </div>
              </div>

              {/* Action Star */}
              <button className="text-slate-300 hover:text-amber-400 transition pl-4">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
