# NYAC Travers Island — Private Lessons Page Prompt V1
## For: VS Code Claude Extension
## File to create: `private-lessons.html`

---

## OVERVIEW

Build a single-file HTML page (`private-lessons.html`) for the NYAC Travers Island Tennis private lessons booking system. This page must match the existing site design system exactly — same nav, footer, CSS variables, fonts, and button styles as `court-booking.html`. All logic is frontend/mock only — no real backend. Use mock data arrays defined in a `<script>` block at the bottom of the file.

---

## STRICT CONSTRAINTS — READ BEFORE WRITING ANY CODE

1. Copy the nav, footer, CSS variables, font imports, `.btn-crimson`, `.btn-light`, `.btn-ghost`, `.section-label`, `.divider-crimson`, `#main-nav`, `#mobile-nav`, hamburger button logic, and `#site-footer` VERBATIM from `court-booking.html`. Change absolutely nothing about these elements.
2. The active nav link must be `private-lessons.html`.
3. Do NOT invent new color variables, font families, border-radius values, or spacing units. Use only the CSS variables already defined in `court-booking.html`.
4. Do NOT add modals, overlays, or popups of any kind. All interactions are inline on the page.
5. Do NOT add any pricing, rate, or cost information anywhere on the page.
6. Do NOT add coach specialty tags, level labels, or any text below coach names on coach cards. Name and photo only.
7. Every section of the booking flow must reveal progressively — sections below only appear after the section above is completed. Do not render future steps in a hidden/display:none state that could flash on load; build them into the DOM only when needed, or use display:none with no transition flash.
8. Change absolutely nothing about the nav, footer, or slim hero structure once defined.

---

## DESIGN SYSTEM (copy exactly from `court-booking.html`)

```css
:root {
  --crimson:    #C8102E;
  --crimson-dk: #A00D23;
  --white:      #FFFFFF;
  --off-white:  #FAF8F5;
  --dark:       #1A1A1A;
  --mid-gray:   #6B6B6B;
  --light-gray: #E8E4DF;
  --charcoal:   #2C2C2C;

  --font-display: 'Playfair Display', Georgia, serif;
  --font-label:   'Cormorant Garamond', Georgia, serif;
  --font-ui:      'Montserrat', Arial, sans-serif;
  --font-body:    'Lora', Georgia, serif;
}
```

Font import (copy verbatim):
```html
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Cormorant+Garamond:wght@400;600&family=Montserrat:wght@400;500;600&family=Lora:ital,wght@0,400;0,500;1,400&display=swap" rel="stylesheet">
```

---

## PAGE TITLE

```html
<title>Private Lessons — NYAC Travers Island Tennis</title>
```

---

## SECTION 1 — SLIM HERO

Copy the `#slim-hero` block verbatim from `court-booking.html`. Change only:
- `<h1>` text → `Private Lessons`
- Hero background image → `NYAC.Website.Photos/Side.View.Courts.jpg` (same as court-booking)
- `hero-location` text → `NYAC Travers Island`

Do not change any CSS for `#slim-hero`.

---

## SECTION 2 — MEMBER LESSONS VIEW

This section sits directly below the slim hero, full-width, background `var(--off-white)`, padding `48px 0`.

### Layout
- Max-width `960px`, centered, padding `0 40px`
- Section heading: `"Your Lessons"` — `font-family: var(--font-display)`, `font-size: 32px`, `font-weight: 400`, `color: var(--dark)`
- Below heading: a `<hr class="divider-crimson">` (48px wide, left-aligned)
- Below divider: two tab pills — `"Upcoming"` and `"Past"` — styled as toggle pills (see pill styles below)
- Default active tab: `"Upcoming"`

### Before verification
Show a soft placeholder state: italic `var(--font-body)` text in `var(--mid-gray)` that reads:
`"Verify your membership below to view your lesson history."`
No lesson cards rendered.

### After verification
Show all family members' lessons (upcoming tab) or past lessons (past tab) as lesson cards.

Each lesson card: white background, `1px solid var(--light-gray)` border, padding `20px 24px`, margin-bottom `12px`.

