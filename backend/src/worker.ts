import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { Worker, Job, Queue } from "bullmq";
import IORedis from "ioredis";
import nodemailer from "nodemailer";
import { PrismaClient } from "@prisma/client";
import axios from "axios";
import { updateEmailStatusInES } from "./elasticsearch";

const prisma = new PrismaClient();

const connection = new IORedis(process.env.REDIS_URL as string, {
  maxRetriesPerRequest: null,
});

const emailQueue = new Queue("email-queue", { connection });

const DEFAULT_MAX_LIMIT = parseInt(
  process.env.MAX_EMAILS_PER_HOUR || "500",
  10,
);
const DEFAULT_MIN_DELAY_MS = parseInt(
  process.env.MIN_DELAY_BETWEEN_EMAILS_MS || "500",
  10,
);

// Global cached transporter to prevent repeated auth handshakes
let cachedTransporter: any = null;

const getTransporter = async () => {
  if (cachedTransporter) return cachedTransporter;

  const etherealUser = process.env.ETHEREAL_USER?.replace(/["']/g, "").trim();
  const etherealPass = process.env.ETHEREAL_PASS?.replace(/["'\s]/g, "").trim();

  // 1. Try env credentials if provided
  if (etherealUser && etherealPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: { user: etherealUser, pass: etherealPass },
      });
      await transporter.verify();
      console.log(
        `✅ [SMTP Connected] Using Ethereal account: ${etherealUser}`,
      );
      cachedTransporter = transporter;
      return transporter;
    } catch (authError) {
      console.warn(
        "⚠️ .env Ethereal credentials failed (535 Auth). Auto-generating fresh test account...",
      );
    }
  }

  // 2. Guaranteed fallback: Generate a valid fresh test account on the fly
  const testAccount = await nodemailer.createTestAccount();
  console.log(`✨ [Ethereal Account Auto-Created] User: ${testAccount.user}`);
  cachedTransporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
  return cachedTransporter;
};

const notifySlack = async (senderId: string, limit: number) => {
  try {
    const userSettings = await prisma.userSettings.findUnique({
      where: { senderId },
    });
    if (!userSettings?.slackWebhook) return;

    await axios.post(userSettings.slackWebhook, {
      text: `🚨 *Rate Limit Alert* \nSender \`${senderId}\` hit their personal hourly limit of *${limit} emails/hr*. \nTheir remaining emails are safely rescheduled to the next hour.`,
    });
    console.log(`📢 [Slack Alert] Dispatched alert for sender: ${senderId}`);
  } catch (error) {
    console.error("Failed to send Slack alert:", error);
  }
};

const emailWorker = new Worker(
  "email-queue",
  async (job: Job) => {
    const { jobId, recipient, subject, body, senderId, hourlyLimit, delaySec } =
      job.data;

    const cleanSenderId = (senderId || "mailer@reachinbox.ai")
      .trim()
      .toLowerCase();
    const effectiveLimit =
      Number(hourlyLimit) > 0 ? Number(hourlyLimit) : DEFAULT_MAX_LIMIT;
    const individualDelay =
      Number(delaySec) > 0 ? Number(delaySec) * 1000 : DEFAULT_MIN_DELAY_MS;

    // Wait spacing between emails
    await new Promise((resolve) => setTimeout(resolve, individualDelay));

    // Per-Sender Hourly Isolation
    const currentHour = new Date().setMinutes(0, 0, 0);
    const rateLimitKey = `rate_limit:${cleanSenderId}:${currentHour}`;
    const notifiedKey = `slack_notified:${cleanSenderId}:${currentHour}`;

    const currentSentCount = parseInt(
      (await connection.get(rateLimitKey)) || "0",
      10,
    );

    // Rate Limit Check
    if (currentSentCount >= effectiveLimit) {
      console.log(
        `⚠️ [Rate Limit] Sender "${cleanSenderId}" hit limit (${effectiveLimit}/hr). Rescheduling job...`,
      );

      const nextHourTimestamp = Date.now() + 60 * 60 * 1000;
      const delayMs = nextHourTimestamp - Date.now();

      try {
        await prisma.emailJob.update({
          where: { id: jobId },
          data: { scheduledAt: new Date(nextHourTimestamp) },
        });
      } catch (dbErr) {
        console.warn(`⚠️ Skipped DB timestamp update for jobId: ${jobId}`);
      }

      const alreadyNotified = await connection.setnx(notifiedKey, "1");
      if (alreadyNotified === 1) {
        await connection.expire(notifiedKey, 3600 * 2);
        await notifySlack(cleanSenderId, effectiveLimit);
      }

      await emailQueue.add("send-email", job.data, {
        delay: delayMs > 0 ? delayMs : 3600000,
      });

      console.log(
        `⏳ Rescheduled ${recipient} to ${new Date(nextHourTimestamp).toLocaleTimeString()}`,
      );
      return;
    }

    // Increment count only when processing actual send
    await connection.incr(rateLimitKey);
    await connection.expire(rateLimitKey, 3600 * 2);

    // Dispatch Email via Verified Transporter
    const transporter = await getTransporter();
    const mailOptions = {
      from: `"ReachInbox Engine" <${cleanSenderId}>`,
      to: recipient,
      subject: subject || "Notification",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 24px; color: #1e293b;">
          <h2 style="color: #00A859; margin-bottom: 16px;">${subject}</h2>
          <div style="font-size: 14px; line-height: 1.6;">${(body || "").replace(/\n/g, "<br/>")}</div>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <small style="color: #94a3b8;">Delivered via ReachInbox Multi-Tenant Queue Engine</small>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl(info);

    console.log(
      `✅ [Delivered] [Sender: ${cleanSenderId}] -> To: ${recipient}`,
    );
    if (previewUrl) {
      console.log(`🔗 [VIEW EMAIL LINK]: ${previewUrl}`);
    }

    // Update Database Status to SENT
    try {
      await prisma.emailJob.update({
        where: { id: jobId },
        data: { status: "SENT" },
      });
    } catch (dbErr) {
      console.warn(`⚠️ Could not update SENT status in DB for jobId: ${jobId}`);
    }

    // Sync status in Elasticsearch / OpenSearch
    try {
      await updateEmailStatusInES(jobId, "SENT");
    } catch (esErr) {
      console.warn(
        `⚠️ Elasticsearch status update skipped for jobId: ${jobId}`,
      );
    }
  },
  {
    connection,
    concurrency: 5,
  },
);

emailWorker.on("failed", (job, err) => {
  console.error(`❌ [Job Failed] ID: ${job?.id}, Reason: ${err.message}`);
});

console.log("🚀 Multi-Tenant Email Worker active and ready!");
