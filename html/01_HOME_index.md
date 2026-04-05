# NYAC Travers Island Tennis — Home Page Prompt
## `index.html`

---

## Project Context

You are building the **home page** (`index.html`) for **NYAC Travers Island Tennis** — the tennis program website for the New York Athletic Club's Travers Island location. This is a **frontend-only file**. A separate backend (Next.js + Supabase) will be wired in later by another developer. Do not write any server-side logic.

This page is **Page 1 of 5**. The other pages are:
- `court-booking.html`
- `private-lessons.html`
- `clinics.html`

All pages share one external stylesheet: `styles.css`. Write all reusable styles there. Use a `<style>` block inside `<head>` only for styles unique to this page.

---

## Tech Stack

- HTML5 / CSS3 / Vanilla JS
- **Tailwind CSS** via CDN: `https://cdn.tailwindcss.com`
- **Google Fonts** — import all four families in one `<link>` tag:

```html
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Cormorant+Garamond:wght@400;600&family=Montserrat:wght@400;500;600&family=Lora:ital,wght@0,400;0,500;1,400&display=swap" rel="stylesheet">
```

---

## Design System

### Color Palette

Define these as CSS variables at the top of `styles.css`. Use them everywhere — no hardcoded hex values anywhere else in the file.

```css
:root {
  --crimson:     #C8102E;   /* NYAC red — headings, buttons, accents, dividers */
  --crimson-dk:  #A00D23;   /* hover state for crimson buttons */
  --white:       #FFFFFF;
  --off-white:   #FAF8F5;   /* warm section backgrounds */
  --dark:        #1A1A1A;   /* body text, nav text, footer background */
  --mid-gray:    #6B6B6B;   /* secondary labels, captions, section label text */
  --light-gray:  #E8E4DF;   /* borders, dividers, card edges */
  --charcoal:    #2C2C2C;   /* info bar background */
}
```

**Color usage rules — follow strictly:**
- `--crimson` appears only on: display headings, `<hr>` accent dividers, button backgrounds, hover text states, card top-border accents, and badge pills
- `--charcoal` appears only on: the info bar strip and the footer
- Page section backgrounds alternate strictly: white → off-white → white → off-white (top to bottom)
- Never use gradients, color-tinted shadows, or any color outside this palette

---

### Typography

Define these font-family variables in `styles.css` and apply consistently to every element.

```css
:root {
  --font-display: 'Playfair Display', Georgia, serif;
  --font-label:   'Cormorant Garamond', Georgia, serif;
  --font-ui:      'Montserrat', Arial, sans-serif;
  --font-body:    'Lora', Georgia, serif;
}
```

#### Full Type Scale

| Element | Font Variable | Size | Weight | Color | Special |
|---------|--------------|------|--------|-------|---------|
| Section labels | `--font-label` | 13px | 600 | `--mid-gray` | ALL CAPS, letter-spacing: 0.18em |
| Crimson HR divider | — | 1px solid | — | `--crimson` | width: 48px, no border-radius |
| Hero h1 | `--font-display` | 72px desktop / 44px mobile | 400 | white | line-height: 1.1 |
| Page h2 headings | `--font-display` | 42px | 400 | `--crimson` | line-height: 1.2 |
| Card / sub h3 | `--font-display` | 22px | 600 | `--dark` | line-height: 1.3 |
| Body paragraphs | `--font-body` | 17px | 400 | `--dark` | line-height: 1.8 |
| Secondary body | `--font-body` | 15px | 400 | `--mid-gray` | line-height: 1.7 |
| Nav links | `--font-ui` | 12px | 500 | `--dark` | ALL CAPS, letter-spacing: 0.14em |
| Buttons | `--font-ui` | 12px | 600 | white on `--crimson` | ALL CAPS, letter-spacing: 0.12em |
| Info bar labels | `--font-ui` | 11px | 500 | rgba(255,255,255,0.5) | ALL CAPS, letter-spacing: 0.16em |
| Info bar values | `--font-display` | 17px | 600 | white | — |
| Card meta / dates | `--font-ui` | 11px | 500 | `--mid-gray` | ALL CAPS, letter-spacing: 0.14em |
| Coach title | `--font-ui` | 11px | 500 | `--mid-gray` | ALL CAPS, letter-spacing: 0.16em |

---

### Reusable CSS Classes

Include these in `styles.css`:

```css
/* ─── Buttons ─────────────────────────────────────────────── */
.btn-crimson {
  background-color: var(--crimson);
  color: var(--white);
  font-family: var(--font-ui);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  border-radius: 0;
  padding: 14px 32px;
  border: none;
  cursor: pointer;
  display: inline-block;
  transition: background-color 0.25s ease;
}
.btn-crimson:hover { background-color: var(--crimson-dk); }

/* ─── Section Label ────────────────────────────────────────── */
.section-label {
  font-family: var(--font-label);
  font-size: 13px;
  font-weight: 600;
  color: var(--mid-gray);
  text-transform: uppercase;
  letter-spacing: 0.18em;
  display: block;
}

/* ─── Crimson HR Divider ───────────────────────────────────── */
.divider-crimson {
  border: none;
  border-top: 1px solid var(--crimson);
  width: 48px;
  margin: 12px 0 22px 0;
}
.divider-crimson.centered {
  margin-left: auto;
  margin-right: auto;
}

/* ─── Section Padding ──────────────────────────────────────── */
.section-pad { padding: 96px 0; }

/* ─── Nav Scroll Shadow ────────────────────────────────────── */
.nav-scrolled {
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.09);
}

/* ─── Global Transitions ───────────────────────────────────── */
* { box-sizing: border-box; }
a { transition: color 0.25s ease; }
```

**Zero border-radius everywhere** — sharp corners on all cards, buttons, and images throughout the entire site.

---

## Global Components

Repeat the exact same HTML block for nav and footer on every page.

---

### Navigation Bar

```css
#main-nav {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 50;
  background: var(--white);
  border-bottom: 1px solid var(--light-gray);
  transition: box-shadow 0.25s ease;
}
```

**Desktop layout — two rows:**

Row 1: `[ hamburger (hidden desktop) ]  [ NYAC LOGO — centered ]  [ Member Login button — right ]`
Row 2: `[ HOME  ·  COURT BOOKING  ·  PRIVATE LESSONS  ·  CLINICS ]` — centered below logo

```html
<!-- Logo -->
<img src="NYAC-Website Photos/NYAC_logo.jpg" alt="NYAC Logo" style="height: 48px; display: block;">

<!-- Member Login -->
<a href="#" class="btn-crimson">Member Login</a>

<!-- Nav links -->
<nav>
  <a href="index.html">Home</a>
  <a href="court-booking.html">Court Booking</a>
  <a href="private-lessons.html">Private Lessons</a>
  <a href="clinics.html">Clinics</a>
</nav>
```

**Nav link styles:**
```css
nav a {
  font-family: var(--font-ui);
  font-size: 12px;
  font-weight: 500;
  color: var(--dark);
  text-transform: uppercase;
  letter-spacing: 0.14em;
  text-decoration: none;
  padding: 4px 0;
  margin: 0 20px;
}
nav a:hover { color: var(--crimson); }
nav a.active {
  color: var(--crimson);
  border-bottom: 2px solid var(--crimson);
}
```

**Mobile (< 768px):**
- Hide nav links row, show hamburger icon (`id="hamburger-btn"`) top-left
- `id="mobile-nav"` drops down as full-width white panel, starts hidden
- Each link: 48px tall, `border-bottom: 1px solid var(--light-gray)`, full-width

---

### Footer

```css
#site-footer {
  background: var(--dark);
  color: white;
  padding: 64px 0 0 0;
}
```

**3-column layout** → stacks vertically on mobile:

**Col 1 — Club Info:**
- NYAC logo: `<img src="NYAC-Website Photos/NYAC_logo.jpg" style="height:38px; filter:brightness(0) invert(1); opacity:0.8; margin-bottom:20px;">`
- Address, phone, email — all `[PLACEHOLDER]` — Lora 14px, `rgba(255,255,255,0.65)`, line-height 1.8

**Col 2 — Quick Links:**
- Heading: `QUICK LINKS` — Montserrat 11px ALL CAPS, `rgba(255,255,255,0.4)`, letter-spacing 0.16em, margin-bottom 16px
- Links: HOME / COURT BOOKING / PRIVATE LESSONS / CLINICS
- Montserrat 13px, `rgba(255,255,255,0.7)`, hover → white, each on its own line, line-height 2.2

**Col 3 — Hours:**
- Heading: `HOURS OF OPERATION` — same style as Col 2 heading
- Table: two columns (day | hours), Lora 14px, `rgba(255,255,255,0.65)`, all hours `[PLACEHOLDER]`