Card layout — CSS grid `200px 1fr auto`:
- **Left column**: date in `var(--font-display)` 22px, day-of-week below in `var(--font-ui)` 11px uppercase `var(--mid-gray)`
- **Middle column**: Coach name in `var(--font-display)` 17px; below that `"with [Family Member Name]"` in `var(--font-body)` 13px `var(--mid-gray)`; below that time + duration on one line in `var(--font-ui)` 12px `var(--mid-gray)`
- **Right column (upcoming tab only)**: inline `"Cancel"` text button — `var(--font-ui)` 11px uppercase, `var(--crimson)` color, no border, no background, letter-spacing `0.12em`. On click: replace button with inline confirmation row: `"Cancel this lesson?"` + `[Yes, Cancel]` (crimson text button) + `[Keep]` (mid-gray text button). No modal. On confirm: card fades out and is removed from DOM; a green-tinted inline success line `"Lesson cancelled."` appears for 3 seconds then fades out. Member can cancel any upcoming lesson at any time — no cutoff restriction.

### Tab pill styles
```css
.tab-pill {
  font-family: var(--font-ui);
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  padding: 8px 20px;
  border: 1px solid var(--light-gray);
  background: var(--white);
  color: var(--mid-gray);
  cursor: pointer;
  transition: all 0.2s ease;
}
.tab-pill.active {
  background: var(--crimson);
  border-color: var(--crimson);
  color: var(--white);
}
```

### Mock lesson data
```js
// Dates computed dynamically from new Date() — do NOT hardcode
const MOCK_LESSONS_UPCOMING = [
  { id: 'l1', coachName: 'Kevin Doyle',     familyMember: 'John Smith',  daysFromNow: 3,  startTime: '10:00 AM', duration: '60 min' },
  { id: 'l2', coachName: 'Maria Santos',    familyMember: 'Emma Smith',  daysFromNow: 7,  startTime: '2:00 PM',  duration: '30 min' },
  { id: 'l3', coachName: 'James Whitfield', familyMember: 'Sarah Smith', daysFromNow: 10, startTime: '9:00 AM',  duration: '60 min' },
];
const MOCK_LESSONS_PAST = [
  { id: 'l4', coachName: 'Kevin Doyle', familyMember: 'John Smith', daysFromNow: -5,  startTime: '11:00 AM', duration: '60 min' },
  { id: 'l5', coachName: 'Priya Nair',  familyMember: 'Liam Smith', daysFromNow: -12, startTime: '4:00 PM',  duration: '30 min' },
];
```

---

## SECTION 3 — BOOKING ENTRY POINT

Sits below the lessons view. Full-width, white background, padding `64px 0`.

### Layout
- Max-width `960px`, centered, padding `0 40px`
- Heading: `"Book a Lesson"` — `var(--font-display)` 32px weight 400
- `<hr class="divider-crimson">`
- Below: two large path-selector cards side by side — CSS grid `1fr 1fr`, gap `24px`

### Path Selector Cards
Each card: white bg, `1px solid var(--light-gray)`, padding `36px 32px`, cursor pointer.
On hover: `border-color: var(--crimson)`, transition `0.2s`.

**Card A — "Browse by Coach"**
- Inline SVG icon: simple person/silhouette outline, ~32px, `var(--crimson)` stroke
- Heading: `"Browse by Coach"` — `var(--font-display)` 22px
- Subtext: `"Choose your preferred coach, then find a time that works."` — `var(--font-body)` 14px `var(--mid-gray)`

**Card B — "Browse by Date"**
- Inline SVG icon: simple calendar outline, ~32px, `var(--crimson)` stroke
- Heading: `"Browse by Date"` — `var(--font-display)` 22px
- Subtext: `"Pick a date first, then see all available coaches and times."` — `var(--font-body)` 14px `var(--mid-gray)`

On click of either card: cards are replaced by the appropriate booking flow (Section 4). A back link `"← Change search method"` appears above the flow — clicking it resets back to the two path cards and clears all flow state.

---

## SECTION 4 — BOOKING FLOW (progressive disclosure)

