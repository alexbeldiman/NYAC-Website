# Private Lessons Page — Booking UI Overhaul Prompt
**File:** `private-lessons-1.html`
**Scope:** Targeted surgical changes only. Change ABSOLUTELY NOTHING outside of what is listed below.

---

## STRICT CONSTRAINTS
- Do NOT change any nav, footer, hero, verification gate, CSS variables, fonts, or color palette
- Do NOT change the `COACHES`, `COACHES_FULL`, `FAMILY_MEMBERS`, mock data, or `getTakenSlots` / `isCoachUnavailable` logic
- Do NOT change the coach selection card grid UI (the 2-col grid of coach cards shown before a coach is chosen)
- Do NOT change the coach header strip (`#pl-coach-header`) that appears after a coach is selected
- Do NOT change the week nav (`#pl-week-nav`) or `getWeekDays` / `updateWeekNav` / `formatWeekLabel` logic
- Do NOT change the filter bar (`#pl-filter-bar`) in the Browse by Date flow or the date/time tray dropdowns
- Do NOT add, remove, or restructure any HTML sections outside of `#booking-entry`, `#booking-flow-section`, and `#lessons-section`
- Preserve ALL existing CSS variable names and all existing class names not explicitly replaced below
- Make every change listed below completely and exactly

---

## CHANGE 1 — Remove "Your Lessons" section entirely

Remove the entire `#lessons-section` HTML block (the section containing "Your Lessons", the tab pills for Upcoming/Past, and `#lessons-list`).

Also remove these JS functions and all references to them:
- `renderLessonsView()`
- `switchTab()`
- `buildLessonCard()`
- `initCancel()`
- `revertCancel()`
- `confirmCancel()`

Remove these JS variables:
- `currentTab`
- `upcomingLessons`
- `MOCK_LESSONS_UPCOMING`
- `MOCK_LESSONS_PAST`

Remove all calls to `renderLessonsView()` anywhere in the file (they appear inside `doGateVerify()` and inside `showCoachStep3()` and `showDateStep3()`).

Remove all CSS rules for: `.lessons-heading`, `.lessons-placeholder`, `.tab-pills`, `.tab-pill`, `.lesson-card`, `.lesson-date-num`, `.lesson-date-day`, `.lesson-coach-name`, `.lesson-with`, `.lesson-meta`, `.lesson-cancel-col`, `.cancel-btn`, `.cancel-confirm-row`, `.cancel-confirm-text`, `.cancel-yes-btn`, `.cancel-keep-btn`, `.cancel-success-line`.

---

## CHANGE 2 — Path selector: replace cards with flow content, move back button

**Current behavior:** When a flow starts, `#path-cards` hides and a `← Change search method` link appears at the top-left of `#booking-entry`.

**New behavior:**
- When a flow starts, `#path-cards` hides exactly as it does now (no change there)
- Remove the existing `<button class="back-link" id="back-link">` element from the HTML entirely
- In the top-right of the `#booking-entry` section header area (same row as the "Book a Lesson" `<h2>` and `<hr class="divider-crimson">`), add a new button: `<button id="pl-change-selection-btn" style="display:none;">← Change Selection</button>`
- Style `#pl-change-selection-btn` exactly like `#pl-change-coach-btn`: `font-family: var(--font-ui); font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: var(--crimson); background: none; border: none; cursor: pointer;`
- Position it to the right of the heading: wrap the `<h2>` and the new button together in a flex row div with `justify-content: space-between; align-items: center;` — the `<hr class="divider-crimson">` stays below this row
- Show `#pl-change-selection-btn` (set `display: inline-block`) when `startFlow()` is called
- Hide it (set `display: none`) when `resetToPathSelector()` is called
- Wire it: clicking it calls `resetToPathSelector()`
- Remove all JS references to the old `back-link` element

---

## CHANGE 3 — Grid: hours only (remove :30 rows)

