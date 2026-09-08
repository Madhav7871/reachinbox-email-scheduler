"use client";
import React, { useState, useEffect } from "react";
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
  const [fetchingData, setFetchingData] = useState(false);

  const fetchJobs = async () => {
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
    fetchJobs();
    const interval = setInterval(fetchJobs, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col font-sans">
      <Header user={user} onLogout={onLogout} />

      <div className="flex flex-1">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          scheduledCount={scheduledJobs.length}
          sentCount={sentJobs.length}
          onOpenCompose={() => setIsComposeOpen(true)}
        />

        <EmailTable
          activeTab={activeTab}
          scheduledJobs={scheduledJobs}
          sentJobs={sentJobs}
          fetchingData={fetchingData}
          onRefresh={fetchJobs}
        />
      </div>

      {isComposeOpen && (
        <ComposeModal
          userEmail={user.email}
          onClose={() => setIsComposeOpen(false)}
          onSuccess={() => {
            setIsComposeOpen(false);
            fetchJobs();
          }}
        />
      )}
    </div>
  );
}
