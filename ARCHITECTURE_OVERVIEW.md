# NYAC Website — System Architecture Overview (v1.1)
 
## The two separate experiences
 
```
┌─────────────────────────────────────────────────────────────┐
│                   PUBLIC SITE                               │
│                                                             │
│   Anyone can visit — no login                              │
│   Club info, programs, contact                             │
│   Clinic signup (code + last name + audit number)          │
│   Lesson booking (last name + audit number)                │
└─────────────────────────────────────────────────────────────┘
 
┌─────────────────────────────────────────────────────────────┐
│                   STAFF APP                                 │
│                                                             │
│   Requires login — email + password                        │
│   Kevin (director), Coaches, Tennis House employees        │
│   Schedules, check-ins, rosters, billing exports           │
└─────────────────────────────────────────────────────────────┘
```
 
---
 
## Member verification flow (no account needed)
 
```
CLINIC SIGNUP
─────────────
Member visits public site
        │
Enters daily court code
        │
Enters last name + audit number
        │
System checks profiles table:
WHERE audit_number = [input]
AND last_name ILIKE [input]      ← case-insensitive, no frustration
        │
        ├── Match → signup proceeds, pick slot, add guests
        │
        └── No match → "We couldn't find your information.
                        Please double check your details or
                        speak to someone at the tennis house."
 
 
LESSON BOOKING
──────────────
Member visits public site
        │
Enters last name + audit number
        │
System checks profiles table (same check as above)
        │
        ├── Match → shows family members under that audit number
        │           Member picks who the lesson is for
        │           Picks coach (or any available)
        │           Picks time slot
        │           Enters phone number for SMS confirmation
        │           Done — no account, no password
        │
        └── No match → "Some of your information doesn't match
                        our records. Please contact the tennis house."
```
 
---
 
## How it all connects
 
```
┌─────────────────────────────────────────────────────────────┐
│                        BROWSER                              │
│                                                             │
│   PUBLIC SITE              │    STAFF APP                  │
│   No login                 │    Login required             │
│   Members, anyone          │    Kevin, Coaches, TH         │
└───────────┬────────────────┴──────────┬──────────────────--┘
            │ HTTP requests             │ HTTP requests
┌───────────▼───────────────────────────▼────────────────────┐
│                     NEXT.JS APP                             │
│                                                             │
│  ┌──────────────┐        ┌──────────────────────────────┐  │
│  │  FRONTEND    │        │         BACKEND               │  │
│  │  (Jake)      │        │         (Alex)                │  │
│  │              │        │                               │  │
│  │  app/        │──────▶│  app/api/                     │  │
│  │  (public)/   │ fetch  │  clinics/    lessons/         │  │
│  │  (staff)/    │        │  members/    programs/        │  │
│  │              │        │  courts/     auth/            │  │
│  │              │        │                               │  │
│  │              │        │  middleware.ts                │  │
│  │              │        │  (staff routes only)         │  │
│  └──────────────┘        └──────────────┬────────────────┘  │
│                                         │                   │
│  lib/supabase/client.ts    lib/supabase/server.ts           │
└─────────────────────────────────────────┬───────────────────┘
                                          │ SQL queries
┌─────────────────────────────────────────▼───────────────────┐
│                      SUPABASE                               │
│                                                             │
│  ┌─────────────────┐    ┌──────────────────────────────┐   │
│  │   AUTH          │    │       DATABASE               │   │
│  │                 │    │                              │   │
│  │  Staff only     │    │  profiles                    │   │
│  │  Email+password │    │  courts                      │   │
│  │                 │    │  clinic_slots                │   │
│  │  Members do NOT │    │  clinic_signups              │   │
│  │  have auth      │    │  private_lessons             │   │
│  │  accounts —     │    │  pickup_requests             │   │
│  │  verified by    │    │  recurrences                 │   │
│  │  last name +    │    │  coach_availability          │   │
│  │  audit number   │    │  mitl_academy_sessions       │   │
│  └─────────────────┘    │  mitl_academy_attendance     │   │
│                         └──────────────────────────────┘   │
│                                                             │
│  RLS: staff see everything, public API only returns         │
│  data after successful last name + audit number check       │
└─────────────────────────────────────────────────────────────┘
                                          │
                                          │ SMS
┌─────────────────────────────────────────▼───────────────────┐
│                       TWILIO                                │
│                                                             │
│  Lesson confirmations → member's phone                      │
│  Coach pickup notifications                                 │
│  Daily clinic code → coaches & director                     │
│  Director escalation after 2hr pickup timeout              │
└─────────────────────────────────────────────────────────────┘
```
 
