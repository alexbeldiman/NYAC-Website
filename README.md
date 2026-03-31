# NYAC Website

A full-stack tennis club management web application for the New York Athletic Club. The system handles clinic registration, private lesson scheduling, MITL/Academy program attendance, court management, and billing exports — all behind a role-based access model.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 14](https://nextjs.org/) (App Router) |
| Database & Auth | [Supabase](https://supabase.com/) (Postgres + Row Level Security) |
| Styling | [Tailwind CSS](https://tailwindcss.com/) |
| Deployment | [Vercel](https://vercel.com/) |
| ORM / Migrations | Supabase CLI (`supabase db push`) |

---

## User Roles

| Role | Description |
|---|---|
| `creator` | Super-admin. Full access to all data, settings, and staff management. |
| `director` | Club director. Manages coaches, programs, court scheduling, and billing exports. |
| `coach` | Tennis professional. Views and manages their own lesson schedule, sets availability, and handles pickup requests. |
| `member` | Club member. Books clinics and private lessons, views their own schedule and billing history. |
| `tennis_house` | Front-desk / operations staff. Manages check-ins, walk-in registrations, and waitlist processing. |

---

## Features

### Clinics
- Members sign up for group clinic slots by time slot
- **Waitlist** — automatic queue when a slot is full; waitlisted members are promoted when a spot opens
- **Cancellations** — members cancel their spot; system notifies the next person on the waitlist
- Verification codes for check-in (staff-facing)
- Billing export per clinic session

### Private Lessons
- Members book one-off or recurring series lessons with a specific coach
- **Pickup flow** — members can mark a lesson as available for pickup; other members can claim it
- **Pickup escalation** — unclaimed pickup lessons are escalated to the full member pool after a configurable window
- **Recurring series** — lessons repeat on a weekly cadence; a job extends the series automatically
- Coach availability management (coaches set their own available windows)
- Cancellation tracking with reason codes
- Confirmation notifications sent to member and coach

### Programs (MITL / Academy)
- Session-based programs with attendance tracking
- Billing export per program

### Court Management
- Courts listed with availability schedule
- Director can assign courts to lessons and clinics
- Schedule view per court

### Billing Exports
- Per-clinic billing summary
- Per-lesson billing summary
- Global billing summary across all activity types

---

## Project Structure

```
nyac-website/
├── app/
│   ├── api/                    # Next.js API route handlers
│   │   ├── auth/               # Auth (logout)
│   │   ├── billing/            # Billing summaries (clinics, lessons, global)
│   │   ├── clinics/            # Clinic signup, waitlist, slots, codes, billing
│   │   ├── coaches/            # Coach profiles and availability
│   │   ├── courts/             # Court CRUD and schedule
│   │   ├── lessons/            # Lesson CRUD, availability, cancellation, pickup, recurring
│   │   ├── members/            # Member CRUD
│   │   ├── pickup/             # Pickup escalation job
│   │   ├── programs/           # Program sessions, attendance, billing
│   │   ├── staff/              # Staff creation
│   │   └── verify/             # Code verification
│   ├── (demo)/                 # Demo/prototype UI pages (clinics, lessons, director)
│   └── staff/                  # Staff-facing UI (director dashboard, login)
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # Browser-side Supabase client
│   │   └── server.ts           # Server-side Supabase client (SSR)
│   ├── auth.ts                 # Role resolution and session helpers
│   ├── billingHelpers.ts       # Billing calculation utilities
│   ├── notifications.ts        # Notification stubs (email/SMS hooks)
│   ├── recurringJobs.ts        # Recurring lesson series extension job
│   └── mock-data/              # Seed data and test fixtures
│
└── supabase/
    └── migrations/             # Ordered SQL migration files
```

---

## Local Setup

### Prerequisites
- Node.js 18+
- [Supabase CLI](https://supabase.com/docs/guides/cli) (`brew install supabase/tap/supabase`)
- A Supabase project (free tier is fine for development)

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/<org>/nyac-website.git
cd nyac-website

# 2. Install dependencies
npm install

# 3. Copy the environment variable template
cp .env.example .env.local
# Fill in the values — see Environment Variables section below

# 4. Link to your Supabase project
supabase login
supabase link --project-ref <your-project-ref>

# 5. Push the database schema and seed data
supabase db push

# 6. Start the development server
npm run dev
```

The app will be available at `http://localhost:3000`.

---

## Environment Variables

Create a `.env.local` file in the project root with the following variables:

```env
# Supabase project URL (found in Project Settings > API)
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co

# Supabase anon/public key (safe to expose to the browser)
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>

# Supabase service role key (server-side only — never expose to the browser)
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

> **Note:** The service role key bypasses Row Level Security. It is used only in server-side API routes and must never be included in client-side code.

---

## Branch & PR Workflow

1. **Branch from `main`** — create a feature branch with a descriptive name:
   ```bash
   git checkout -b feat/clinic-waitlist-notifications
   ```

2. **Commit small and often** — each commit should represent a single logical change.

3. **Open a PR against `main`** — include a short summary of what changed and why. Reference any related issues.

4. **Request a review** — at least one approval is required before merging.

5. **Squash and merge** — keep the `main` branch history clean.

6. **Delete the branch** after merging.

> Direct pushes to `main` are not permitted.

---

## API Overview

All routes live under `/app/api/` and follow Next.js App Router conventions (`route.ts` files with named exports for each HTTP method).

| Route Group | Path | Responsibility |
|---|---|---|
| `auth` | `/api/auth/logout` | Session management |
| `members` | `/api/members`, `/api/members/[id]` | Member CRUD |
| `clinics` | `/api/clinics/*` | Signup, slots, waitlist, cancellation, verification codes, billing |
| `lessons` | `/api/lessons`, `/api/lessons/[id]/*` | Lesson CRUD, availability, cancellations, pickup, recurring series, confirmations |
| `programs` | `/api/programs/*` | Sessions, attendance tracking, billing |
| `courts` | `/api/courts`, `/api/courts/[id]`, `/api/courts/schedule` | Court management and scheduling |
| `billing` | `/api/billing/*` | Billing exports for clinics, lessons, and global summary |
| `coaches` | `/api/coaches/[id]`, `/api/coaches/availability` | Coach profiles and availability windows |
| `staff` | `/api/staff/create` | Staff account provisioning |
| `pickup` | `/api/pickup/escalate` | Escalates unclaimed pickup lessons to the broader member pool |
| `verify` | `/api/verify` | Check-in code verification |
