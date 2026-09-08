"use client";
import React, { useState, useEffect, useMemo } from "react";
import { User, EmailJob } from "../types";
import Header from "./Header";
import Sidebar from "./Sidebar";
import EmailTable from "./EmailTable";
import ComposeModal from "./ComposeModal";
import Toast from "./Toast";

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<"scheduled" | "sent">("scheduled");
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [scheduledJobs, setScheduledJobs] = useState<EmailJob[]>([]);
  const [sentJobs, setSentJobs] = useState<EmailJob[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Global Toast State
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "warning";
  } | null>(null);

  const fetchJobs = async (isSilent = false) => {
    if (!isSilent) setIsRefreshing(true);

    try {
      const encodedEmail = encodeURIComponent(user.email);
      const [resSched, resSent] = await Promise.all([
        fetch(
          `http://localhost:3001/api/jobs/scheduled?senderId=${encodedEmail}`,
        ),
        fetch(`http://localhost:3001/api/jobs/sent?senderId=${encodedEmail}`),
      ]);

      const dataSched = await resSched.json();
      const dataSent = await resSent.json();

      if (Array.isArray(dataSched)) {
        setScheduledJobs(dataSched);
      }
      if (Array.isArray(dataSent)) {
        // Trigger success toast if background worker successfully processed and moved emails to sent
        if (dataSent.length > sentJobs.length && sentJobs.length > 0) {
          setToast({
            message: `Successfully processed and delivered ${dataSent.length - sentJobs.length} email(s) from queue!`,
            type: "success",
          });
        }
        setSentJobs(dataSent);
      }
    } catch (err) {
      console.error("Failed to fetch jobs", err);
    } finally {
      setIsInitialLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchJobs(false);
    const interval = setInterval(() => {
      fetchJobs(true);
    }, 5000);

    return () => clearInterval(interval);
  }, [user.email]);

  const filterList = (list: EmailJob[]) => {
    if (!searchQuery.trim()) return list;
    const query = searchQuery.toLowerCase();
    return list.filter(
      (job) =>
        job.recipient?.toLowerCase().includes(query) ||
        job.subject?.toLowerCase().includes(query) ||
        job.body?.toLowerCase().includes(query),
    );
  };

  const filteredScheduledJobs = useMemo(
    () => filterList(scheduledJobs),
    [scheduledJobs, searchQuery],
  );
  const filteredSentJobs = useMemo(
    () => filterList(sentJobs),
    [sentJobs, searchQuery],
  );

  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col font-sans relative">
      <Header
        user={user}
        onLogout={onLogout}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <div className="flex flex-1">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          scheduledCount={filteredScheduledJobs.length}
          sentCount={filteredSentJobs.length}
          onOpenCompose={() => setIsComposeOpen(true)}
        />

        <EmailTable
          activeTab={activeTab}
          scheduledJobs={filteredScheduledJobs}
          sentJobs={filteredSentJobs}
          initialLoading={isInitialLoading}
          isRefreshing={isRefreshing}
          onRefresh={() => {
            fetchJobs(false);
            setToast({
              message: "Dashboard job lists refreshed successfully.",
              type: "success",
            });
          }}
        />
      </div>

      {isComposeOpen && (
        <ComposeModal
          userEmail={user.email}
          onClose={() => setIsComposeOpen(false)}
          onSuccess={(msg) => {
            setIsComposeOpen(false);
            fetchJobs(false);
            setToast({
              message: msg || "Campaign successfully queued and scheduled!",
              type: "success",
            });
          }}
        />
      )}

      {/* Global Bottom-Right Clean Light Theme Toast Popup */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
