# Private Lessons Page — Full Rebuild Prompt V2
**File to edit:** `private-lessons.html`
**Reference files (do not modify):** `court-booking.html`, `index.html`

---

## STRICT CONSTRAINTS — READ FIRST

1. Preserve all CSS variables (`--crimson`, `--crimson-dk`, `--white`, `--off-white`, `--dark`, `--mid-gray`, `--light-gray`, `--charcoal`).
2. Preserve all font families (`--font-display`, `--font-label`, `--font-ui`, `--font-body`) and the Google Fonts import link.
3. Preserve the nav (`#main-nav`), footer (`#site-footer`), and hero (`#slim-hero`) exactly — change nothing inside them.
4. Preserve all `.btn-crimson`, `.btn-ghost`, `.btn-light` class definitions exactly.
5. Preserve `.divider-crimson` class.
6. Preserve all existing mock data arrays and utility functions verbatim (listed in the Mock Data section below).
7. Filter pill / tray components must match `court-booking.html` exactly — same class names, same dropdown tray pattern, same chevron SVG, same `tray-in` keyframe animation.
8. Available slot cells: green fill `rgba(34,139,34,0.18)`, border `1px solid #228B22`. Unavailable: fill `#F0EEEB`, border `1px solid #C8C4BE`. Selected: fill `rgba(255,140,0,0.35)`, border `1px solid #FF8C00`.
9. Do not add any new external dependencies.
10. Ignore mobile/responsive — do not add or change any mobile CSS.
11. Change absolutely nothing that is not explicitly specified in this prompt.

---

## FULL PAGE STRUCTURE (top to bottom)

```
#main-nav          ← unchanged
#slim-hero         ← unchanged
#verification-gate ← NEW: large centered panel before login; slim strip after login
#booking-entry     ← HIDDEN until verified; path selector cards
#booking-flow-section ← HIDDEN until verified; active flow renders here
#lessons-section   ← HIDDEN until verified; upcoming/past lessons
#site-footer       ← unchanged
```

Remove the existing `#verify-modal-backdrop` and `#verify-modal` entirely.

---

## SECTION 1 — VERIFICATION GATE

### 1A — Pre-verification: Large Centered Panel

HTML id: `#verification-gate`

Before the user verifies, this section renders as a large centered card that fills the viewport height below the hero, visually blocking all other content (which is `display:none`).

**Outer section styling:**
- `background: var(--off-white)`
- `min-height: 60vh`
- `display: flex; align-items: center; justify-content: center`
- `padding: 80px 40px`
- `border-bottom: 1px solid var(--light-gray)`

**Inner card styling** (id: `#verify-card`):
- `background: var(--white)`
- `border: 1px solid var(--light-gray)`
- `padding: 56px 64px`
- `max-width: 480px; width: 100%`
- `text-align: center`

**Card contents (top to bottom):**
1. Small label: `"Member Access"` — `var(--font-label)`, 12px, weight 600, `var(--crimson)`, uppercase, letter-spacing 0.18em, margin-bottom 12px.
2. Heading: `"Welcome to Travers Island Tennis"` — `var(--font-display)`, 28px, weight 400, `var(--dark)`, line-height 1.3, margin-bottom 8px.
3. Subtext: `"Please enter your audit number and last name to access lesson booking and your lesson history."` — `var(--font-body)`, 14px, `var(--mid-gray)`, line-height 1.7, margin-bottom 32px.
4. Two input fields (stacked, full width, left-aligned labels):
   - Audit # field: `id="gate-audit"`, `inputmode="numeric"`, `autocomplete="off"`
   - Last Name field: `id="gate-last-name"`, `autocomplete="family-name"`
   - Label styling: `var(--font-ui)`, 11px, weight 500, `var(--mid-gray)`, uppercase, letter-spacing 0.16em, `display:block`, margin-bottom 8px.
   - Input styling: match `.name-field-input` from court-booking.html exactly (`border: none; border-bottom: 1px solid var(--light-gray); padding: 10px 0; width: 100%; font-family: var(--font-body); font-size: 15px; background: transparent; outline: none;`). On focus: `border-bottom-color: var(--crimson)`.
   - Each field wrapped in a `.gate-field-group` div, `margin-bottom: 20px`, `text-align: left`.