**Bottom bar:**
```css
.footer-bottom {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 24px 0;
  margin-top: 48px;
  text-align: center;
  font-family: var(--font-ui);
  font-size: 11px;
  color: rgba(255,255,255,0.35);
  letter-spacing: 0.1em;
}
```
Text: `© 2025 New York Athletic Club — Travers Island Tennis`

---

## Page Sections — Build Top to Bottom

Section backgrounds alternate strictly: **white → off-white → white → off-white**

---

### SECTION 1 — Hero
**Background: `NYAC-Website Photos/Arial-View-Courts.jpg` (aerial drone photo)**

```css
#hero-section {
  background-image: url('NYAC-Website Photos/Arial-View-Courts.jpg');
  background-size: cover;
  background-position: center center;
  background-attachment: fixed;
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}
.hero-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.50);
  z-index: 0;
}
.hero-content {
  position: relative;
  z-index: 1;
}
```

**Hero content — all centered:**

```
NYAC TRAVERS ISLAND          ← --font-ui, 12px, ALL CAPS, white, letter-spacing: 0.22em, opacity: 0.85
─────────────────            ← <hr> white, width: 48px, centered, margin: 16px auto
Tennis House                 ← --font-display, 72px, white, font-weight: 400
Pelham Bay · New York        ← --font-body italic, 20px, white, opacity: 0.80, margin-top: 16px
```

**Scroll indicator** — `position: absolute; bottom: 32px; left: 50%; transform: translateX(-50%); z-index: 1`:
- Down chevron SVG, 24×24, white, opacity 0.65
- CSS bounce animation, 1.6s loop:
```css
@keyframes bounce {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50%       { transform: translateX(-50%) translateY(9px); }
}
```

---

### SECTION 2 — Info Bar
**Background: `var(--charcoal)` #2C2C2C — bold dark contrast strip**

No vertical padding. Four tiles in one full-width row.

```css
#info-bar {
  background: var(--charcoal);
  display: flex;
}
.info-tile {
  flex: 1;
  padding: 28px 32px;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  text-decoration: none;
  display: block;
  transition: background-color 0.25s ease;
}
.info-tile:last-child { border-right: none; }
.info-tile:hover { background: rgba(255, 255, 255, 0.06); }
.info-tile:hover .info-value { color: var(--crimson); }

.info-label {
  font-family: var(--font-ui);
  font-size: 11px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.16em;
  display: block;
  margin-bottom: 8px;
}
.info-value {
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 600;
  color: var(--white);
  transition: color 0.25s ease;
}
```

| Tile | Label | Value | `href` |
|------|-------|-------|--------|
| 1 | HOURS | `[MON–SUN: HOURS PLACEHOLDER]` | `#` |
| 2 | LOCATION | Travers Island, Pelham Bay, NY | `#` |
| 3 | COURT RENTAL | From $`[RATE]`/hr | `court-booking.html` |
| 4 | PRIVATE LESSONS | From $`[RATE]`/session | `private-lessons.html` |

Mobile: 2×2 grid, add `border-bottom: 1px solid rgba(255,255,255,0.1)` between rows.

---

### SECTION 3 — About the Place
**Background: `var(--white)`**

Two-column 50/50 split. **Text LEFT, photo RIGHT.** No gap between columns — they butt up against each other.

**Left column — text** (padding: `96px 64px 96px 80px`):
```
ABOUT TRAVERS ISLAND         ← .section-label
————                         ← .divider-crimson
A Storied Venue              ← --font-display h2, 42px, --crimson
for the Sport of Tennis

[PARAGRAPH 1 — History of the Travers Island tennis
facilities and their place within the NYAC]

[PARAGRAPH 2 — Description of the court complex,
waterfront setting, and surroundings]

[PARAGRAPH 3 — The community, tradition, and what
makes playing here special]
```
All body text: `--font-body`, 17px, `--dark`, line-height 1.8.

**Right column — image** (fills full column height):
```html
<img src="NYAC-Website Photos/Side_View_Courts.jpg"
     alt="Travers Island tennis courts — covered patio with Adirondack chairs"
     class="about-place-img">
```
```css
.about-place-img {
  width: 100%;
  height: 100%;
  min-height: 560px;
  object-fit: cover;
  object-position: center;
  display: block;
  box-shadow: 12px 12px 0px var(--crimson); /* REQUIRED — crimson offset shadow signature */
}
```

