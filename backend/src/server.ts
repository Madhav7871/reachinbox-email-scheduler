import express from "express";
import cors from "cors";
import { Queue } from "bullmq";
import IORedis from "ioredis";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import path from "path";

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
// API: Schedule New Email
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
      // Create DB record and attach senderId
      const jobRecord = await prisma.emailJob.create({
        data: {
          recipient: email,
          subject,
          body,
          senderId: senderId || "unknown", // Saving the tenant's identity
          status: "SCHEDULED",
          scheduledAt: new Date(scheduledAt),
        },
      });

      // Push to BullMQ
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

    res.json({ message: "Scheduled successfully", count });
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
        // 🔴 IMPORTANT: Filter only records belonging to this senderId
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
        // 🔴 IMPORTANT: Filter only records belonging to this senderId
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
  console.log(`Backend API running securely on port ${PORT}`);
});
