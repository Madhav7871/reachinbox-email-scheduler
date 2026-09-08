import path from "path";
import dotenv from "dotenv";

// Load .env explicitly from backend directory
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

// Configure strictly for Ethereal Email (As per Assignment Requirements)
const getTransporter = async () => {
  const etherealUser = process.env.ETHEREAL_USER?.replace(/["']/g, "").trim();
  const etherealPass = process.env.ETHEREAL_PASS?.replace(/["'\s]/g, "").trim();

  if (etherealUser && etherealPass) {
    console.log(`[SMTP] Connected to Ethereal Account: ${etherealUser}`);
    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: etherealUser,
        pass: etherealPass,
      },
    });
  }

  // Fallback: Auto-generate Ethereal account if .env is missing
  console.log(
    "[SMTP] No Ethereal credentials in .env, generating test account...",
  );
  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
};

const emailWorker = new Worker(
  "email-queue",
  async (job: Job) => {
    const { jobId, recipient, subject, body, senderId } = job.data;
    console.log(`\n[Processing Job] Delivering to: ${recipient}`);

    const transporter = await getTransporter();
    // Simulate multiple senders
    const senderEmail =
      senderId || process.env.ETHEREAL_USER || "mailer@reachinbox.ai";

    try {
      const mailOptions = {
        from: `"Reachinbox Mailer" <${senderEmail}>`,
        to: recipient,
        subject: subject || "Notification from Reachinbox",
        text: body || "Hello, this is a test email sent from Reachinbox.",
        html: `
          <div style="font-family: Arial, sans-serif; padding: 24px; color: #1e293b; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
            <h2 style="color: #00A859; margin-top: 0;">${subject || "Reachinbox Notification"}</h2>
            <p style="font-size: 15px; line-height: 1.6; color: #334155;">${(body || "Hello!").replace(/\n/g, "<br/>")}</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <small style="color: #94a3b8;">Delivered via Reachinbox Queue Engine (Ethereal SMTP)</small>
          </div>
        `,
      };

      const info = await transporter.sendMail(mailOptions);

      // Get the fake Ethereal Preview URL
      const previewUrl = nodemailer.getTestMessageUrl(info);

      console.log(`✅ [Delivered via Ethereal] Message ID: ${info.messageId}`);
      if (previewUrl) {
        console.log(`🔍 [ETHEREAL PREVIEW URL]: ${previewUrl}`);
        console.log(
          `(Ctrl+Click the link above to view the fake email in browser)`,
        );
      }

      // Update Database
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
    concurrency: 5, // As required by assignment: configurable worker concurrency
  },
);

emailWorker.on("completed", (job) => {
  console.log(`[Job Completed] Job ID: ${job.id}`);
});

emailWorker.on("failed", (job, err) => {
  console.error(`[Job Failed] Job ID: ${job?.id}, Reason: ${err.message}`);
});

console.log("Email Worker is active (Ethereal Mode) and waiting for jobs...");
