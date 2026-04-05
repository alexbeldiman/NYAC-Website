# Clinics Page — Build Spec
**File:** `html/clinics.html`
**Location:** Inside the `NYAC-Website` repo at `html/clinics.html`
**API base:** All fetch calls use relative paths (e.g. `/api/clinics/slots`) — same origin as Next.js

---

## Before You Build

1. Read `CLAUDE.md` in the repo root for full architecture, schema, and backend guardrails
2. Read `docs/frontend-references/` for any clinics-specific data reference docs
3. Read `brand_assets/` for logo, colors, and typography — do not hardcode brand colors, use the CSS variable system established in `html/index.html`
4. Match the design system from `html/index.html` exactly: same CSS variables, fonts, nav, footer, spacing, dividers, card patterns, and animation style
5. Reference `supabase/migrations/` to verify exact column names before writing any query assumptions into fetch payloads or response handling

---

## Backend Change Required Before Building the Page

### Add `gender` to verify route
File: `app/api/verify/route.ts`
Add `gender` to the select query on `profiles` so the verification response includes the member's gender:
```ts
.select("id, first_name, last_name, audit_number, gender, is_child")
```
This is a one-line change. Make it before building the frontend.

---

## Design System Rules

- Copy CSS variables, font stack, nav, footer, `.btn-crimson`, `.btn-ghost`, `.btn-outline`, `.section-label`, `.divider-crimson`, and `.fade-up` verbatim from `html/index.html`
- Never use default Tailwind blue/indigo as primary color
- Never use `transition-all` — animate only `transform` and `opacity`
- Every clickable element needs hover, focus-visible, and active states
- Shadows must be layered and color-tinted, never flat
- Typography: display/serif for headings, clean sans for UI, body serif for copy — never the same font for both
- Single file — all styles inline in `<style>`, no external CSS files

---

## Access Window

- Page is only accessible **Saturday 5:00 AM through Sunday 3:00 PM Eastern**
- Outside this window: render a locked state — same nav and footer, main content replaced with a message showing exactly when the page opens next
- Time check runs client-side on page load using Eastern time — account for UTC offset and DST correctly
- Do not hide the page entirely — always render nav and footer, only swap main content

---

## Slot Display

- Show **two columns**: Saturday | Sunday, side by side
- Each day shows exactly **4 slot cards** at hours 8, 9, 10, 11 AM
- Slot labels (fixed, not from API):
  - 8:00 AM — Men's Clinic
  - 9:00 AM — Women's Clinic
  - 10:00 AM — Mixed Clinic
  - 11:00 AM — Mixed Clinic
- Fetch slots: `GET /api/clinics/slots?date=YYYY-MM-DD` for both Saturday and Sunday
- Match API response rows to cards by `hour` field
- If no row returned for a given hour: render the card as "Not Scheduled" with no action button
- Each card shows:
  - Slot name and time
  - Gender restriction label (Men's / Women's / Mixed)
  - Exact remaining spots: `capacity - signed_up_count`
  - Attendee list (first names only) — fetch from `GET /api/clinics/slots/[slotId]/attendees`
  - Action button (see states below)

---

## Card Button States

| Condition | Button shown |
|---|---|
| Not verified | No button visible |
| Verified, not eligible (gender) | "Not Eligible" — grey, disabled |
| Verified, eligible, spots available | "Sign Up" — crimson |
| Verified, eligible, slot full | "Join Waitlist" |
| Verified, already signed up | No button — cancel link next to name in attendee list |
| Not Scheduled | No button |

---

## Gender Restriction Logic (client-side)

- After verification, member's `gender` is stored in memory from the verify response
- 8:00 AM Men's slot: disable and grey out for members where `gender !== 'male'`
- 9:00 AM Women's slot: disable and grey out for members where `gender !== 'female'`
- 10:00 AM and 11:00 AM Mixed: available to all verified members
- Greyed-out cards remain fully visible — button shows "Not Eligible", non-interactive
- Unverified members see all 4 cards but no action buttons on any card

---

## Member Verification

- Sticky bar below nav: **Last Name** + **Audit Number** inputs + Verify button
- `POST /api/verify` with body `{ last_name, audit_number }`
- Response: `{ adults: [{ id, first_name, last_name, audit_number, gender }], children: [] }`
- Use `adults[0]` as the verified member
- Store in a JS memory object — never localStorage or sessionStorage:
  ```js
  let member = { id, first_name, last_name, audit_number, gender }
  ```
- On success: replace the form with a greeting — "Verified: [First Name] [Last Initial]." — and show the access code entry field
- Verification resets on page reload — member must re-verify
- On failure (401): show inline error "Member not found. Check your last name and audit number."

---

## Access Code