**Mobile:** image stacks on top, text below. Full width both.

---

### SECTION 4 — About the Director
**Background: `var(--off-white)` #FAF8F5**

Two-column layout. **Photo LEFT, text RIGHT.**

**Left column — circular photo** (centered in column):
```css
.director-photo-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 96px 48px;
}
.director-photo {
  width: 240px;
  height: 240px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid var(--crimson);
  background: var(--light-gray); /* placeholder color */
  display: flex;
  align-items: center;
  justify-content: center;
}
```
Photo placeholder: gray circle with `[DIRECTOR PHOTO]` in `--font-ui` 12px `--mid-gray` centered.

**Right column — text** (padding: `96px 80px 96px 48px`):
```
TENNIS DIRECTOR              ← .section-label
————                         ← .divider-crimson
[DIRECTOR FULL NAME]         ← --font-display h2, 40px, --crimson
[DIRECTOR TITLE]             ← --font-ui, 11px ALL CAPS, --mid-gray, letter-spacing 0.16em, margin-bottom 24px

[PARAGRAPH 1 — Director's background, credentials,
years of experience, and clubs or programs they
have previously worked with]

[PARAGRAPH 2 — Their coaching philosophy, approach
to teaching, and vision for the NYAC Travers Island
tennis program]
```

**Mobile:** photo stacks on top, text below. Photo shrinks to 180px diameter.

---

### SECTION 5 — About the Coaches
**Background: `var(--white)`**

Centered header:
```
OUR COACHING STAFF           ← .section-label, centered
————                         ← .divider-crimson.centered
Meet the Team                ← --font-display h2, 42px, --crimson, centered
```

Then a vertical stack of **horizontal coach cards** (photo LEFT, text RIGHT):

```
┌──────────────────────────────────────────────────────────────────┐
│  ┌──────────┐  [COACH FULL NAME]     ← --font-display 22px --dark │
│  │          │  [COACH TITLE]         ← --font-ui 11px ALL CAPS    │
│  │  PHOTO   │                        ← --mid-gray, ls: 0.16em     │
│  │ 160×160  │  [COACH BIO — 1–2 sentences about background,      │
│  │          │  specialty, and experience at the club.]            │
│  └──────────┘  ← --font-body 15px --mid-gray, line-height 1.7    │
└──────────────────────────────────────────────────────────────────┘
```

```css
.coach-card {
  display: flex;
  align-items: center;
  gap: 36px;
  padding: 32px 36px;
  border: 1px solid var(--light-gray);
  background: var(--white);
  margin-bottom: 20px;
  transition: all 0.25s ease;
}
.coach-card:hover {
  border-top: 3px solid var(--crimson);
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.08);
  transform: translateY(-3px);
}
.coach-photo {
  width: 160px;
  height: 160px;
  object-fit: cover;
  flex-shrink: 0;
  background: var(--light-gray);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-ui);
  font-size: 11px;
  color: var(--mid-gray);
}
```

Include **3 placeholder coach cards**. Each photo placeholder: gray `160×160` div with `[COACH PHOTO]` text centered.

**Mobile:** photo stacks above text in each card. Full-width card.

---

### SECTION 6 — Bulletin Board
**Background: `var(--off-white)` #FAF8F5**

Centered header:
```
CLUB UPDATES                 ← .section-label, centered
————                         ← .divider-crimson.centered
News & Announcements         ← --font-display h2, 42px, --crimson, centered
```

**3-column card grid** → 2 col tablet → 1 col mobile:

```
┌──────────────────────────┐
│   [POST IMAGE — 16:9]    │  ← gray placeholder div, aspect-ratio: 16/9
├──────────────────────────┤
│  [MONTH DAY, YEAR]       │  ← --font-ui 11px ALL CAPS --mid-gray, ls: 0.14em
│  [POST TITLE]            │  ← --font-display 20px --dark, margin-top: 8px
│                          │
│  [2-sentence placeholder │  ← --font-body 15px --mid-gray, line-height 1.7
│  update text for club]   │
│                          │
│  Read More →             │  ← --font-ui 12px --crimson, hover: underline
└──────────────────────────┘
```