All steps live inside a single `#booking-flow` container below Section 3. Background `var(--off-white)`, padding `48px 0`.

Steps reveal one at a time as the member progresses. Each completed step collapses to a single-line summary bar with an `"Edit"` link. Clicking `"Edit"` re-expands that step and destroys all steps below it (they must be re-completed).

**Collapsed summary bar spec:**
- Height `52px`, white bg, `1px solid var(--light-gray)`, padding `0 24px`
- Flex layout: step title on left (`var(--font-ui)` 12px uppercase `var(--mid-gray)`) + summary value centered (`var(--font-body)` 14px `var(--dark)`) + `"Edit"` on right (`var(--font-ui)` 11px uppercase `var(--crimson)` cursor pointer)

**Active step card spec:**
- White bg, `1px solid var(--light-gray)`, padding `36px 40px`, margin-bottom `16px`
- Step header: step number pill (24px circle, `var(--crimson)` border + text, `var(--font-ui)` 11px) + step title (`var(--font-display)` 22px weight 400) on one flex row
- `<hr>` below header: `1px solid var(--light-gray)`, full width, margin `20px 0`

**Step reveal animation:** `opacity 0→1`, `transform: translateY(12px)→translateY(0)`, duration `0.35s ease`.

Max-width `960px`, centered, padding `0 40px`.

---

### FLOW A — COACH-FIRST PATH

#### Step A1 — Select a Coach

Display all coaches as a flex-wrap row, gap `16px`.

**Coach card:**
- White bg, `1px solid var(--light-gray)`, width `160px`, cursor pointer
- Coach photo: `160px × 180px`, `object-fit: cover`, top of card
- If photo fails to load (`onerror`): replace with a placeholder div `160px × 180px`, background `var(--light-gray)`, centered initials in `var(--font-display)` 28px `var(--mid-gray)`
- Coach name: `var(--font-display)` 15px, centered, padding `12px 12px 16px`
- NO specialty, level, rating, years, or any other text below the name
- On hover: `border-color: var(--crimson)`, transition `0.2s`
- On select: `border: 2px solid var(--crimson)`, background tint `rgba(200,16,46,0.04)`

```js
const COACHES = [
  { id: 'c1', name: 'Kevin Doyle',     photo: 'NYAC.Website.Photos/Coach.Kevin.Doyle.png' },
  { id: 'c2', name: 'Maria Santos',    photo: 'NYAC.Website.Photos/Coach.Maria.Santos.png' },
  { id: 'c3', name: 'James Whitfield', photo: 'NYAC.Website.Photos/Coach.James.Whitfield.png' },
  { id: 'c4', name: 'Priya Nair',      photo: 'NYAC.Website.Photos/Coach.Priya.Nair.png' },
];
```

Below coach cards: `btn-crimson` `"Continue →"` — disabled until a coach is selected.

---

#### Step A2 — Select a Date

A 14-day scrollable date pill strip (today through today + 13 days).

- Pills: `var(--font-ui)` 12px, abbreviated day name on top row, date number on bottom row
- Selected: `background: var(--crimson)`, white text
- Horizontally scrollable flex row, `gap: 8px`, `overflow-x: auto`
- Today pre-selected by default

Below pills: `btn-crimson` `"Continue →"` — enabled as soon as a date pill is selected.

---

#### Step A3 — Select a Time Slot (Grid View)

A matrix grid: time labels as rows, coaches as columns.

**Grid structure:**
- First column (sticky on mobile): time labels every 30 minutes from `7:00 AM` to `8:30 PM` — `var(--font-ui)` 11px `var(--mid-gray)`, right-aligned, width `72px`
- Remaining columns: one per coach, header = coach first name only — `var(--font-ui)` 11px uppercase `var(--mid-gray)`, centered, padding `8px 0`
- Each cell: `40px` tall, `min-width: 80px`, border `1px solid var(--light-gray)`

**Cell states — apply these classes:**
- `.slot-available`: white bg, on hover `background: rgba(200,16,46,0.07)`, cursor pointer
- `.slot-taken`: background `var(--off-white)`, color `var(--light-gray)`, cursor not-allowed, a centered `–` character to signal unavailability, no hover effect
- `.slot-selected`: background `var(--crimson)`, color white, `font-weight: 600`

