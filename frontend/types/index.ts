export interface User {
  name: string;
  email: string;
  avatar: string;
}

export interface EmailJob {
  id: string;
  recipient: string;
  subject: string;
  body: string;
  status: "SCHEDULED" | "SENT" | "FAILED";
  scheduledAt: string;
  createdAt: string;
}
