# NYAC Website — System Architecture Overview

## How it all connects

```
┌─────────────────────────────────────────────────────────────┐
│                        BROWSER                              │
│                                                             │
│   Member / Coach / Director / Tennis House / Creator        │
│   logs in → sees their dashboard → takes actions           │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP requests
┌─────────────────────▼───────────────────────────────────────┐
│                     NEXT.JS APP                             │
│                                                             │
│  ┌──────────────┐        ┌──────────────────────────────┐  │
│  │  FRONTEND    │        │         BACKEND               │  │
│  │  (Jake)      │        │         (Alex)                │  │
│  │              │        │                               │  │
│  │  app/        │──────▶│  app/api/                     │  │
│  │  (dashboard) │ fetch  │  clinics/    lessons/         │  │
│  │  /member     │        │  members/    programs/        │  │
│  │  /coach      │        │  courts/     auth/            │  │
│  │  /director   │        │                               │  │
│  │  /tennis-    │        │  middleware.ts                │  │
│  │   house      │        │  (guards every route)        │  │
│  └──────────────┘        └──────────────┬────────────────┘  │
│                                         │                   │
│  lib/supabase/client.ts    lib/supabase/server.ts           │
│  (Jake uses this)          (Alex uses this)                 │
└─────────────────────────────────────────┬───────────────────┘
                                          │ SQL queries
┌─────────────────────────────────────────▼───────────────────┐
│                      SUPABASE                               │
│                                                             │
│  ┌─────────────────┐    ┌──────────────────────────────┐   │
│  │   AUTH          │    │       DATABASE               │   │
│  │                 │    │                              │   │
│  │  Validates      │    │  profiles                    │   │
│  │  login          │    │  courts                      │   │
│  │                 │    │  clinic_slots                │   │
│  │  Issues JWT     │    │  clinic_signups              │   │
│  │  session token  │    │  private_lessons             │   │
│  │                 │    │  pickup_requests             │   │
│  │  Token travels  │    │  recurrences                 │   │
│  │  with every     │    │  coach_availability          │   │
│  │  request        │    │  mitl_academy_sessions       │   │
│  └─────────────────┘    │  mitl_academy_attendance     │   │
│                         └──────────────────────────────┘   │
│                                                             │
│  Row-Level Security: users can only see/edit their own data │
└─────────────────────────────────────────────────────────────┘
                                          │
                                          │ SMS
┌─────────────────────────────────────────▼───────────────────┐
│                       TWILIO                                │
│                                                             │
│  Lesson confirmations                                       │
│  Coach pickup notifications                                 │
│  Daily clinic code → coaches & director                     │
│  Director escalation after 2hr pickup timeout              │
└─────────────────────────────────────────────────────────────┘
```

---

## Request lifecycle — example: member signs up for a clinic

```
1. Member opens app in browser
        │
2. middleware.ts checks session token
        │ valid → continue
        │ invalid → redirect to /login
        │
3. app/(dashboard)/member/clinics/page.tsx loads
   (Jake's file — fetches slot data, shows the UI)
        │
4. Member enters daily code, clicks "Sign up"
        │
5. fetch('POST /api/clinics/signup')
        │
6. app/api/clinics/signup/route.ts runs
   (Alex's file)
        ├── verify session (who is this user?)
        ├── check role = 'member'
        ├── validate daily code
        ├── check slot not full
        └── INSERT into clinic_signups table
        │
7. Supabase stores the row
        │
8. API returns success
        │
9. Jake's UI updates — button shows "Registered"
```

---

## Folder ownership

```
NYAC-Website/
│
├── app/
│   ├── (auth)/
│   │   └── login/              ← Shared (Jake builds UI, Alex wires auth)
│   │
│   ├── (dashboard)/            ← JAKE
│   │   ├── layout.tsx
│   │   ├── member/
│   │   ├── coach/
│   │   ├── director/
│   │   └── tennis-house/
│   │
│   └── api/                    ← ALEX
│       ├── auth/
│       ├── clinics/
│       ├── lessons/
│       ├── members/
│       ├── programs/
│       ├── coaches/
│       └── courts/
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts           ← JAKE uses this (browser)
│   │   └── server.ts           ← ALEX uses this (server)
│   ├── sms.ts                  ← ALEX
│   ├── roles.ts                ← ALEX
│   └── notifications.ts        ← ALEX
│
├── middleware.ts                ← ALEX
│
└── supabase/
    ├── migrations/             ← ALEX
    └── seed.sql                ← ALEX
```

---

## How auth works

```
User enters email + password
        │
Supabase Auth validates it
        │
Issues a session token (JWT)
        │
Token stored in browser cookie
        │
Every request → middleware.ts reads cookie
        │
        ├── No token → redirect to /login
        │
        └── Valid token → look up profiles table
                │
                └── Get role (member/coach/director/etc.)
                        │
                        └── Show the right dashboard
```

---

## The 5 user roles and what they see

```
┌─────────────────┬────────────────────────────────────────────┐
│ Role            │ What they can do                           │
├─────────────────┼────────────────────────────────────────────┤
│ creator (Alex)  │ Everything + system settings               │
├─────────────────┼────────────────────────────────────────────┤
│ director        │ Club-wide view, manage coaches/members,    │
│ (Kevin)         │ billing exports, approve unavailability    │
│                 │ Also books/teaches as a coach              │
├─────────────────┼────────────────────────────────────────────┤
│ coach           │ Personal schedule, clinic management,      │
│                 │ MITL/Academy check-in, pickup requests     │
├─────────────────┼────────────────────────────────────────────┤
│ member          │ Book lessons, clinic signup, family mgmt   │
├─────────────────┼────────────────────────────────────────────┤
│ tennis_house    │ Book on behalf of members, court mgmt      │
└─────────────────┴────────────────────────────────────────────┘
```

---

## The database tables and what they store

```
profiles              → Every person (adults + kids), their role, audit number
courts                → All 18 courts, which are pro courts, current status
clinic_slots          → Each Sat/Sun clinic hour, capacity, daily access code
clinic_signups        → Who signed up for which slot, guests, check-in status
private_lessons       → Every lesson booking, coach, time, status
pickup_requests       → Open "any coach" bookings waiting to be claimed
recurrences           → Standing weekly lesson series
coach_availability    → Coach unavailability requests + approval status
mitl_academy_sessions → The fixed Mon-Fri program time slots
mitl_academy_attendance → Daily check-in records for kids (billing source)
```

---

## External services

```
Vercel      → Hosts the Next.js app, auto-deploys from GitHub main branch
Supabase    → Database + auth, hosted PostgreSQL, free tier
Twilio      → Sends SMS notifications (lessons, codes, pickup alerts)
GitHub      → Source control, shared between Alex and Jake
```
