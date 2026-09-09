# 📬 ReachInbox — Distributed Multi-Tenant Email Campaign Engine

A high-throughput, distributed email campaign scheduling and rate-limiting system built with **Next.js**, **Node.js/Express**, **TypeScript**, **BullMQ**, **Redis**, **Prisma (PostgreSQL)**, and **Elasticsearch**.

Engineered for strict multi-tenant isolation, dynamic hourly rate limiting, automated queue rescheduling, fail-safe SMTP delivery, and live administrative telemetry.

---

## 🌟 Key Highlights & Capabilities

- **Strict Multi-Tenant Isolation**: Hourly rate limits and queue dispatches are completely isolated per `senderId`. If one sender reaches their hourly dispatch threshold, other senders' campaigns continue executing with zero queue latency.
- **Distributed Queue Architecture**: Leverages BullMQ and Redis to execute non-blocking delayed jobs, exponential backoff, worker concurrency, and intelligent rescheduling.
- **Dynamic Atomic Rate Limiting**: Employs Redis atomic operations partitioned by sender key (`rate_limit:{senderId}:{hour}`) to eliminate race conditions.
- **Fail-Safe SMTP Delivery**: Built-in Nodemailer transport with an automated provisioning fallback that generates ephemeral Ethereal test inboxes on the fly if provided credentials fail.
- **Real-Time Slack Threshold Alerts**: Automatically notifies the configured Slack channel via webhook the moment a tenant hits their hourly sending cap.
- **Full-Text Campaign Search**: Elasticsearch/OpenSearch indexing across recipients, subjects, and email bodies, with automated PostgreSQL query fallback.
- **Interactive Web Interface**:
  - **Click-to-Preview Modal**: Inspect campaign metadata, delivery timestamps, and formatted HTML bodies.
  - **Safe Campaign Cancellation**: One-click cancellation and database deletion restricted strictly to scheduled emails (sent campaigns are locked for audit integrity).
  - **Custom Micro-UI Notifications**: Custom SVG-based status toast alerts replacing browser popups.
  - **Live Delivery Counters**: Dynamic badge counts for `Scheduled` and `Sent` states.

---

## 🏗️ System Architecture

```text
                               ┌─────────────────────────┐
                               │     Next.js Client      │
                               │   (Dashboard & UI)      │
                               └────────────┬────────────┘
                                            │
                                            ▼ REST API
                               ┌─────────────────────────┐
                               │   Express API Server    │
                               └─────┬──────────────┬────┘
                                     │              │
           ┌─────────────────────────┘              └─────────────────────────┐
           ▼                                                                  ▼
┌─────────────────────────┐                                      ┌─────────────────────────┐
│  PostgreSQL (Supabase)  │                                      │ Elasticsearch / Search  │
│  (Persistent Storage)   │                                      │ (Full-Text Retrieval)   │
└─────────────────────────┘                                      └─────────────────────────┘
                                     │
                                     ▼ Enqueue Task
                               ┌─────────────────────────┐
                               │   BullMQ (Redis Store)  │
                               └────────────┬────────────┘
                                            │
                                            ▼ Consume Job
                               ┌─────────────────────────┐
                               │    Background Worker    │
                               └────────────┬────────────┘
                                            │
               ┌────────────────────────────┴────────────────────────────┐
               ▼                                                         ▼
       [ Quota Exceeded ]                                        [ Quota Available ]
 1. Reschedule job (+1 Hour)                              1. Increment Redis Hourly Key
 2. Dispatch Slack Webhook Alert                          2. Deliver via Ethereal SMTP
 3. Return worker to idle pool                            3. Update DB & Elastic status to SENT
```

---

## 🛠️ Technology Stack

| Layer                  | Technologies                                                 |
| :--------------------- | :----------------------------------------------------------- |
| **Frontend UI**        | Next.js 14+ (App Router), React 18, TypeScript, Tailwind CSS |
| **Backend API**        | Node.js, Express.js, TypeScript                              |
| **Task Queue & Cache** | BullMQ, Redis (Upstash / Local)                              |
| **Database & ORM**     | PostgreSQL (Supabase), Prisma ORM                            |
| **Search Engine**      | Elasticsearch / OpenSearch                                   |
| **SMTP / Delivery**    | Nodemailer, Ethereal Test Engine                             |
| **Queue Monitoring**   | Bull-Board (`@bull-board/express`)                           |