**Mock availability generation:**
Use a seeded pseudo-random function (same `seededRandom()` pattern as `court-booking.html`). Seed = coach `id` + selected date ISO string. Mark ~35% of slots as taken. Re-compute whenever date changes.

**Coach unavailability:**
```js
const MOCK_COACH_UNAVAILABILITY = [
  { coachId: 'c3', date: '[today + 2 days ISO — compute dynamically]' },
];
```
If a coach has an unavailability entry matching the selected date:
- Grey out their column header with a small `"Unavailable"` label below their name in `var(--font-ui)` 10px `var(--mid-gray)` italic
- Make all their cells non-interactive (`.slot-taken` style) for that date
- Do NOT hide the column — keep it visible but disabled

Below grid: selected slot summary line in `var(--font-body)` 14px `var(--dark)`, then `btn-crimson` `"Continue →"` disabled until a slot is selected.

---

#### Step A4 — Select Family Member

Heading: `"Who is this lesson for?"` — `var(--font-display)` 20px

Vertical list of selectable member rows:
- Each row: white bg, `1px solid var(--light-gray)`, padding `14px 20px`, full width, cursor pointer
- Flex layout: name on left (`var(--font-display)` 16px) + relationship tag on right (`var(--font-ui)` 11px `var(--mid-gray)` e.g. `"Member"`, `"Child"`, `"Spouse"`)
- On select: `border-color: var(--crimson)`, `border-left: 3px solid var(--crimson)`
- Children under age 13 (check `dob` field against today): show row with a lock `🔒` icon and sub-text `"Must be booked by a parent"` in `var(--font-body)` 12px `var(--mid-gray)` italic — cursor not-allowed, background `var(--off-white)`, non-selectable

```js
const FAMILY_MEMBERS = [
  { id: 'f1', name: 'John Smith',  relation: 'Member', dob: null },
  { id: 'f2', name: 'Sarah Smith', relation: 'Spouse', dob: null },
  { id: 'f3', name: 'Emma Smith',  relation: 'Child',  dob: '2014-03-15' }, // under 13 — locked
  { id: 'f4', name: 'Liam Smith',  relation: 'Child',  dob: '2009-07-22' }, // over 13 — selectable
];
// <!-- TBD: confirm minimum booking age with Kevin — currently hardcoded as 13 -->
```

Below list: `btn-crimson` `"Continue →"` disabled until a selection is made.

---

#### Step A5 — Review & Confirm

Summary card with grid layout `140px 1fr`:
- `Coach` / selected coach name
- `Date` / formatted e.g. `Saturday, April 12`
- `Time` / selected start time
- `Duration` / three pill buttons inline: `"30 min"` | `"60 min"` | `"90 min"` — member must select one. Pill style: `var(--font-ui)` 11px, border `1px solid var(--light-gray)`, padding `6px 14px`, cursor pointer. Selected: `background: var(--crimson)`, white text, `border-color: var(--crimson)`. <!-- TBD: confirm duration options with Kevin -->
- `Lesson For` / selected family member name

`btn-crimson` `"Confirm Booking"` below summary — disabled until duration is selected.

**Child booking email check:**
If selected family member is a child AND `MOCK_MEMBER.parentEmail` is `null`:
- Before showing verification fields, show inline prompt above the confirm button:
  `"No confirmation email on file. Please enter a parent email address."`  in `var(--font-body)` 13px `var(--mid-gray)` italic
- An email input field below (same style as `.name-field-input` from `court-booking.html`)
- Member must enter email before proceeding; on entry save to `MOCK_MEMBER.parentEmail`

**Verification gate (inline — no modal):**
On click of `"Confirm Booking"`, if `MOCK_MEMBER.verified === false`:
- Verification fields slide open inline below the button:
  - Last Name input + Audit Number input — use `.name-field-label` + `.name-field-input` styles from `court-booking.html`
  - `btn-crimson` `"Verify & Confirm"`
  - Mock validation: any non-empty last name + any non-empty audit number = success; set `MOCK_MEMBER.verified = true`
  - On failure (empty fields): inline error `"Please enter your last name and audit number."` in `var(--crimson)` `var(--font-body)` 13px
