# Kalinga

**A distance-parenting app concept for OFW (Overseas Filipino Worker) families.**

Kalinga helps a parent working abroad stay present in their child's daily life, even when timezones and schedules make live contact rare. The name means *"care"* in Filipino.

> **Current stage:** Landing page for fieldwork validation. This is the public-facing signup page used during user research interviews with OFW parents and caretakers.

---

## What This Repository Contains

This is a **static landing page** — no build tools, no frameworks, no `npm install`. Open `index.html` in a browser and it works, including fully offline (all fonts are self-hosted).

The page features:
- **Split-screen hero** showing live clocks for Riyadh (UTC+3) and Manila (UTC+8)
- **Interactive time scrub slider** — drag along the seam to explore 24 hours of sky changes
- **Dynamic sky brightness** — backgrounds, stars, and sunrays respond to the time of day
- **Scroll-reveal feature rows** with SVG line-draw icon animations
- **Email waitlist form** with local + remote persistence (Google Apps Script → Google Sheets)
- **Full mobile responsiveness** with safe-area support for notches and gesture bars

---

## Quick Start

```bash
# No installation needed. Just open the file:
start index.html        # Windows
open index.html         # macOS
xdg-open index.html     # Linux
```

Or use any local server:
```bash
npx serve .
# → http://localhost:3000
```

---

## Project Structure

```
Kalinga/
│
├── index.html                  # Single-page entry point (all HTML markup)
├── favicon.svg                 # Browser tab icon (small green SVG)
├── Kalinga-photo.png           # OG/social share image
├── README.md                   # This file
│
├── css/
│   ├── styles.css              # CSS manifest — imports all other stylesheets
│   ├── fonts.css               # @font-face declarations for 3 self-hosted typefaces
│   ├── variables.css           # Design tokens (colors, fonts) as CSS custom properties
│   ├── base.css                # Global resets, body defaults, utility classes
│   ├── fonts/                  # WOFF2 font files (Fraunces, IBM Plex Mono, Public Sans)
│   └── components/
│       ├── nav.css             # Fixed navigation bar (mix-blend-mode technique)
│       ├── hero.css            # Split-screen dual-clock hero (largest CSS file)
│       ├── gap.css             # Editorial quote section ("The distance is real.")
│       ├── features.css        # Feature highlight rows with icon grid
│       ├── waitlist.css        # Email signup form and counter
│       └── footer.css          # Minimal footer tagline
│
├── js/
│   ├── app.js                  # Entry point — bootstraps services and components
│   ├── services/
│   │   ├── TimeService.js      # Timezone math (UTC offset calculations)
│   │   └── StorageService.js   # 3-tier persistence (platform API → localStorage → memory)
│   └── components/
│       ├── TimeScrubComponent.js    # Hero: live clocks, sky brightness, interactive slider
│       ├── WaitlistComponent.js     # Email form: validation, submission, counter animation
│       └── ScrollRevealComponent.js # Feature rows: scroll-triggered fade + SVG line-draw
│
└── design/                     # Design artifacts (not part of the live site)
    ├── kalinga-app-mockups.html     # Phone-frame mockups of the future app screens
    └── kalinga-feature-roadmap.md   # 5-feature phased build plan
```

---

## Architecture

### Dependency Injection Pattern

```
app.js (orchestrator)
  │
  ├── Services (stateless utilities, no DOM)
  │   ├── TimeService       → timezone arithmetic
  │   └── StorageService    → persistent key-value storage
  │
  └── Components (own their DOM section)
      ├── TimeScrubComponent    ← receives TimeService
      ├── WaitlistComponent     ← receives StorageService, Anime.js
      └── ScrollRevealComponent ← receives Anime.js
```

Each component receives its dependencies through its constructor rather than importing them directly. This makes the code testable and decoupled.

### CSS–JS Bridge

`TimeScrubComponent.js` writes two CSS custom properties on the `.hero` element:
- `--day-brightness` (0.0 to 1.0) — Manila's sky brightness
- `--night-brightness` (0.0 to 1.0) — Riyadh's sky brightness

These are read by `hero.css` to dynamically control:
- Background gradient blending via `color-mix()`
- Star field opacity (fades out during daytime)
- Sunray glow opacity (fades out during nighttime)

### Time Model