Change `PL_SLOT_LABELS` generation from:
```js
for (let h = 8; h <= 19; h++) {
  PL_SLOT_LABELS.push(`${String(h).padStart(2,'0')}:00`);
  if (h < 19) PL_SLOT_LABELS.push(`${String(h).padStart(2,'0')}:30`);
}
```
To:
```js
for (let h = 8; h <= 19; h++) {
  PL_SLOT_LABELS.push(`${String(h).padStart(2,'0')}:00`);
}
```
This produces 12 rows: 8:00 AM through 7:00 PM, no half-hour increments.

---

## CHANGE 4 — Grid visual: wider, gapped cells, rounded corners

**A. Wider grid wrapper**
Change `.pl-grid-wrapper` CSS: increase `max-width` from its current value to `820px` (or remove any max-width cap if none exists and instead set `flex: 1 1 820px`).

**B. Cell gaps**
In the `<table>` elements (`#pl-date-grid` and `#pl-coach-grid-table`), add `border-collapse: separate; border-spacing: 4px;` via CSS on `#pl-date-grid, #pl-coach-grid-table`.

Remove any existing `border-collapse: collapse` on these tables.

**C. Rounded corners on cells**
Add to `.pl-slot-cell` CSS: `border-radius: 4px;`

**D. Row height**
Since there are now only 12 rows (vs 23 before), increase the row height so the grid doesn't look too short. Add to `.pl-slot-cell` CSS: `height: 42px;`

---

## CHANGE 5 — Click flow: inline popup below cell → confirmation panel

### Remove old step logic from both flows

**Browse by Coach flow:**
- Delete functions: `showCoachStep1()`, `showCoachStep3()`, `resetCoachPanel()`
- In `buildCoachRightPanel()`: replace the entire contents of `summaryBox` (the `#pl-coach-booking-panel` box) with this static visual-only display:
```html
<span class="legend-heading">Booking Summary</span>
<hr class="legend-divider">
<div id="pl-coach-summary-display">
  <div class="booking-summary-row" id="pl-coach-summary-visual">
    <span class="summary-label">Coach</span><span class="summary-value" id="pl-coach-summary-coach-val">—</span>
    <span class="summary-label">Date</span><span class="summary-value" id="pl-coach-summary-date-val">—</span>
    <span class="summary-label">Time</span><span class="summary-value" id="pl-coach-summary-time-val">—</span>
    <span class="summary-label">Duration</span><span class="summary-value">60 min</span>
  </div>
</div>
```
- When a coach is selected (inside `selectCoach()`), immediately set `#pl-coach-summary-coach-val` text to `coach.name`. Date and Time remain `—`.
- Remove the `setTimeout` wiring block that wired `pl-coach-step1-back`, `pl-coach-step2-back`, `pl-coach-step1-continue`, `pl-coach-confirm-btn` — these no longer exist.

**Browse by Date flow:**
- Delete functions: `showDateStep1()`, `showDateStep3()`, `resetDatePanel()`
- In `buildDateRightPanel()`: replace the entire contents of `summaryBox` (the `#pl-date-booking-panel` box) with this static visual-only display:
```html
<span class="legend-heading">Booking Summary</span>
<hr class="legend-divider">
<div id="pl-date-summary-display">
  <div class="booking-summary-row" id="pl-date-summary-visual">
    <span class="summary-label">Coach</span><span class="summary-value" id="pl-date-summary-coach-val">—</span>
    <span class="summary-label">Date</span><span class="summary-value" id="pl-date-summary-date-val">—</span>
    <span class="summary-label">Time</span><span class="summary-value" id="pl-date-summary-time-val">—</span>
    <span class="summary-label">Duration</span><span class="summary-value">60 min</span>
  </div>
</div>
```
- Remove the `setTimeout` wiring block that wired `pl-date-step1-back`, `pl-date-step2-back`, `pl-date-step1-continue`, `pl-date-confirm-btn` — these no longer exist.

---

### New 3-stage click flow (implement for BOTH grids)

**Stage 1 — Inline mini-popup below the clicked cell**

When a `.pl-avail` cell is clicked:

