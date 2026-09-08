import express from "express";
import cors from "cors";
import { Queue } from "bullmq";
import IORedis from "ioredis";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import path from "path";

// Bull-board imports for Live Queue Visibility
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";

// Load environment variables
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
// API: Schedule New Email (With Detailed Response)
// ==========================================
app.post("/api/schedule", async (req, res) => {
  const { emails, subject, body, scheduledAt, senderId } = req.body;

  if (!emails || !Array.isArray(emails) || emails.length === 0) {
    return res.status(400).json({ error: "Valid emails array is required" });
  }

  try {
    const delay = new Date(scheduledAt).getTime() - Date.now();
    const finalDelay = delay > 0 ? delay : 0;

    let count = 0;
    for (const email of emails) {
      const jobRecord = await prisma.emailJob.create({
        data: {
          recipient: email,
          subject,
          body,
          senderId: senderId || "unknown",
          status: "SCHEDULED",
          scheduledAt: new Date(scheduledAt),
        },
      });

      await emailQueue.add(
        "send-email",
        {
          jobId: jobRecord.id,
          recipient: email,
          subject,
          body,
          senderId: senderId || "unknown",
        },
        { delay: finalDelay },
      );
      count++;
    }

    const maxLimit = parseInt(process.env.MAX_EMAILS_PER_HOUR || "200", 10);

    res.json({
      success: true,
      message: `Successfully scheduled ${count} email(s)! If hourly limit (${maxLimit}/hr) is reached, excess emails will automatically be rescheduled to the next hour window.`,
      count,
    });
  } catch (error) {
    console.error("Schedule Error:", error);
    res.status(500).json({ error: "Failed to schedule emails" });
  }
});

// ==========================================
// API: Fetch Scheduled Jobs (Tenant Isolated)
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
// API: Fetch Sent Jobs (Tenant Isolated)
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
// Initialize Server
// ==========================================
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Backend API running securely on port ${PORT}`);
  console.log(
    `📊 BullMQ Live Dashboard: http://localhost:${PORT}/admin/queues`,
  );
});