5. Error message: `id="gate-error"`, hidden by default. `var(--font-body)`, 13px, `var(--crimson)`, margin-bottom 16px. Text: `"Audit number or last name not recognised. Please try again."`. Show via `display:block` on failed attempt.
6. Continue button: `class="btn-crimson"`, full width (`width:100%`), text: `"Continue"`, `id="gate-continue-btn"`.

### 1B — Post-verification: Slim Persistent Strip

When verification succeeds, replace the large card with a slim strip that stays in place for the session.

**Strip HTML id:** `#verify-strip` (initially `display:none`)

**Styling:**
- `background: var(--off-white)`
- `border-bottom: 1px solid var(--light-gray)`
- `padding: 14px 40px`
- `display: flex; align-items: center; justify-content: space-between`
- Max-width inner container: `max-width: 1100px; margin: 0 auto; width: 100%; display: flex; align-items: center; justify-content: space-between`

**Left side content:**
- A small checkmark icon: `✓` in `var(--crimson)`, `var(--font-ui)`, 13px, margin-right 10px.
- Text: `"Verified · [LastName], Audit #[AuditNumber]"` — `var(--font-ui)`, 13px, weight 500, `var(--dark)`, letter-spacing 0.06em. Populate dynamically from entered values using `id="strip-name-display"`.

**Right side content:**
- A plain text link/button: `"Sign Out"` — `var(--font-ui)`, 11px, uppercase, letter-spacing 0.12em, `var(--mid-gray)`, no border, no background, cursor pointer. `id="strip-sign-out-btn"`.

### 1C — JavaScript Verification Logic

```javascript
// Existing mock member data — keep unchanged
const MOCK_MEMBER = { auditNumber: '12345', lastName: 'Smith', verified: false };

document.getElementById('gate-continue-btn').addEventListener('click', doGateVerify);
document.getElementById('gate-last-name').addEventListener('keydown', e => { if (e.key === 'Enter') doGateVerify(); });
document.getElementById('gate-audit').addEventListener('keydown', e => { if (e.key === 'Enter') doGateVerify(); });

function doGateVerify() {
  const audit = document.getElementById('gate-audit').value.trim();
  const last  = document.getElementById('gate-last-name').value.trim();
  const error = document.getElementById('gate-error');

  if (audit === MOCK_MEMBER.auditNumber && last.toLowerCase() === MOCK_MEMBER.lastName.toLowerCase()) {
    MOCK_MEMBER.verified = true;
    // Hide large card, show slim strip
    document.getElementById('verify-card').style.display = 'none';
    document.getElementById('verify-strip').style.display = 'block'; // will be replaced by flex via inline style below
    document.getElementById('verify-strip').style.display = 'flex';
    document.getElementById('verification-gate').style.minHeight = 'auto';
    document.getElementById('verification-gate').style.padding = '0';
    document.getElementById('verification-gate').style.alignItems = 'stretch';
    document.getElementById('verification-gate').style.justifyContent = 'stretch';
    document.getElementById('verification-gate').style.background = 'none';
    document.getElementById('verification-gate').style.borderBottom = 'none';
    // Populate strip
    document.getElementById('strip-name-display').textContent =
      last.charAt(0).toUpperCase() + last.slice(1).toLowerCase() +
      ', Audit #' + audit;
    // Unlock page sections
    document.getElementById('booking-entry').style.display = 'block';
    document.getElementById('booking-flow-section').style.display = 'none'; // shown only when flow starts
    document.getElementById('lessons-section').style.display = 'block';
    renderLessonsView();
    error.style.display = 'none';
  } else {
    error.style.display = 'block';
  }
}

document.getElementById('strip-sign-out-btn').addEventListener('click', function() {
  MOCK_MEMBER.verified = false;
  // Reset gate back to large card
  document.getElementById('verify-strip').style.display = 'none';
  document.getElementById('verify-card').style.display = 'block';
  document.getElementById('verification-gate').style.minHeight = '60vh';
  document.getElementById('verification-gate').style.padding = '80px 40px';
  document.getElementById('verification-gate').style.alignItems = 'center';
  document.getElementById('verification-gate').style.justifyContent = 'center';
  document.getElementById('verification-gate').style.background = 'var(--off-white)';
  document.getElementById('verification-gate').style.borderBottom = '1px solid var(--light-gray)';
  document.getElementById('gate-audit').value = '';
  document.getElementById('gate-last-name').value = '';
  document.getElementById('gate-error').style.display = 'none';
  // Hide page sections
  document.getElementById('booking-entry').style.display = 'none';
  document.getElementById('booking-flow-section').style.display = 'none';
  document.getElementById('lessons-section').style.display = 'none';
  resetToPathSelector();
});
```