Time is represented as **minutes since midnight** (0–1439). Manila minutes is the primary value; Riyadh is derived by subtracting the 5-hour offset (300 minutes). This single-source approach ensures both clocks always stay perfectly synchronized.

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Markup** | Semantic HTML5 | Structure, SEO, accessibility |
| **Styling** | Vanilla CSS + Custom Properties | Design tokens, responsive layout, animations |
| **Logic** | Vanilla JS (ES Modules) | Component behavior, no framework overhead |
| **Animation** | [Anime.js v3](https://animejs.com/) (CDN) | Scroll reveals, SVG line-draws, counter tweens |
| **Fonts** | Self-hosted WOFF2 | Fraunces, IBM Plex Mono, Public Sans |
| **Backend** | Google Apps Script | Waitlist email collection → Google Sheets |

### Why No Framework?

This is a single landing page for field research. Vanilla JS with ES Modules provides:
- **Zero build step** — open `index.html` and it works
- **Full offline capability** — no CDN fonts, no npm dependencies
- **~30KB total CSS** — no framework CSS overhead
- **Easy handoff** — any developer can read and modify the code

---

## Design Tokens

All visual values are centralized in [`css/variables.css`](css/variables.css):

| Token | Value | Usage |
|-------|-------|-------|
| `--night-1` | `#131b32` | Night half primary background |
| `--night-2` | `#243256` | Night half gradient endpoint |
| `--day-1` | `#f4c669` | Day half primary background |
| `--day-2` | `#e8a33d` | Day half gradient endpoint |
| `--paper` | `#f1ead9` | Page background (warm off-white) |
| `--ink` | `#1f2823` | Primary text color |
| `--ink-soft` | `#5a6459` | Secondary text color |
| `--green` | `#5c7a52` | Accent / button background |
| `--green-dark` | `#455e3d` | Button hover / focus rings |
| `--font-display` | Fraunces | Headlines, feature titles |
| `--font-body` | Public Sans | Body text, descriptions |
| `--font-mono` | IBM Plex Mono | Labels, buttons, clocks, nav |

---

## Key Behaviors

### Interactive Time Scrub
- **Desktop:** Drag vertically along the center seam
- **Mobile:** Drag horizontally along the seam between stacked halves
- **Keyboard:** Arrow keys (±15 min), Home (00:00), End (23:59)
- **"Back to live time" button** appears after scrubbing; click to return to real-time

### Waitlist Form
- Email is saved locally (localStorage) as a backup before the network request
- POST goes to a Google Apps Script endpoint configured via `data-endpoint` on the `<form>`
- Uses `mode: 'no-cors'` since Google Apps Script doesn't support CORS preflight
- Counter uses a progressive formula: `73 + signups × 12 + signups²/3`

### Scroll Reveal
- Feature rows start invisible (opacity: 0, translateY: 28px)
- IntersectionObserver triggers at 25% visibility
- SVG icons animate with a stroke-dashoffset line-draw effect
- Each element animates only once (observer is disconnected after firing)

### Graceful Degradation
- If Anime.js CDN fails: all content shows immediately, no animations
- If localStorage is blocked: in-memory Map fallback (session-only)
- If the API endpoint is unreachable: email is still saved locally
- `prefers-reduced-motion`: all animations disabled, elements shown in final state

---

## Responsive Breakpoints

| Viewport | Behavior |
|----------|----------|
| **>768px** | Side-by-side hero halves, vertical seam, full typography |
| **641–768px** | Slightly smaller type, still side-by-side |
| **≤640px** | Stacked halves (top/bottom), horizontal seam, compressed type |
| **Landscape + short** | Scrollable hero, compressed typography |
| **≥1440px** | Scaled-up type for 4K displays |

---

## Accessibility

- **Keyboard navigation:** Time scrub slider is a `role="slider"` with full arrow key + Home/End support
- **Screen readers:** `aria-live="polite"` on waitlist status, `aria-valuetext` on slider, visually-hidden `<h1>` and `<h2>` for heading hierarchy
- **Focus indicators:** Green outline with 3px offset on all interactive elements
- **Reduced motion:** All animations disabled when OS preference is set
- **Touch targets:** All buttons and inputs have minimum 48px height (WCAG 2.5.5)
- **Color contrast:** All text combinations meet WCAG AA ratio requirements

---

## Deployment

This is a static site. Deploy by copying all files to any web server or static host:

```bash
# Vercel
npx vercel --prod

# Netlify
npx netlify deploy --prod --dir .

# GitHub Pages
# Push to a gh-pages branch or enable Pages in repo settings

# Any web server
# Copy all files to the web root — no build step needed
```

### Waitlist Endpoint Setup

The email form POSTs to a Google Apps Script. To set up your own:

1. Create a Google Sheet
2. Open Extensions → Apps Script
3. Deploy a `doPost(e)` function that writes the email to the sheet
4. Copy the deployment URL
5. Set it as the `data-endpoint` attribute on the `<form>` in `index.html`

---

## Design Files

The `design/` directory contains reference materials for the future app:

- **[kalinga-app-mockups.html](design/kalinga-app-mockups.html)** — Phone-frame mockups of the 5 core app screens (open directly in a browser)
- **[kalinga-feature-roadmap.md](design/kalinga-feature-roadmap.md)** — Phased build plan covering Shared Timeline, Async Presence, Find Your Words, Honest Presence, and Propose a Call

---

## DST Safety Note

Both Riyadh (Asia/Riyadh, UTC+3) and Manila (Asia/Manila, UTC+8) observe fixed standard time year-round — neither uses Daylight Saving Time. The 5-hour offset arithmetic in `TimeScrubComponent.js` assumes no DST transitions. If adding timezones that observe DST in the future, switch to `Intl.DateTimeFormat` with explicit IANA timezone identifiers.

---

## License

This project is for academic/research fieldwork purposes. All rights reserved.