- If already verified (`MOCK_MEMBER.verified === true`): skip verification, proceed directly to success

**Race condition simulation:**
On confirm, generate a random number. If `Math.random() < 0.10` (10% chance):
- Do NOT restart flow
- Show inline error below confirm button: `"That time slot was just booked. Please select a different time."` in `var(--crimson)` `var(--font-body)` 13px
- Add `border: 2px solid var(--crimson)` to the Step A3 summary bar
- Smooth-scroll to Step A3
- Re-expand Step A3 for re-selection; clear A3 selection state only (keep coach and family member)

**Success state:**
Replace confirmation card content with:
- A crimson circle checkmark: CSS-drawn circle `56px`, border `2px solid var(--crimson)`, centered `✓` in `var(--crimson)` `var(--font-display)` 28px. Scale-in animation: `transform: scale(0.6)→scale(1)`, `0.4s ease`
- `"Booking Confirmed"` — `var(--font-display)` 28px weight 400, margin-top `20px`
- Summary lines (coach, date, time, duration, member name) — `var(--font-body)` 14px `var(--mid-gray)`
- `"A confirmation has been sent."` — `var(--font-body)` 14px `var(--mid-gray)` italic, margin-top `8px`
- Two buttons side by side, margin-top `28px`: `btn-crimson` `"Book Another Lesson"` (resets entire flow back to Section 3 path selector, clears all state) | `btn-light` `"Done"` (smooth-scrolls to top of page)
- Immediately add a new card to the Upcoming tab in Section 2 (no page reload)

---

### FLOW B — DATE-FIRST PATH

Same step cards as Flow A but reordered:

**Step B1 — Select a Date** (identical to A2)
**Step B2 — Select a Time Slot Grid** (identical to A3 — show all 4 coaches as columns)
**Step B3 — Select a Coach**
- Filter: show ONLY coaches who have the selected slot marked as available (not taken, not unavailable)
- Display as the same coach card grid as A1
- If zero coaches are available for that slot, show the empty state (see below) instead of any cards
- Do NOT show greyed-out unavailable coaches in this step — hide them entirely

**Empty state for Step B3:**
Centered in the step card:
- `"No coaches are available for that time slot."` — `var(--font-body)` 15px `var(--mid-gray)` italic
- Below: `"← Try another time"` — `var(--font-ui)` 12px `var(--crimson)` uppercase cursor pointer. On click: re-expand Step B2, clear B3 onward.

**Step B4 — Select Family Member** (identical to A4)
**Step B5 — Review & Confirm** (identical to A5)

---

## MOBILE BEHAVIOR

### At `max-width: 768px`
- Path selector cards: stack to 1-column grid
- Coach card row: 2-column CSS grid (not horizontal scroll)
- Time slot grid: `overflow-x: auto` horizontal scroll; time label column: `position: sticky; left: 0; background: white; z-index: 2`
- Lesson history cards: cancel button moves below middle column; right column hidden
- Booking summary grid: collapse to single column
- Nav: `.nav-link-group` hidden, hamburger visible (same as `court-booking.html`)

### At `max-width: 600px`
- Slim hero `h1`: `font-size: 36px`
- Step cards: padding `24px 20px`
- Tab pills: full width, equal flex

---

## MOCK DATA — COMPLETE REFERENCE (one JS block at bottom of `<body>`)