**Initial page load state:**
- `#booking-entry`: `display: none`
- `#booking-flow-section`: `display: none`
- `#lessons-section`: `display: none`
- `#verify-strip`: `display: none`
- `#verify-card`: `display: block` (visible inside the gate)

---

## SECTION 2 — BOOK A LESSON (Path Selector)

HTML id: `#booking-entry`. Hidden on load, shown after verification.

Keep the existing two path cards exactly:
- **Browse by Coach** card — `onclick="startFlow('coach')"`
- **Browse by Date** card — `onclick="startFlow('date')"`

Keep the existing `#back-link` button (`"← Change search method"`). It calls `resetToPathSelector()`.

Keep the existing `resetToPathSelector()` function. Update it so it also hides `#booking-flow-section`.

---

## SECTION 3 — BOOKING FLOW SECTION

HTML id: `#booking-flow-section`. Hidden on load. Shown when a path is selected. Contains `<div id="booking-flow"></div>` where all flow content is rendered.

---

## SECTION 4 — BROWSE BY DATE FLOW

Triggered by `startFlow('date')`. Renders inside `#booking-flow`.

### 4A — Filter Bar

Render a `<div id="pl-filter-bar">` matching `court-booking.html`'s `#filter-bar` CSS exactly. Use these class names verbatim: `.filter-row`, `.filter-group`, `.filter-label`, `.filter-pill`, `.clear-filters-btn`.

Copy the `#filter-bar` CSS block from `court-booking.html` but scope it to `#pl-filter-bar` to avoid conflicts.

**Two filters only (no Duration):**

**Date filter:**
- Label: `DATE`
- Collapsed pill (`id="pl-date-selected-pill"`) with label span (`id="pl-date-selected-label"`, default text `"Select"`) + chevron SVG (`id="pl-date-chevron"`).
- Tray (`id="pl-date-expanded-tray"`, `display:none` by default): 14 date pills generated by JS (today through today+13). Show 5 visible at a time with scroll (`max-height: 205px; overflow-y: auto`).
- Each pill is `.date-tray-pill` class. Shows: `<span class="date-tray-pill-day">` (weekday abbr, or "TODAY" for index 0) + `<span class="date-tray-pill-num">` (date number).
- On select: collapse tray, update label to `"DayAbbr · Mon D"` (e.g. `"Mon · Apr 7"`), call `renderDateGrid()`.

**Start Time filter:**
- Label: `START TIME`
- Same collapsed pill + tray pattern. `id="pl-time-selected-pill"`, label `id="pl-time-selected-label"` default `"Select"`, chevron `id="pl-time-chevron"`, tray `id="pl-time-expanded-tray"`.
- Tray pills: 8:00 AM through 7:00 PM in 30-min increments. Each pill shows formatted time (e.g. `"8:00 AM"`).
- On select: collapse tray, update label, call `renderDateGrid()`.

**Clear button:** `.clear-filters-btn`, `id="pl-clear-btn"`. Resets both filter selections, resets pill labels to `"Select"`, calls `renderDateGrid()` which re-shows the overlay.

**Chevron toggle behavior:** Clicking a pill button opens its tray and closes all other trays. Rotate chevron 180° when open (class `open` on chevron). Click outside closes all trays.

### 4B — Date Grid Layout

Below the filter bar, a flex row layout:

```
.pl-grid-layout {
  display: flex;
  align-items: flex-start;
  gap: 24px;
  margin-top: 24px;
}
```

**Left: Grid wrapper** (`flex: 1; overflow-x: auto; position: relative`)

The grid is a `<table id="pl-date-grid">`:

- `border-collapse: collapse`
- `width: 100%`
- `table-layout: fixed`