---
 
## Folder ownership
 
```
NYAC-Website/
│
├── app/
│   ├── (public)/               ← JAKE (no login required)
│   │   ├── page.tsx            club home page
│   │   ├── clinics/            clinic signup
│   │   └── lessons/            lesson booking
│   │
│   ├── (staff)/                ← JAKE (login required)
│   │   ├── layout.tsx          staff shell + nav
│   │   ├── director/           Kevin's dashboard
│   │   ├── coach/              coach dashboard
│   │   └── tennis-house/       tennis house dashboard
│   │
│   └── api/                    ← ALEX
│       ├── auth/               staff login/logout
│       ├── verify/             last name + audit check (public)
│       ├── clinics/            signup, checkin, billing
│       ├── lessons/            booking, pickup, confirmation
│       ├── members/            profile lookup
│       ├── programs/           MITL/Academy attendance
│       ├── coaches/            availability
│       └── courts/             court management
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts           ← JAKE uses (browser)
│   │   └── server.ts           ← ALEX uses (server)
│   ├── sms.ts                  ← ALEX
│   ├── roles.ts                ← ALEX (staff roles only)
│   └── notifications.ts        ← ALEX
│
├── middleware.ts                ← ALEX (protects /staff routes only)
│
└── supabase/
    ├── migrations/             ← ALEX
    └── seed.sql                ← ALEX
```
 
---
 
## How staff auth works
 
```
Staff member enters email + password
        │
Supabase Auth validates it
        │
Issues session token (JWT)
        │
Token stored in browser cookie
        │
Every /staff request → middleware.ts reads cookie
        │
        ├── No token → redirect to /staff/login
        │
        └── Valid token → look up profiles table
                │
                └── Get role (coach/director/tennis_house/creator)
                        │
                        └── Show the right dashboard
```
 
---
 
## The 5 user roles
 
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
│ tennis_house    │ Book on behalf of members, court mgmt      │
├─────────────────┼────────────────────────────────────────────┤
│ member          │ No account. Verified by last name +        │
│                 │ audit number on each visit.                │
└─────────────────┴────────────────────────────────────────────┘
```
 
---
 
## Updated database tables
 
```
profiles
  id            uuid
  audit_number  text        ← family-wide membership ID
  first_name    text
  last_name     text        ← used for member verification
  phone         text        ← for SMS (parent's number for kids)
  role          text        ← staff only: director/coach/tennis_house/creator
                              null for regular members
  is_child      boolean
  date_of_birth date
  gender        text
  parent_id     uuid        ← links child to parent profile
  created_at    timestamptz
 
courts                      → all 18 courts, status, pro court flag
clinic_slots                → Sat/Sun clinic hours, capacity, daily code
clinic_signups              → who signed up, guests, check-in status
private_lessons             → every lesson booking, coach, time, status
pickup_requests             → open "any coach" bookings
recurrences                 → standing weekly lesson series
coach_availability          → unavailability requests + approval
mitl_academy_sessions       → fixed Mon-Fri program time slots
mitl_academy_attendance     → daily kid check-ins (billing source)
```
 
---
 
## Key change from v1.0
 
| v1.0 | v1.1 |
|---|---|
| Members had Supabase Auth accounts | Members have no accounts |
| Members logged in with email/password | Members verify with last name + audit number |
| middleware protected member routes | middleware only protects /staff routes |
| full_name column | split into first_name + last_name |
| One app | Two experiences: public site + staff app |
 
---
 
## External services
 
```
Vercel      → Hosts the Next.js app, auto-deploys from GitHub main
Supabase    → Database + auth (staff only), hosted PostgreSQL
Twilio      → SMS notifications
GitHub      → Source control, shared between Alex and Jake
```