1. Mark the cell as selected (add class `pl-selected`, remove `pl-avail`)
2. Close any other open inline popup (remove any existing `#pl-inline-popup` from the DOM)
3. Inject a `<div id="pl-inline-popup">` into the DOM positioned immediately after the clicked cell's parent `<tr>` as a new `<tr>` containing a single `<td colspan="[total columns]">` with the popup content inside
4. Popup content:
```html
<div class="pl-inline-popup-inner">
  <span class="pl-inline-popup-label">[TIME] · [DAY, MONTH DATE] · 60 min</span>
  <div class="pl-inline-popup-actions">
    <button class="btn-crimson pl-inline-confirm-btn">Confirm</button>
    <button class="pl-inline-cancel-btn">Cancel</button>
  </div>
</div>
```
Where `[TIME]` is the formatted slot time, `[DAY, MONTH DATE]` is the formatted date.

5. Style `.pl-inline-popup-inner`:
```css
.pl-inline-popup-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: var(--off-white);
  border: 1px solid var(--light-gray);
  border-top: 2px solid var(--crimson);
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--dark);
}
.pl-inline-popup-label {
  font-style: italic;
  color: var(--mid-gray);
}
.pl-inline-popup-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}
.pl-inline-confirm-btn {
  padding: 8px 20px;
  font-size: 11px;
}
.pl-inline-cancel-btn {
  font-family: var(--font-ui);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--mid-gray);
  background: none;
  border: none;
  cursor: pointer;
}
.pl-inline-cancel-btn:hover { color: var(--dark); }
```

6. **Cancel button** on the popup:
   - Remove `#pl-inline-popup` from the DOM
   - Deselect the cell (remove `pl-selected`, add `pl-avail`, restore its click handler)
   - For coach flow: set `coachSelectedSlot = null; coachSelectedDateISO = null;`
   - For date flow: set `dateSelectedCoachId = null; dateSelectedSlot = null; dateSelectedDateISO = null;`
   - Update the booking summary visual back to `—` for Date and Time (coach name stays in coach flow)