**thead:** One `<tr>`. First `<th>` is blank, 80px wide, class `pl-time-col-header`. Then one `<th>` per coach (4 coaches from `COACHES` array). Coach `<th>` shows first name only in `var(--font-ui)` 12px weight 600 uppercase letter-spacing 0.1em. If coach is unavailable on selected date, dim to opacity 0.5 and append `<br><span style="font-size:10px;font-weight:400;text-transform:none;letter-spacing:0;">Unavailable</span>`.

**tbody:** One `<tr>` per 30-min slot from `08:00` to `19:00` (use `PL_SLOT_LABELS` — see Mock Data section). First `<td>` in each row is the time label (`.pl-time-label`): `var(--font-ui)` 11px `var(--mid-gray)`, right-aligned, padding-right 12px, no border, width 80px. Then one `<td class="pl-slot-cell">` per coach.

**Slot cell states:**
- No filters active → gray/neutral, no pointer, no color (overlay covers them anyway).
- Filters active, available (not taken, coach not unavailable, slot at or after selected start time): green fill `rgba(34,139,34,0.18)`, border `1px solid #228B22`, cursor pointer. Hover: `rgba(34,139,34,0.28)`.
- Filters active, unavailable (taken, OR coach fully unavailable, OR slot before selected start time): fill `#F0EEEB`, border `1px solid #C8C4BE`, cursor `not-allowed`.
- Selected: fill `rgba(255,140,0,0.35)`, border `1px solid #FF8C00`.
- Cell height: 36px. Transition: `background 0.15s ease, border-color 0.15s ease`.

**Overlay prompt** (`id="pl-grid-overlay"`):
- Position: `absolute`, `inset: 0`, `display: flex; align-items: center; justify-content: center`, `background: rgba(250,248,245,0.82)`, `pointer-events: none`, `z-index: 2`.
- Text: `"Select a date and start time above to view availability"` — `var(--font-body)`, italic, 15px, `var(--mid-gray)`, text-align center, max-width 280px.
- Show when date or start time is not selected. Hide once both are selected.

**On cell click (available cell):** Set `state.selectedCoachId`, `state.selectedSlot`, `state.selectedDateISO`. Remove `.pl-selected` from all cells, add to clicked cell. Call `renderDateBookingPanel()`.

**Right: Right-side panel** (`width: 260px; flex-shrink: 0; display: flex; flex-direction: column; gap: 16px`)

Two stacked boxes, both `background: var(--white); border: 1px solid var(--light-gray); padding: 24px`:

**Box 1 — How to Book (always visible):**
- Heading: `"How to Book"` — `.legend-heading` style (copy from court-booking: `var(--font-ui)` 10px weight 500 `var(--mid-gray)` uppercase letter-spacing 0.16em).
- `<hr class="legend-divider">` (copy style from court-booking).
- Ordered list, 3 items, `var(--font-body)` 13px `var(--dark)`, gap 8px between items:
  1. "Select a date using the filter above."
  2. "Choose a start time to reveal coach availability."
  3. "Click an available slot to begin your booking."

**Box 2 — Booking Summary panel** (`id="pl-date-booking-panel"`):
- Heading: `"Booking Summary"` — same `.legend-heading` style.
- `<hr class="legend-divider">`.
- Three steps rendered inside, only one visible at a time.

**Step 1 (default, id `pl-date-step-1`):**
- Placeholder when no slot selected: `"Select an available slot from the grid to begin."` — `var(--font-body)` italic 13px `var(--mid-gray)`.
- When slot selected, replace placeholder with a summary grid (`.booking-summary-row` style from court-booking):
  - Coach | [coach name]
  - Date  | [formatted date]
  - Time  | [formatted time]
- Below summary: `"Continue →"` `.btn-crimson` button, full width. `id="pl-date-step1-continue"`.
- Back arrow `←` (`.booking-back-btn`) top-left: clears selected slot, returns to placeholder.

**Step 2 (hidden, id `pl-date-step-2`):**
- Back arrow `←` returns to Step 1.
- Heading inside panel (not a box heading): `"Booking For"` — `.name-field-label` style.
- A `<select id="pl-family-select">` styled as: `width: 100%; border: none; border-bottom: 1px solid var(--light-gray); padding: 10px 0; font-family: var(--font-body); font-size: 15px; background: transparent; outline: none; cursor: pointer; margin-bottom: 24px`. Populate options from `FAMILY_MEMBERS` array.
- `"Confirm Booking"` `.btn-crimson` full width. `id="pl-date-confirm-btn"`.