- Appears inline below the verification bar after member is verified
- One input field + Submit button
- `POST /api/clinics/verify-code` with body `{ date: 'YYYY-MM-DD', code: string }`
- The date used is today's date (Saturday or Sunday depending on current day)
- On success: set `codeVerified = true` in memory, hide the code entry field, show "Access granted" confirmation
- On failure: show inline error "Incorrect code. Try again."
- Code entry is skipped for the rest of the session once verified — persists until page reload
- Sign up buttons are not active until both member verification and code verification are complete

---

## Signup Flow

- Clicking **Sign Up** expands an inline form **directly below the slot card** — not a modal
- Form fields:
  - Guest count: dropdown 0–4
  - Guest names: one text input per guest, shown dynamically as guest count changes
- Submit: **Confirm Sign Up**
- `POST /api/clinics/signup/[slotId]` with body:
  ```json
  {
    "slot_id": "uuid",
    "last_name": "string",
    "audit_number": "string",
    "guest_count": 0,
    "guest_names": ["string"]
  }
  ```
- On success:
  - Collapse and remove the inline form
  - Add member's first name to the attendee list with a **Cancel** link next to it
  - Store the returned `signup.id` in memory — needed for cancellation
  - Decrement remaining spots display by `1 + guest_count`
- On error: show inline error below the form using exact API error message
  - "This session is full" → "This session is now full."
  - "You are already signed up for this session" → show as-is

---

## Attendee List

- Shown on each card after member is verified
- Fetch from `GET /api/clinics/slots/[slotId]/attendees`
- Display first names only
- Member's own name (matched by `audit_number`) appears with a **Cancel** link inline
- Cancel link only visible if member is verified in current session
- Page reload clears verification — cancel link disappears until re-verified

---

## Cancellation

- `DELETE /api/clinics/signup/[signupId]` with body:
  ```json
  {
    "last_name": "string",
    "audit_number": "string"
  }
  ```
- `[signupId]` is the `clinic_signups` row ID — stored in memory at signup or retrieved from attendees response
- On success:
  - Remove member's name from the attendee list
  - Increment remaining spots display by `1 + guest_count`
  - Restore Sign Up button on the card
- **Late cancellation:** API response includes `{ signup: { late_cancel: boolean } }`
  - If `late_cancel === true`: show warning on the card — "This was a late cancellation and has been flagged on your account."
  - Still complete the cancellation — do not block it
- On error: show inline error on the card

---

## Waitlist Flow

- When `is_full === true`: show **Join Waitlist** button
- Clicking expands same inline form as signup (guest count + guest names)
- `POST /api/clinics/waitlist/[slotId]` with same body as signup
- On success:
  - Show member's name in attendee list area with "Waitlist — Position #N" label
  - Position number comes from API response
  - Replace Join Waitlist button with "On Waitlist"

---

## Slot Seeding

- `clinic_slots` may have no rows for upcoming weekends
- Check `supabase/migrations/` for existing seeding logic before writing anything new
- If no weekend rows exist, create a Supabase migration that seeds Saturday and Sunday slots for the next 8 weeks:
  - Hours: 8, 9, 10, 11
  - Default capacity: 12
  - `access_code`: leave null — staff populates via their dashboard
- Confirm all column names against migrations before writing the seed

---

## Page Structure

```
NAV (identical to html/index.html)
│
PAGE HERO
│  Height: 320px
│  Same background image style as index.html
│  Title: "Weekend Clinics"
│  Subtitle: "Saturday & Sunday · Travers Island"
│
ACCESS WINDOW CHECK (client-side on load)
│  Outside window → locked state with next open time, nav + footer still visible
│  Inside window → render full page below
│
VERIFICATION BAR (sticky below nav)
│  State 1: Last Name + Audit Number inputs + Verify button
│  State 2 (verified, code not entered): Greeting + access code input + Submit
│  State 3 (verified + code confirmed): "Verified: John M. · Access Granted"
│
MAIN CONTENT
│  Two columns: Saturday | Sunday
│  Each column: 4 slot cards (8, 9, 10, 11 AM)
│  Each card: name, time, gender label, spots remaining, attendee list, action button
│  Inline signup/waitlist form expands below card on click
│
INFO STRIP (same pattern as index.html)
│  Three items: Cancellation Policy · Guest Policy · Access Code Info
│
FOOTER (identical to html/index.html)
```

---

## Error & Edge Cases

- Fetch failure: show inline error on affected card — do not crash the page
- Slot not scheduled: render card with "Not Scheduled" label, no button
- Guest count exceeds remaining spots: API returns 409 — show "Not enough spots for your party"
- All errors appear inline, never as browser alerts or popups
- If attendees fetch fails: render card without attendee list, do not block slot display

---

## What Not To Do

- Do not use `localStorage` or `sessionStorage` — JS memory only
- Do not use `transition-all`
- Do not use a modal for signup — inline expansion only
- Do not block the page outside the access window — show locked state
- Do not hardcode colors — use CSS variables
- Do not invent API endpoints — every endpoint in this spec has been verified against the codebase
- Do not add features not listed in this spec
- Do not start building until the `gender` backend change is made
