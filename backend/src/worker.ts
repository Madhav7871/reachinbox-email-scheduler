import { Worker, Queue } from "bullmq";
import IORedis from "ioredis";
import { PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();
const connection = new IORedis(process.env.REDIS_URL as string, {
  maxRetriesPerRequest: null,
});
const emailQueue = new Queue("email-queue", { connection });

// Nodemailer with Ethereal SMTP
const transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  auth: {
    user: process.env.ETHEREAL_USER,
    pass: process.env.ETHEREAL_PASS,
  },
});

const MAX_EMAILS_PER_HOUR = parseInt(
  process.env.MAX_EMAILS_PER_HOUR || "200",
  10,
);

const worker = new Worker(
  "email-queue",
  async (job) => {
    const { jobId, recipient, subject, body, senderId } = job.data;

    // 1. Rate Limiting via Redis (Per Sender per Hour)
    const currentHour = new Date().toISOString().slice(0, 13);
    const redisKey = `rate_limit:${senderId}:${currentHour}`;
    const currentCount = await connection.incr(redisKey);

    if (currentCount === 1) {
      await connection.expire(redisKey, 3600);
    }

    // 2. If Hourly Limit Exceeded -> Reschedule to Next Hour
    if (currentCount > MAX_EMAILS_PER_HOUR) {
      console.log(
        `Rate limit reached for sender ${senderId}. Rescheduling job ${jobId}.`,
      );
      const now = new Date();
      const nextHour = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        now.getHours() + 1,
        0,
        0,
        0,
      );
      const delayMs = nextHour.getTime() - now.getTime();

      await emailQueue.add("send-email", job.data, {
        delay: delayMs,
        jobId: `rescheduled_${jobId}`,
      });
      return;
    }

    // 3. Send Email via Ethereal & Update DB
    try {
      const info = await transporter.sendMail({
        from: `"ReachInbox Sender" <sender@reachinbox.ai>`,
        to: recipient,
        subject: subject,
        text: body,
      });
      console.log(
        `Email sent to ${recipient}. Preview URL: ${nodemailer.getTestMessageUrl(info)}`,
      );

      await prisma.emailJob.update({
        where: { id: jobId },
        data: { status: "SENT" },
      });
    } catch (error) {
      await prisma.emailJob.update({
        where: { id: jobId },
        data: { status: "FAILED" },
      });
      throw error;
    }
  },
  {
    connection,
    concurrency: 5, // Worker Concurrency
    limiter: {
      max: 1,
      duration: 2000, // Mandatory 2-second delay between emails
    },
  },
);

worker.on("completed", (job) =>
  console.log(`Job ${job.id} completed successfully.`),
);
worker.on("failed", (job, err) =>
  console.log(`Job ${job?.id} failed: ${err.message}`),
);

console.log("Email Worker is running and listening for jobs...");