**Step 3 (hidden, id `pl-date-step-3`):**
- Checkmark: `<div class="success-check"><span>✓</span></div>` (copy `.success-check` style from existing private-lessons.html).
- Heading: `"Lesson Booked!"` — `var(--font-display)` 22px weight 400 `var(--dark)` text-align center margin-bottom 12px.
- Detail lines (`.success-detail` style): Coach, Date, Time, Booked For — each on own line, `var(--font-body)` 13px `var(--mid-gray)` text-align center line-height 1.8.
- Two buttons stacked, full width, gap 8px:
  - `"Book Another"` `.btn-crimson` — resets to filter bar (clear selection, re-show overlay, return to Step 1 placeholder).
  - `"Close"` `.btn-light` — same as Book Another but also collapses the booking panel back to placeholder Step 1.
- On Step 3 render: push new lesson object into `upcomingLessons` array and call `renderLessonsView()`.

---

## SECTION 5 — BROWSE BY COACH FLOW

Triggered by `startFlow('coach')`. Renders inside `#booking-flow`.

### 5A — Coach Card Grid

Section heading: `"Select a Coach"` — `var(--font-display)` 26px weight 400 `var(--dark)`, margin-bottom 8px. Followed by `<hr class="divider-crimson">`, margin-bottom 28px.

Grid: `display: grid; grid-template-columns: 1fr 1fr; gap: 16px`. Id: `#pl-coach-grid`.

**Hardcode the following `COACHES_FULL` array in JS:**
```javascript
const COACHES_FULL = [
  { id: 'cf1', name: 'Sofia Marchetti',  role: 'Head Pro',                bio: 'USPTA-certified with 12 years of competitive experience, specializing in adult instruction and advanced stroke mechanics.',       photo: 'NYAC.Website.Photos/Coach.Kevin.Doyle.png'     },
  { id: 'cf2', name: 'Daniel Park',      role: 'Assistant Pro',           bio: 'Former Division I collegiate player, Daniel focuses on junior development and high-performance conditioning programs.',           photo: 'NYAC.Website.Photos/Coach.Maria.Santos.png'    },
  { id: 'cf3', name: 'Priya Nair',       role: 'Clinic Coordinator',      bio: 'A nationally ranked junior player in her youth, Priya now leads group clinics and beginner development for new members.',        photo: 'NYAC.Website.Photos/Coach.Priya.Nair.png'      },
  { id: 'cf4', name: 'James Whitfield',  role: 'Performance Coach',       bio: 'James specializes in competitive match preparation, fitness integration, and working with members who play USTA league tennis.', photo: 'NYAC.Website.Photos/Coach.James.Whitfield.png' },
  { id: 'cf5', name: 'Elena Vasquez',    role: 'Junior Academy Director', bio: 'Elena oversees the junior academy pipeline, coordinating year-round skill progression for players ages 8–18.',                  photo: 'NYAC.Website.Photos/Coach.Kevin.Doyle.png'     },
];
```

**Each coach card (`.pl-coach-card`):**
- `display: flex; align-items: flex-start; gap: 16px`
- `border: 1px solid var(--light-gray); padding: 20px; cursor: pointer; background: var(--white)`
- `transition: border-color 0.2s ease, box-shadow 0.2s ease`
- Hover: `border-color: var(--crimson); box-shadow: 0 2px 12px rgba(0,0,0,0.08)`

**Left — photo:**
- `<img>` 72px × 72px, `object-fit: cover`, `flex-shrink: 0`
- Fallback background `var(--light-gray)` if image fails

**Right — text (flex column, gap 4px):**
- Name: `var(--font-display)` 17px weight 600 `var(--dark)`
- Role: `var(--font-label)` 11px weight 600 `var(--crimson)` uppercase letter-spacing 0.14em
- Bio: `var(--font-body)` 13px `var(--mid-gray)` line-height 1.7 margin-top 4px

On click: call `selectCoach(coach)` which hides the coach grid and heading, renders the coach detail header and weekly grid below.

### 5B — Coach Detail Mini-Header

Rendered above the weekly grid after a coach is selected. Id: `#pl-coach-header`.

