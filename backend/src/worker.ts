import path from "path";
import dotenv from "dotenv";

// Load .env from backend directory
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { Worker, Job } from "bullmq";
import IORedis from "ioredis";
import nodemailer from "nodemailer";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const connection = new IORedis(process.env.REDIS_URL as string, {
  maxRetriesPerRequest: null,
});

// Check both SMTP and ETHEREAL variable names, remove any quotes or spaces
const rawUser = process.env.SMTP_USER || process.env.ETHEREAL_USER || "";
const rawPass = process.env.SMTP_PASS || process.env.ETHEREAL_PASS || "";

const smtpUser = rawUser.replace(/["']/g, "").trim();
const smtpPass = rawPass.replace(/["'\s]/g, "").trim();

console.log("-----------------------------------------");
console.log(
  "Loaded Email User:",
  smtpUser ? `✅ ${smtpUser}` : "❌ NOT FOUND IN .ENV",
);
console.log(
  "Loaded App Password:",
  smtpPass ? "✅ Password loaded safely" : "❌ NOT FOUND IN .ENV",
);
console.log("-----------------------------------------");

// Gmail SMTP transporter with direct SSL
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

const emailWorker = new Worker(
  "email-queue",
  async (job: Job) => {
    const { jobId, recipient, subject, body } = job.data;
    console.log(`\n[Processing Job] Delivering to: ${recipient}`);

    if (!smtpUser || !smtpPass) {
      const errorMsg = "Missing email credentials in backend/.env";
      console.error(`❌ [Error]: ${errorMsg}`);
      await prisma.emailJob.update({
        where: { id: jobId },
        data: { status: "FAILED" },
      });
      throw new Error(errorMsg);
    }

    try {
      const mailOptions = {
        from: `"Reachinbox Mailer" <${smtpUser}>`,
        to: recipient,
        subject: subject || "Notification from Reachinbox",
        text: body || "Hello, this is a test email sent from Reachinbox.",
        html: `
          <div style="font-family: Arial, sans-serif; padding: 24px; color: #1e293b; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
            <h2 style="color: #00A859; margin-top: 0;">${subject || "Reachinbox Notification"}</h2>
            <p style="font-size: 15px; line-height: 1.6; color: #334155;">${(body || "Hello!").replace(/\n/g, "<br/>")}</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <small style="color: #94a3b8;">Delivered via Reachinbox Queue Engine</small>
          </div>
        `,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(
        `✅ [Delivered] Successfully sent to real inbox! Message ID: ${info.messageId}`,
      );

      await prisma.emailJob.update({
        where: { id: jobId },
        data: { status: "SENT" },
      });
    } catch (error: any) {
      console.error(
        `❌ [Delivery Failed] Error sending to ${recipient}:`,
        error?.message || error,
      );

      await prisma.emailJob.update({
        where: { id: jobId },
        data: { status: "FAILED" },
      });

      throw error;
    }
  },
  {
    connection,
    concurrency: 5,
  },
);

emailWorker.on("completed", (job) => {
  console.log(`[Job Completed] Job ID: ${job.id}`);
});

emailWorker.on("failed", (job, err) => {
  console.error(`[Job Failed] Job ID: ${job?.id}, Reason: ${err.message}`);
});

console.log("Email Worker is active and waiting for jobs...");