7. **Confirm button** on the popup:
   - Remove `#pl-inline-popup` from the DOM
   - Store the selection in state (already stored when cell was clicked)
   - Update the right-panel booking summary visual: fill in coach name, date, time
   - Hide the entire grid layout area (`#pl-coach-grid-layout` or the date flow's `.pl-grid-layout`) using `style.display = 'none'`
   - Also hide the week nav (`#pl-week-nav`) if in coach flow, or the filter bar (`#pl-filter-bar`) if in date flow
   - Scroll down to `#pl-confirmation-panel` (smooth)
   - Show and populate `#pl-confirmation-panel` (see Stage 2 below)

---

**Stage 2 — Full confirmation panel**

Add a new `<div id="pl-confirmation-panel" style="display:none;">` to the HTML, placed inside `#booking-flow-section > .section-inner`, after `#booking-flow`.

Style `#pl-confirmation-panel`:
```css
#pl-confirmation-panel {
  max-width: 560px;
  margin: 40px auto 0;
  background: var(--off-white);
  border: 1px solid var(--light-gray);
  border-top: 3px solid var(--crimson);
  padding: 36px 40px;
}
.pl-confirm-heading {
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 400;
  color: var(--dark);
  margin-bottom: 6px;
}
.pl-confirm-subtext {
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--mid-gray);
  font-style: italic;
  margin-bottom: 24px;
}
.pl-confirm-details {
  display: grid;
  grid-template-columns: 100px 1fr;
  gap: 10px 0;
  margin-bottom: 28px;
}
.pl-confirm-label {
  font-family: var(--font-ui);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--mid-gray);
  padding-top: 2px;
}
.pl-confirm-value {
  font-family: var(--font-body);
  font-size: 15px;
  color: var(--dark);
}
.pl-confirm-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}
```

When Stage 2 is triggered, populate and show `#pl-confirmation-panel` with:
```html
<h3 class="pl-confirm-heading">Confirm Your Lesson</h3>
<p class="pl-confirm-subtext">Please review the details below before confirming.</p>
<div class="pl-confirm-details">
  <span class="pl-confirm-label">Coach</span><span class="pl-confirm-value">[COACH NAME]</span>
  <span class="pl-confirm-label">Date</span><span class="pl-confirm-value">[DATE LONG]</span>
  <span class="pl-confirm-label">Time</span><span class="pl-confirm-value">[TIME]</span>
  <span class="pl-confirm-label">Duration</span><span class="pl-confirm-value">60 minutes</span>
</div>
<div class="pl-confirm-actions">
  <button class="btn-crimson" id="pl-final-confirm-btn">Confirm Booking</button>
  <button class="btn-light" id="pl-final-cancel-btn">Cancel</button>
</div>
```

Wire `#pl-final-cancel-btn`:
- Hide `#pl-confirmation-panel` (`style.display = 'none'`)
- Show the grid layout again (`#pl-coach-grid-layout` or the date `.pl-grid-layout`)
- Show week nav again if coach flow, or filter bar again if date flow
- Deselect the cell: re-render the grid (call `renderCoachWeekGrid()` or `renderDateGrid()`)
- Reset the right panel summary to `—` for Date and Time
- Scroll back up to `#booking-flow-section` (smooth)

Wire `#pl-final-confirm-btn`:
- Hide `#pl-confirmation-panel`
- Show success state inside `#pl-confirmation-panel` (replace its contents):
```html
<div class="success-check"><span>✓</span></div>
<h3 style="font-family:var(--font-display);font-size:22px;font-weight:400;color:var(--dark);text-align:center;margin-bottom:12px;">Lesson Booked!</h3>
<div class="success-detail">
  [COACH NAME]<br>[DATE LONG]<br>[TIME]<br>60 minutes
</div>
<div style="display:flex;flex-direction:column;gap:8px;margin-top:24px;">
  <button class="btn-crimson" id="pl-book-another-btn" style="width:100%;">Book Another Lesson</button>
</div>
```
- Show `#pl-confirmation-panel` again with the success content

Wire `#pl-book-another-btn`:
- Hide `#pl-confirmation-panel`
- Call `resetToPathSelector()` to return to the two path-choice cards

---

## CHANGE 6 — Browse by Date: `showCoachStep1` call replacement

In `renderDateGrid()`, where a cell click previously called `showDateStep1()`, replace that call with the new inline popup logic from Change 5 (Stage 1, Date flow variant).

In `renderCoachWeekGrid()`, where a cell click previously called `showCoachStep1()`, replace that call with the new inline popup logic from Change 5 (Stage 1, Coach flow variant).

---

## SUMMARY OF ALL TOUCHES

| What | Where |
|---|---|
| Remove `#lessons-section` HTML | HTML body |
| Remove lessons CSS classes | `<style>` block |
| Remove lessons JS functions + vars | `<script>` block |
| Remove old `#back-link` button | `#booking-entry` HTML |
| Add `#pl-change-selection-btn` | `#booking-entry` HTML, `startFlow()`, `resetToPathSelector()` |
| Change `PL_SLOT_LABELS` to hours-only | `<script>` |
| Add `border-spacing: 4px`, `border-collapse: separate` to grid tables | CSS |
| Add `border-radius: 4px`, `height: 42px` to `.pl-slot-cell` | CSS |
| Increase `.pl-grid-wrapper` width | CSS |
| Replace right-panel summary boxes with visual-only displays | `buildCoachRightPanel()`, `buildDateRightPanel()` |
| Remove old step functions | `<script>` |
| Add inline popup row logic | `renderCoachWeekGrid()`, `renderDateGrid()` cell click handlers |
| Add `#pl-confirmation-panel` to HTML | `#booking-flow-section` |
| Add confirmation panel CSS | `<style>` |
| Wire confirm/cancel/success/book-another | `<script>` |
| Update `selectCoach()` to pre-fill coach name in summary | `selectCoach()` |