**Structure:**
```
<div id="pl-coach-header">
  <div class="pl-coach-header-inner">
    <div class="pl-coach-header-left">
      <img ...>  <!-- 56px × 56px circle -->
      <div class="pl-coach-header-text">
        <span class="pl-coach-header-name">Sofia Marchetti</span>
        <span class="pl-coach-header-role">Head Pro</span>
        <span class="pl-coach-header-bio">Bio text...</span>
      </div>
    </div>
    <button id="pl-change-coach-btn">← Change Coach</button>
  </div>
</div>
```

**Styling:**
- `#pl-coach-header`: `background: var(--off-white); border-top: 1px solid var(--light-gray); border-bottom: 1px solid var(--light-gray); padding: 20px 0; margin-bottom: 28px`
- `.pl-coach-header-inner`: `max-width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 20px`
- `.pl-coach-header-left`: `display: flex; align-items: center; gap: 16px`
- Coach photo: 56px × 56px, `border-radius: 50%`, `object-fit: cover`, `flex-shrink: 0`
- `.pl-coach-header-text`: `display: flex; flex-direction: column; gap: 2px`
- `.pl-coach-header-name`: `var(--font-display)` 18px weight 400 `var(--dark)`
- `.pl-coach-header-role`: `var(--font-label)` 11px weight 600 `var(--crimson)` uppercase letter-spacing 0.14em
- `.pl-coach-header-bio`: `var(--font-body)` 13px `var(--mid-gray)` line-height 1.6
- `#pl-change-coach-btn`: `var(--font-ui)` 11px uppercase letter-spacing 0.12em `var(--crimson)` background none border none cursor pointer flex-shrink 0. Hover: `var(--crimson-dk)`.

`#pl-change-coach-btn` click: hides `#pl-coach-header` and weekly grid/panel, re-shows coach grid and heading. Resets `state`.

### 5C — Week Navigation Bar

Below the coach header. Id: `#pl-week-nav`.

**Structure:**
```html
<div id="pl-week-nav">
  <button id="pl-week-prev" class="btn-light pl-week-btn">&#8592;</button>
  <span id="pl-week-label"></span>
  <button id="pl-week-next" class="btn-light pl-week-btn">&#8594;</button>
</div>
```

**Styling:**
- `#pl-week-nav`: `display: flex; align-items: center; justify-content: center; gap: 20px; margin-bottom: 20px`
- `.pl-week-btn`: same as `.btn-light` but `padding: 7px 16px; font-size: 16px`
- `#pl-week-label`: `var(--font-ui)` 13px weight 600 uppercase letter-spacing 0.12em `var(--dark)`

**Logic:**
- Two states: `weekOffset = 0` (this week) and `weekOffset = 1` (next week).
- `#pl-week-prev`: disabled (`opacity: 0.4; pointer-events: none; cursor: not-allowed`) when `weekOffset === 0`.
- `#pl-week-next`: disabled when `weekOffset === 1`.
- Label format: `"This Week · Apr 7 – Apr 13"` or `"Next Week · Apr 14 – Apr 20"`.
- "This week" = the Monday–Sunday of the current calendar week.
- Calculate week start as the most recent Monday on or before today.

```javascript
function getWeekStart(offset) {
  const today = new Date();
  today.setHours(0,0,0,0);
  const day = today.getDay(); // 0=Sun
  const diff = (day === 0) ? -6 : 1 - day; // shift to Monday
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff + (offset * 7));
  return monday;
}

function getWeekDays(offset) {
  const start = getWeekStart(offset);
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

function formatWeekLabel(offset) {
  const days = getWeekDays(offset);
  const start = days[0];
  const end = days[6];
  const fmt = d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const prefix = offset === 0 ? 'This Week' : 'Next Week';
  return `${prefix} · ${fmt(start)} – ${fmt(end)}`;
}
```

On arrow click: update `weekOffset`, update label, disable/enable arrows, re-render weekly grid.

### 5D — Coach Weekly Grid Layout

Same two-column flex layout as Browse by Date (Section 4B):

```
.pl-grid-layout (reuse same class)
  Left: grid wrapper (flex: 1, overflow-x: auto)
  Right: 260px panel (same two-box structure as Section 4B)
```

**Weekly grid table (`id="pl-coach-grid"`):**

- `border-collapse: collapse; width: 100%; table-layout: fixed`

