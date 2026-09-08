"use client";
import React, { useState, useEffect, useMemo } from "react";
import { User, EmailJob } from "../types";
import Header from "./Header";
import Sidebar from "./Sidebar";
import EmailTable from "./EmailTable";
import ComposeModal from "./ComposeModal";

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

  const fetchJobs = async (isSilent = false) => {
    if (!isSilent) setIsRefreshing(true);

    try {
      const [resSched, resSent] = await Promise.all([
        fetch("http://localhost:3001/api/jobs/scheduled"),
        fetch("http://localhost:3001/api/jobs/sent"),
      ]);

      const dataSched = await resSched.json();
      const dataSent = await resSent.json();

      if (Array.isArray(dataSched)) setScheduledJobs(dataSched);
      if (Array.isArray(dataSent)) setSentJobs(dataSent);
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
  }, []);

  // Filter jobs dynamically across recipient, subject, and body
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
    <div className="min-h-screen bg-white text-slate-800 flex flex-col font-sans">
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
          onRefresh={() => fetchJobs(false)}
        />
      </div>

      {isComposeOpen && (
        <ComposeModal
          userEmail={user.email}
          onClose={() => setIsComposeOpen(false)}
          onSuccess={() => {
            setIsComposeOpen(false);
            fetchJobs(false);
          }}
        />
      )}
    </div>
  );
}
