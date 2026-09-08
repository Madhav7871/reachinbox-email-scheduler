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

// Queue instance for safe job rescheduling without crashes
const emailQueue = new Queue("email-queue", { connection });

const MAX_EMAILS_PER_HOUR = parseInt(
  process.env.MAX_EMAILS_PER_HOUR || "200",
  10,
);
const MIN_DELAY_MS = parseInt(
  process.env.MIN_DELAY_BETWEEN_EMAILS_MS || "2000",
  10,
);

const getTransporter = async () => {
  const etherealUser = process.env.ETHEREAL_USER?.replace(/["']/g, "").trim();
  const etherealPass = process.env.ETHEREAL_PASS?.replace(/["'\s]/g, "").trim();

  if (etherealUser && etherealPass) {
    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: { user: etherealUser, pass: etherealPass },
    });
  }

  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
};

const notifySlack = async (senderId: string, limit: number) => {
  try {
    const userSettings = await prisma.userSettings.findUnique({
      where: { senderId },
    });
    if (!userSettings?.slackWebhook) return;

    await axios.post(userSettings.slackWebhook, {
      text: `🚨 *Rate Limit Alert* \nSender \`${senderId}\` hit the max limit of *${limit} emails/hour*. \nRemaining jobs are rescheduled to the next hour.`,
    });
    console.log(`📢 [Slack Alert Sent] Dispatched to webhook for ${senderId}`);
  } catch (error) {
    console.error("Failed to send Slack alert:", error);
  }
};

const emailWorker = new Worker(
  "email-queue",
  async (job: Job) => {
    const { jobId, recipient, subject, body, senderId } = job.data;

    // Minimum delay between individual sends (provider throttling)
    await new Promise((resolve) => setTimeout(resolve, MIN_DELAY_MS));

    const currentHour = new Date().setMinutes(0, 0, 0);
    const rateLimitKey = `rate_limit:${senderId}:${currentHour}`;
    const notifiedKey = `slack_notified:${senderId}:${currentHour}`;

    const sentCountThisHour = await connection.incr(rateLimitKey);
    if (sentCountThisHour === 1) {
      await connection.expire(rateLimitKey, 3600 * 2);
    }

    // 🔴 ACCURATE RATE LIMIT RESCHEDULING (Zero-crash safe re-queue)
    if (sentCountThisHour > MAX_EMAILS_PER_HOUR) {
      console.log(
        `⚠️ [Rate Limit] Sender ${senderId} exceeded hourly limit of ${MAX_EMAILS_PER_HOUR}/hr.`,
      );

      const preciseNextTime = Date.now() + 60 * 60 * 1000;
      const delayTime = preciseNextTime - Date.now();

      // 1. Update DB timestamp so UI table shows accurate future time
      await prisma.emailJob.update({
        where: { id: jobId },
        data: { scheduledAt: new Date(preciseNextTime) },
      });

      // 2. Dispatch Slack alert once per hourly window
      const alreadyNotified = await connection.setnx(notifiedKey, "1");
      if (alreadyNotified === 1) {
        await connection.expire(notifiedKey, 3600 * 2);
        await notifySlack(senderId, MAX_EMAILS_PER_HOUR);
      }

      // 3. Re-queue into delayed state cleanly without throwing fatal errors
      await emailQueue.add("send-email", job.data, {
        delay: delayTime > 0 ? delayTime : 3600000,
      });

      console.log(
        `⏳ [Rescheduled Safely] Email to ${recipient} delayed to ${new Date(
          preciseNextTime,
        ).toLocaleTimeString()}`,
      );
      return; // Exit processor cleanly
    }

    // Send Email via Ethereal SMTP
    const transporter = await getTransporter();
    const senderEmail =
      senderId || process.env.ETHEREAL_USER || "mailer@reachinbox.ai";

    const mailOptions = {
      from: `"Reachinbox" <${senderEmail}>`,
      to: recipient,
      subject: subject || "Notification",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 24px; color: #1e293b;">
          <h2 style="color: #00A859; margin-bottom: 16px;">${subject}</h2>
          <div style="font-size: 14px; line-height: 1.6;">${(
            body || ""
          ).replace(/\n/g, "<br/>")}</div>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <small style="color: #94a3b8;">Delivered via ReachInbox Production Queue Engine</small>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl(info);

    console.log(
      `✅ [Delivered] To: ${recipient}, Message ID: ${info.messageId}`,
    );

    // 🔗 Instant Clickable URL printed directly to terminal
    if (previewUrl) {
      console.log(`🔗 [CLICK TO VIEW EMAIL]: ${previewUrl}`);
    }

    // 1. Update Database Status to SENT
    await prisma.emailJob.update({
      where: { id: jobId },
      data: { status: "SENT" },
    });

    // 2. Sync Document Status in Elasticsearch Index
    await updateEmailStatusInES(jobId, "SENT");
  },
  {
    connection,
    concurrency: 5,
  },
);

emailWorker.on("failed", (job, err) => {
  console.error(`❌ [Job Failed] ID: ${job?.id}, Reason: ${err.message}`);
});

console.log(`Email Worker active and monitoring rate limits...`);