---

## 📂 Repository Structure

```text
reachinbox/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # Database schema definitions
│   ├── src/
│   │   ├── server.ts              # API Server, Bull-Board, and search routes
│   │   ├── worker.ts              # Distributed queue processor & rate limiter
│   │   └── elasticsearch.ts       # Elasticsearch indexing & fallback query helpers
│   ├── .env.example               # Template for environment configuration
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/
    ├── app/                       # Next.js App Router root layout and page
    ├── components/
    │   ├── Dashboard.tsx          # Master layout and state coordinator
    │   ├── EmailTable.tsx         # Campaign cards, modal preview & delete workflow
    │   ├── ComposeModal.tsx       # Campaign scheduling modal with tenant isolation
    │   ├── Toast.tsx              # SVG status notification system
    │   ├── Header.tsx             # Global search bar and tenant selector
    │   └── Sidebar.tsx            # Navigation tabs with reactive badges
    ├── types/                     # Shared TypeScript interfaces
    ├── package.json
    └── tailwind.config.ts
```

---

## ⚙️ Environment Variables Reference

Create a `.env` file in the `backend/` directory based on the following specification:

```env
# Database (PostgreSQL via Supabase or Local)
DATABASE_URL="postgresql://postgres:your_password@db.your_instance.supabase.co:5432/postgres"

# Redis Instance (Upstash or Local URI)
REDIS_URL="rediss://default:your_token@your-redis-host.upstash.io:6379"

# Rate Limiting & Scheduling Defaults
MAX_EMAILS_PER_HOUR=200
MIN_DELAY_BETWEEN_EMAILS_MS=1000

# Express Server Port
PORT=3001

# Ethereal SMTP (Leave blank to trigger automated on-the-fly test provisioning)
ETHEREAL_USER=""
ETHEREAL_PASS=""

# Optional Search Engine Instance
ELASTICSEARCH_NODE="http://localhost:9200"
```

---

## 🚀 Installation & Local Setup

### Prerequisites

- **Node.js**: `v18.0.0` or higher
- **Package Manager**: `npm` or `yarn`

### Step 1: Clone the Repository

```bash
git clone [https://github.com/Madhav7871/reachinbox-email.git](https://github.com/Madhav7871/reachinbox-email.git)
cd reachinbox-email
```

### Step 2: Backend Setup

1. Navigate to the `backend/` folder and install dependencies:
   ```bash
   cd backend
   npm install
   ```
2. Set up environment variables (copy values provided in the submission email):
   ```bash
   cp .env.example .env
   ```
3. Synchronize database schema and build:
   ```bash
   npx prisma generate
   npx prisma db push
   npx tsc
   ```
4. Launch the API Server and Worker in separate terminals:
   - **Terminal 1 (API Server):** `node dist/server.js` (Runs on `http://localhost:3001`)
   - **Terminal 2 (Queue Worker):** `node dist/worker.js`

### Step 3: Frontend Setup

1. Navigate to the `frontend/` folder:
   ```bash
   cd ../frontend
   npm install
   ```
2. Start the Next.js development server:
   ```bash
   npm run dev
   ```
3. Access the dashboard at `http://localhost:3000`.

---

## 📡 REST API Reference

- `POST /api/schedule` — Schedules a campaign with custom delays, tenant identity, and rate limits.
- `GET /api/jobs/scheduled` — Retrieves pending scheduled campaigns.
- `GET /api/jobs/sent` — Retrieves processed campaigns (`SENT` and `FAILED`).
- `DELETE /api/jobs/:id` — Cancels and permanently removes a scheduled campaign.
- `GET /api/emails/search` — Full-text query against recipient, subject, and body.
- `GET /admin/queues` — Graphical user interface for queue inspection.

---

## 👨‍💻 Author

Developed by **Madhav Kalra** as part of the Full-Stack Engineering Evaluation.