**thead:** First `<th>` blank 80px. Then 7 `<th>` elements for Mon–Sun of current week offset. Each column header:
```
DayAbbr          ← var(--font-ui) 12px weight 700 uppercase, display block
Apr 7            ← var(--font-ui) 11px weight 400 var(--mid-gray), display block, margin-top 2px
```
If the date is in the past (before today): dim entire column header to `opacity: 0.4`.

**tbody:** One `<tr>` per slot in `PL_SLOT_LABELS` (08:00–19:00). First `<td>` is time label (same `.pl-time-label` style). Then 7 `<td class="pl-slot-cell">` elements.

**Slot cell states (same rules as Section 4B):**
- Past date (column date < today): always `#F0EEEB` fill, `#C8C4BE` border, cursor `not-allowed`.
- Available: green. Hover: darker green.
- Taken (from `getTakenSlots(selectedCoach.id, dateISO)`): gray.
- Selected: orange.

Render green/gray immediately on load — no overlay needed here.

**Right-side panel for weekly grid:**

Identical structure to Section 4B right panel (How to Book box + Booking Summary panel), but:
- How to Book text:
  1. "Browse this week or next week using the arrows above."
  2. "Click an available slot to select it."
  3. "Review your booking summary, then confirm."
- Summary rows: Coach (pre-filled, fixed), Date, Time.
- Steps 2 and 3 identical to Section 4B.
- Ids prefixed with `pl-coach-` to avoid conflicts: `pl-coach-step-1`, `pl-coach-step-2`, `pl-coach-step-3`, `pl-coach-family-select`, `pl-coach-confirm-btn`, etc.

---

## SECTION 6 — YOUR LESSONS

HTML id: `#lessons-section`. Hidden on load, shown after verification. No verification prompt inside — user is already verified.

**Placement:** Rendered below `#booking-entry` and `#booking-flow-section` in the DOM.

**Keep exactly:**
- `<h2 class="lessons-heading">Your Lessons</h2>` heading and `<hr class="divider-crimson">`.
- Tab pills (`#tab-upcoming`, `#tab-past`) and `switchTab()` function.
- `renderLessonsView()` function — remove the `if (!MOCK_MEMBER.verified)` branch entirely since verification is already handled at the gate.
- `buildLessonCard()`, `initCancel()`, `revertCancel()`, `confirmCancel()` functions — unchanged.
- All existing CSS for `.lesson-card`, `.lesson-date-col`, `.lesson-middle-col`, `.lesson-cancel-col`, `.cancel-btn`, `.cancel-confirm-row`, `.cancel-yes-btn`, `.cancel-keep-btn`, `.cancel-success-line`, `.tab-pill`, `.tab-pills`, `.lessons-placeholder`.

---

## MOCK DATA — PRESERVE VERBATIM

Keep all of the following unchanged:

```javascript
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
```

Keep `MOCK_LESSONS_UPCOMING`, `MOCK_LESSONS_PAST`, `MOCK_COACH_UNAVAILABILITY`, `seededRandom()`, `strSeed()`, `getTakenSlots()`, `isCoachUnavailable()`, `formatDateKey()`, `formatDateLong()`, `slotLabel24to12()`, `daysFromToday()` — all unchanged.

**Add this new constant:**
```javascript
// 30-min slots from 08:00 to 19:00 inclusive
const PL_SLOT_LABELS = [];
for (let h = 8; h <= 19; h++) {
  PL_SLOT_LABELS.push(`${String(h).padStart(2,'0')}:00`);
  if (h < 19) PL_SLOT_LABELS.push(`${String(h).padStart(2,'0')}:30`);
}
// Results in: 08:00, 08:30, 09:00 ... 18:30, 19:00
```

---

## WHAT NOT TO CHANGE (complete list)

- `#main-nav` and all nav JS
- `#site-footer`
- `#slim-hero`
- All CSS variable declarations in `:root`
- Google Fonts `<link>` tag
- `.btn-crimson`, `.btn-ghost`, `.btn-light` CSS classes
- `.divider-crimson` CSS class
- All mock data arrays and utility functions (see above)
- The `state` object shape and `resetState()` function
- The `startFlow()` function structure (update only to add `#booking-flow-section` visibility toggle)
- The `#back-link` button and `resetToPathSelector()` function
- All lesson card CSS and JS functions
