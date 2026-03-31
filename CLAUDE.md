# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start local dev server (Next.js)
npm run build     # Production build
npm run lint      # ESLint via next lint
npm run start     # Start production server
```

No test runner is configured. There is no `npm test` script.

## Architecture Overview

**Stack:** Next.js 14 (App Router) · Supabase (PostgreSQL + Auth + RLS) · Tailwind CSS · TypeScript
**Deployment:** Vercel (auto-deploys from `main`)

### Two Distinct Experiences

**Public site** (`app/(public)/`) — No login required. Members verify identity per-request using last name + audit number. They can sign up for clinics and book private lessons. No user accounts.

**Staff app** (`app/(staff)/`) — Protected by `middleware.ts`. Supabase Auth (email/password). Five roles: `creator`, `director`, `coach`, `tennis_house`, `member` (stored in `profiles.role`).

### Member Verification (No Auth)

Public API routes verify members like this:
```ts
WHERE audit_number = $1 AND last_name ILIKE $2
```
The `audit_number` is a club-assigned ID (not UUID). Members never create accounts — they re-verify on each visit. The `booked_by_id` on records tracks who submitted the action (e.g., a tennis house staff member booking on behalf of a member).

### Staff Auth Flow

1. Login via `/staff/login` → Supabase Auth sets a session cookie
2. `middleware.ts` validates cookie on every `/staff/*` request (except `/staff/login`)
3. API routes call `getStaffUser()` from `lib/auth.ts` to get the authenticated user's profile
4. `createServiceClient()` (service role key, bypasses RLS) is used in API routes that need elevated access

### Key Library Files

- `lib/supabase/server.ts` — Server-side client (`createClient`) + service client (`createServiceClient`)
- `lib/supabase/client.ts` — Browser-side client
- `lib/auth.ts` — `getStaffUser()` resolves the authenticated staff profile
- `lib/billingHelpers.ts` — Groups clinic/lesson/MITL rows by `audit_number` for billing exports
- `lib/notifications.ts` — **All stubs.** Real email/SMS not yet implemented; replace before launch
- `lib/recurringJobs.ts` — `extendRecurrences()` generates `private_lessons` rows from active `recurrences`

### API Route Conventions

All API routes live in `app/api/`. Routes require either:
- Member verification (public routes): validate `audit_number` + `last_name`
- Staff session (staff routes): call `getStaffUser()` and check role

### Database Schema Summary

| Table | Purpose |
|---|---|
| `profiles` | All users — staff (with `role`) and members (`role = null`). `audit_number` is the club ID. `parent_id` links children to parents. |
| `courts` | 18 courts, `status`: available/blocked/maintenance |
| `clinic_slots` | Saturday/Sunday clinic hours (9, 10, 11am). Has `access_code` for daily gate entry. |
| `clinic_signups` | Clinic registrations with guest count and check-in status |
| `clinic_waitlist` | Auto-populated when slot is full; auto-promotes when spots open |
| `private_lessons` | All lessons. `status`: pending_pickup/confirmed/cancelled/completed. `booked_via`: member_app/tennis_house/coach |
| `pickup_requests` | "Any coach available" lessons — coaches can claim; escalates to director if unclaimed |
| `recurrences` | Standing weekly lesson series (generates `private_lessons` via `extendRecurrences`) |
| `coach_availability` | Coaches declare unavailability; requires director approval |
| `mitl_academy_sessions` | Fixed Mon–Fri program slots for MITL and Academy programs |
| `mitl_academy_attendance` | Daily check-ins (source of truth for billing) |

Migrations are in `supabase/migrations/`. RLS policies enforce that staff see everything; public API only exposes data after member verification.

### Frontend Reference Docs

`docs/frontend-references/` contains markdown specs describing the data each page/dashboard needs. These are the source of truth for frontend data requirements (Jake's work). Read them before building or modifying UI pages.

### Work Split

- **Backend (API routes, DB schema, lib/)** — Alex
- **Frontend (public and staff UI pages)** — Jake

The `app/(demo)/` directory contains prototype UI pages and is separate from production routes.

## Strict Backend Guardrails (Anti-Vibe Coding)
- **Database Truth**: Always reference files in `supabase/migrations/` to verify table columns before writing queries.
- **Verification Logic**: 
    - Public routes MUST use `audit_number` + `last_name`. Never assume a Supabase User session exists for members.
    - Private Lesson bookings MUST verify the member exists in `profiles` before creating the record.
- **Conflict Prevention**: 
    - Before inserting into `private_lessons` or `clinic_signups`, perform a "Check-Before-Write" to prevent double-bookings or overfilled slots.
- **Error Handling**: Every API route must use `try/catch` blocks and return a standard JSON error (e.g., `{ "error": "Reason for failure" }`) with appropriate HTTP status codes (400, 401, 404, 500).
- **No Stubs**: If you encounter a "TODO" or "stub" in `lib/`, alert me or implement the logic based on the schema; do not ignore it.
