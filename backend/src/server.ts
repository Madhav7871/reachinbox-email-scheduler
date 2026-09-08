import express from "express";
import { PrismaClient } from "@prisma/client";
import { Queue } from "bullmq";
import IORedis from "ioredis";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors()); // Enables communication between frontend (3000) and backend (3001)

const prisma = new PrismaClient();

// Connect to Upstash Redis
const connection = new IORedis(process.env.REDIS_URL as string, {
  maxRetriesPerRequest: null,
});

// Setup BullMQ Queue
const emailQueue = new Queue("email-queue", { connection });

app.post("/api/schedule", async (req, res) => {
  const { emails, subject, body, scheduledAt, senderId, slackToken } = req.body;

  try {
    const scheduledDate = new Date(scheduledAt);
    const delayMs = Math.max(scheduledDate.getTime() - Date.now(), 0); // Calculate delay exactly (No Cron)

    // 1. Save all jobs to PostgreSQL (Supabase)
    const jobs = await Promise.all(
      emails.map((recipient: string) =>
        prisma.emailJob.create({
          data: {
            recipient,
            subject,
            body,
            scheduledAt: scheduledDate,
            senderId,
            slackToken,
          },
        }),
      ),
    );

    // 2. Add to BullMQ with calculated delay
    const bullJobs = jobs.map((job) => ({
      name: "send-email",
      data: {
        jobId: job.id,
        recipient: job.recipient,
        subject: job.subject,
        body: job.body,
        senderId: job.senderId,
        slackToken: job.slackToken,
      },
      opts: { delay: delayMs, jobId: job.id }, // jobId pass karna zaroori hai (Idempotency ke liye)
    }));

    await emailQueue.addBulk(bullJobs);

    res.status(200).json({
      success: true,
      message: "Emails scheduled successfully",
      count: jobs.length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to schedule jobs" });
  }
});

// Get all Scheduled Emails for Dashboard
app.get("/api/jobs/scheduled", async (req, res) => {
  try {
    const jobs = await prisma.emailJob.findMany({
      where: { status: "SCHEDULED" },
      orderBy: { scheduledAt: "asc" },
    });
    res.json(jobs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch scheduled jobs" });
  }
});

// Get all Sent/Failed Emails for Dashboard
app.get("/api/jobs/sent", async (req, res) => {
  try {
    const jobs = await prisma.emailJob.findMany({
      where: { status: { in: ["SENT", "FAILED"] } },
      orderBy: { createdAt: "desc" },
    });
    res.json(jobs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch sent jobs" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`API running on port ${PORT}`));