```css
.news-card {
  background: var(--white);
  border: 1px solid var(--light-gray);
  border-radius: 0;
  overflow: hidden;
  transition: box-shadow 0.25s ease;
}
.news-card:hover {
  box-shadow: 0 10px 32px rgba(0, 0, 0, 0.09);
}
.news-img-placeholder {
  width: 100%;
  aspect-ratio: 16 / 9;
  background: var(--light-gray);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-ui);
  font-size: 11px;
  color: var(--mid-gray);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.news-card-body { padding: 24px 28px 28px; }
```

**3 placeholder posts:**
- Post 1: `[TOURNAMENT ANNOUNCEMENT — PLACEHOLDER TITLE]`
- Post 2: `[CLINIC SCHEDULE UPDATE — PLACEHOLDER TITLE]`
- Post 3: `[CLUB NEWS — PLACEHOLDER TITLE]`

---

## JavaScript

One `<script>` block at the bottom of `<body>`. Clean stubs only — no dummy logic to remove later.

```js
// ─── Nav shadow on scroll ─────────────────────────────────────────────────
window.addEventListener('scroll', () => {
  const nav = document.getElementById('main-nav');
  if (nav) nav.classList.toggle('nav-scrolled', window.scrollY > 10);
});

// ─── Mobile hamburger toggle ──────────────────────────────────────────────
const hamburger = document.getElementById('hamburger-btn');
const mobileNav = document.getElementById('mobile-nav');
if (hamburger && mobileNav) {
  hamburger.addEventListener('click', () => {
    mobileNav.classList.toggle('hidden');
  });
}

// ─── Smooth scroll for any anchor links ──────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});
```

---

## HTML IDs — Backend Reference

Use these exact IDs. Do not rename them.

```
id="main-nav"          navigation bar
id="hamburger-btn"     mobile hamburger button
id="mobile-nav"        collapsible mobile nav panel
id="hero-section"      hero
id="info-bar"          charcoal info strip
id="about-place"       about the place section
id="about-director"    director section
id="about-coaches"     coaches section
id="bulletin-board"    news section
id="site-footer"       footer
```

---

## Mobile Responsiveness Checklist

- [ ] Nav collapses to hamburger at `< 768px`
- [ ] Hero h1: 72px → 44px on mobile
- [ ] Info bar: 4-tile row → 2×2 grid tablet → 1 col mobile
- [ ] About Place: 50/50 split → stacked (image top) on mobile
- [ ] About Director: 50/50 split → stacked (photo top) on mobile
- [ ] Coach cards: horizontal → stacked (photo top) on mobile
- [ ] News grid: 3 col → 2 col → 1 col
- [ ] Footer: 3 col → 1 col stack on mobile
- [ ] All tap targets: minimum 44px height

---

## Placeholder Convention

Every real content item that needs filling in must appear in `[BRACKETS]`:
- `[DIRECTOR FULL NAME]`
- `[COACH BIO — 1–2 sentences about background and specialty]`
- `[MON–SUN: 7:00 AM – 9:00 PM]`
- `[COURT RENTAL RATE — e.g. $30]`
- `[MONTH DAY, YEAR]`

---

## Images

All photos live inside the **`NYAC-Website Photos/`** folder, which is located in the same VS Code project directory as `index.html`. Reference them using that relative folder path:

```
NYAC-Website Photos/Arial-View-Courts.jpg   → hero background (aerial drone shot, courts + waterfront)
NYAC-Website Photos/Side_View_Courts.jpg    → About the Place section (patio with Adirondack chairs)
NYAC-Website Photos/NYAC_logo.jpg           → NYAC logo (nav bar + footer)
```

Use `object-fit: cover` on all images. Never stretch or distort.

---

## Quality Standards

- Must look and feel like a **premium private athletic club website** — not a template
- Typography pattern repeats on **every section without exception**: `.section-label` → `.divider-crimson` → Playfair h2 in crimson → Lora body
- Crimson is used **sparingly**: headings, dividers, buttons, hover states, coach card hover border, and the offset box-shadow on the About the Place photo only
- The charcoal info bar is the **only dark element** on this page outside the footer — it is a bold visual anchor between hero and content
- Section padding is **96px top and bottom** — generous breathing room reflects the club's prestige
- **Zero border-radius** on all cards, buttons, images — sharp corners only
- The **crimson offset box-shadow** on the About the Place photo (`box-shadow: 12px 12px 0px var(--crimson)`) is a required design signature — do not remove or soften it
- File must open correctly by **double-clicking `index.html`** — no build step or local server required
