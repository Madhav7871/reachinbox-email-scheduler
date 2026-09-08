import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { Worker, Job } from "bullmq";
import IORedis from "ioredis";
import nodemailer from "nodemailer";
import { PrismaClient } from "@prisma/client";
import axios from "axios";

const prisma = new PrismaClient();

const connection = new IORedis(process.env.REDIS_URL as string, {
  maxRetriesPerRequest: null,
});

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
  } catch (error) {
    console.error("Failed to send Slack alert:", error);
  }
};

const emailWorker = new Worker(
  "email-queue",
  async (job: Job) => {
    const { jobId, recipient, subject, body, senderId } = job.data;

    await new Promise((resolve) => setTimeout(resolve, MIN_DELAY_MS));

    const currentHour = new Date().setMinutes(0, 0, 0);
    const rateLimitKey = `rate_limit:${senderId}:${currentHour}`;
    const notifiedKey = `slack_notified:${senderId}:${currentHour}`;

    const sentCountThisHour = await connection.incr(rateLimitKey);
    if (sentCountThisHour === 1) {
      await connection.expire(rateLimitKey, 3600 * 2);
    }

    // 🔴 ACCURATE RATE LIMIT CHECK & PRECISE RESCHEDULING FIX
    if (sentCountThisHour > MAX_EMAILS_PER_HOUR) {
      console.log(`⚠️ [Rate Limit] Sender ${senderId} exceeded limit.`);

      // Compute exact accurate timestamp 1 hour from RIGHT NOW instead of round-off hours
      const preciseNextTime = Date.now() + 60 * 60 * 1000;
      const delayTime = preciseNextTime - Date.now();

      // Update Database so UI shows the exact accurate rescheduled time
      await prisma.emailJob.update({
        where: { id: jobId },
        data: { scheduledAt: new Date(preciseNextTime) },
      });

      // Notify Slack once per hour window
      const alreadyNotified = await connection.setnx(notifiedKey, "1");
      if (alreadyNotified === 1) {
        await connection.expire(notifiedKey, 3600 * 2);
        await notifySlack(senderId, MAX_EMAILS_PER_HOUR);
      }

      // Change job delay precisely
      await job.changeDelay(delayTime > 0 ? delayTime : 3600000);
      throw new Error(`Rate limit hit. Rescheduled accurately.`);
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
        <div style="font-family: Arial; padding: 20px;">
          <h2 style="color: #00A859;">${subject}</h2>
          <p>${(body || "").replace(/\n/g, "<br/>")}</p>
          <hr />
          <small>Delivered via Reachinbox Queue Engine</small>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(
      `✅ [Delivered] To: ${recipient}, Message ID: ${info.messageId}`,
    );

    await prisma.emailJob.update({
      where: { id: jobId },
      data: { status: "SENT" },
    });
  },
  {
    connection,
    concurrency: 5,
  },
);

emailWorker.on("failed", (job, err) => {
  if (err.message.includes("Rate limit hit")) {
    console.log(`⏳ Job ${job?.id} safely delayed due to rate limiting.`);
  } else {
    console.error(`❌ [Job Failed] ID: ${job?.id}, Reason: ${err.message}`);
  }
});

console.log(`Email Worker active and monitoring rate limits...`);