```js
// <!-- TBD: non-response behavior on SMS confirmation (auto-cancel, keep, or flag?) — confirm with Kevin -->
// <!-- TBD: confirm whether coach rates should ever be visible to members — confirm with Kevin -->

const COACHES = [
  { id: 'c1', name: 'Kevin Doyle',     photo: 'NYAC.Website.Photos/Coach.Kevin.Doyle.png' },
  { id: 'c2', name: 'Maria Santos',    photo: 'NYAC.Website.Photos/Coach.Maria.Santos.png' },
  { id: 'c3', name: 'James Whitfield', photo: 'NYAC.Website.Photos/Coach.James.Whitfield.png' },
  { id: 'c4', name: 'Priya Nair',      photo: 'NYAC.Website.Photos/Coach.Priya.Nair.png' },
];

const FAMILY_MEMBERS = [
  { id: 'f1', name: 'John Smith',  relation: 'Member', dob: null },
  { id: 'f2', name: 'Sarah Smith', relation: 'Spouse', dob: null },
  { id: 'f3', name: 'Emma Smith',  relation: 'Child',  dob: '2014-03-15' },
  { id: 'f4', name: 'Liam Smith',  relation: 'Child',  dob: '2009-07-22' },
];

// Compute relative dates dynamically — never hardcode calendar dates
function daysFromToday(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

const MOCK_LESSONS_UPCOMING = [
  { id: 'l1', coachName: 'Kevin Doyle',     familyMember: 'John Smith',  date: daysFromToday(3),  startTime: '10:00 AM', duration: '60 min' },
  { id: 'l2', coachName: 'Maria Santos',    familyMember: 'Emma Smith',  date: daysFromToday(7),  startTime: '2:00 PM',  duration: '30 min' },
  { id: 'l3', coachName: 'James Whitfield', familyMember: 'Sarah Smith', date: daysFromToday(10), startTime: '9:00 AM',  duration: '60 min' },
];

const MOCK_LESSONS_PAST = [
  { id: 'l4', coachName: 'Kevin Doyle', familyMember: 'John Smith', date: daysFromToday(-5),  startTime: '11:00 AM', duration: '60 min' },
  { id: 'l5', coachName: 'Priya Nair',  familyMember: 'Liam Smith', date: daysFromToday(-12), startTime: '4:00 PM',  duration: '30 min' },
];

const MOCK_COACH_UNAVAILABILITY = [
  { coachId: 'c3', date: daysFromToday(2).toISOString().split('T')[0] },
];

const MOCK_MEMBER = {
  auditNumber: '12345',
  lastName: 'Smith',
  parentEmail: null,
  verified: false,
};

// Seeded pseudo-random (same pattern as court-booking.html)
function seededRandom(seed) {
  let s = 0;
  for (let i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) & 0xffffffff;
  return function() {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}
```

---

## FINAL CHECKLIST — VERIFY BEFORE SUBMITTING CODE

- [ ] Nav matches `court-booking.html` exactly — `private-lessons.html` link is `.active`
- [ ] Footer matches `court-booking.html` exactly
- [ ] Slim hero matches `court-booking.html` structure exactly — title is `"Private Lessons"`, location line is `"NYAC Travers Island"`
- [ ] No modals, overlays, or popups anywhere on the page
- [ ] No pricing or rate information anywhere on the page
- [ ] Coach cards show name + photo only — nothing else below the name
- [ ] Taken time slots are visually greyed out (not hidden) in the grid
- [ ] Unavailable coaches in Flow B Step B3 are hidden entirely (not greyed)
- [ ] Unavailable coaches in Flow A Step A3 remain as columns but are fully greyed/non-interactive
- [ ] Lessons view shows all family members' upcoming + past lessons combined
- [ ] Cancel button available on all upcoming lessons with no cutoff restriction
- [ ] Parent email entered during child booking is saved to `MOCK_MEMBER.parentEmail`
- [ ] Empty state for no coaches (Flow B Step B3) includes `"← Try another time"` link
- [ ] All 4 TBD items have both an HTML comment and a visible placeholder in the UI
- [ ] All dates computed dynamically via `daysFromToday()` — no hardcoded calendar dates
- [ ] Mobile responsive at 768px and 600px breakpoints
- [ ] Page title is `"Private Lessons — NYAC Travers Island Tennis"`
- [ ] Step reveal uses opacity + translateY animation, `0.35s ease`
- [ ] Success checkmark uses scale animation `0.6→1.0`, `0.4s ease`
- [ ] New booking immediately appended to Upcoming tab after success — no page reload
