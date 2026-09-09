import express from "express";
import cors from "cors";
import { Queue } from "bullmq";
import IORedis from "ioredis";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import path from "path";

// Bull-board imports for live queue monitoring
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";

// Elasticsearch / OpenSearch helpers
import {
  initElasticsearch,
  indexEmail,
  searchEmailsInES,
} from "./elasticsearch";

dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const app = express();
app.use(cors());
app.use(express.json());

const prisma = new PrismaClient();

const redisConnection = new IORedis(process.env.REDIS_URL as string, {
  maxRetriesPerRequest: null,
});

const emailQueue = new Queue("email-queue", { connection: redisConnection });

// ==========================================
// Live BullMQ Admin Dashboard Setup
// ==========================================
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");

createBullBoard({
  queues: [new BullMQAdapter(emailQueue)],
  serverAdapter: serverAdapter,
});

app.use("/admin/queues", serverAdapter.getRouter());

// ==========================================
// API: Save or Update Slack Webhook Setting
// ==========================================
app.post("/api/settings/slack", async (req, res) => {
  const { senderId, slackWebhook } = req.body;

  if (!senderId) {
    return res.status(400).json({ error: "Sender ID is required" });
  }

  try {
    const settings = await prisma.userSettings.upsert({
      where: { senderId },
      update: { slackWebhook },
      create: { senderId, slackWebhook },
    });

    res.json({
      success: true,
      message:
        "Slack workspace connected successfully! Rate limit alerts will now be sent to your Slack channel.",
      settings,
    });
  } catch (error) {
    console.error("Error saving Slack webhook:", error);
    res.status(500).json({ error: "Failed to save Slack settings" });
  }
});

// ==========================================
// API: Schedule New Emails
// ==========================================
app.post("/api/schedule", async (req, res) => {
  const {
    emails,
    subject,
    body,
    scheduledAt,
    senderId,
    delaySec,
    hourlyLimit,
  } = req.body;

  if (!emails || !Array.isArray(emails) || emails.length === 0) {
    return res.status(400).json({ error: "Valid emails array is required" });
  }

  try {
    const targetTime = new Date(scheduledAt).getTime();
    const delay = targetTime - Date.now();
    const finalDelay = delay > 0 ? delay : 0;

    const perEmailDelayMs = (Number(delaySec) || 1) * 1000;
    const effectiveLimit = Number(hourlyLimit) > 0 ? Number(hourlyLimit) : 500;

    let count = 0;
    for (let i = 0; i < emails.length; i++) {
      const email = emails[i];
      const individualDelay = finalDelay + i * perEmailDelayMs;
      const effectiveScheduledAt = new Date(Date.now() + individualDelay);

      // 1. Persist record in database
      const jobRecord = await prisma.emailJob.create({
        data: {
          recipient: email,
          subject,
          body,
          senderId: senderId || "unknown",
          status: "SCHEDULED",
          scheduledAt: effectiveScheduledAt,
        },
      });

      // 2. Index record in Elasticsearch / OpenSearch
      try {
        await indexEmail(jobRecord);
      } catch (e) {
        console.warn("ES indexing skipped:", e);
      }

      // 3. Queue task in BullMQ
      await emailQueue.add(
        "send-email",
        {
          jobId: jobRecord.id,
          recipient: email,
          subject,
          body,
          senderId: senderId || "unknown",
          hourlyLimit: effectiveLimit,
          delaySec: Number(delaySec) || 1,
        },
        { delay: individualDelay },
      );
      count++;
    }

    res.json({
      success: true,
      message: `Successfully scheduled ${count} email(s)!`,
      count,
    });
  } catch (error) {
    console.error("Schedule Error:", error);
    res.status(500).json({ error: "Failed to schedule emails" });
  }
});

// ==========================================
// API: Fetch Scheduled Jobs (Tenant-Isolated)
// ==========================================
app.get("/api/jobs/scheduled", async (req, res) => {
  const { senderId } = req.query;

  try {
    const jobs = await prisma.emailJob.findMany({
      where: {
        status: "SCHEDULED",
        ...(senderId ? { senderId: String(senderId) } : {}),
      },
      orderBy: { scheduledAt: "asc" },
    });
    res.json(jobs);
  } catch (error) {
    console.error("Error fetching scheduled jobs:", error);
    res.status(500).json({ error: "Failed to fetch scheduled jobs" });
  }
});

// ==========================================
// API: Fetch Sent Jobs (Tenant-Isolated)
// ==========================================
app.get("/api/jobs/sent", async (req, res) => {
  const { senderId } = req.query;

  try {
    const jobs = await prisma.emailJob.findMany({
      where: {
        status: { in: ["SENT", "FAILED"] },
        ...(senderId ? { senderId: String(senderId) } : {}),
      },
      orderBy: { scheduledAt: "desc" },
    });
    res.json(jobs);
  } catch (error) {
    console.error("Error fetching sent jobs:", error);
    res.status(500).json({ error: "Failed to fetch sent jobs" });
  }
});

// ==========================================
// API: Delete an Email Job
// ==========================================
app.delete("/api/jobs/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.emailJob.delete({
      where: { id: isNaN(Number(id)) ? id : (Number(id) as any) },
    });
    res.json({ success: true, message: "Email removed successfully" });
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ error: "Failed to delete email record" });
  }
});

// ==========================================
// API: Search Emails via Elasticsearch (With DB Fallback)
// ==========================================
app.get("/api/emails/search", async (req, res) => {
  const { q, senderId } = req.query;

  if (!q) return res.json([]);

  const esResults = await searchEmailsInES(
    String(q),
    senderId ? String(senderId) : undefined,
  );
  if (esResults) {
    return res.json(esResults);
  }

  try {
    const dbResults = await prisma.emailJob.findMany({
      where: {
        ...(senderId ? { senderId: String(senderId) } : {}),
        OR: [
          { recipient: { contains: String(q), mode: "insensitive" } },
          { subject: { contains: String(q), mode: "insensitive" } },
          { body: { contains: String(q), mode: "insensitive" } },
        ],
      },
      orderBy: { scheduledAt: "desc" },
    });
    return res.json(dbResults);
  } catch (error) {
    console.error("Search Fallback Error:", error);
    return res.status(500).json({ error: "Failed to search emails" });
  }
});

initElasticsearch();

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Backend API running on port ${PORT}`);
  console.log(`📊 BullMQ Dashboard: http://localhost:${PORT}/admin/queues`);
});
