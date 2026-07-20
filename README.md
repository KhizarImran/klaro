# Klaro

**Build Your Own Quantfund in Python — a course for algorithmic traders.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19+-61DAFB)](https://reactjs.org/)

---

## What is Klaro?

Klaro is a course site that teaches traders to build a systematic FX fund in
Python, targeting MetaTrader 5. Lessons are written in MDX and walk through the
whole stack — data, backtesting, strategy, risk, execution, and automation —
ending in a working fund dashboard.

The site itself is a React SPA; lessons live as MDX files in the repo (no CMS).

---

## Quick Start

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

```bash
npm run typecheck  # tsc --noEmit
npm run build      # production build -> dist/
npm run lint
```

No environment variables are required to run the site.

---

## Project Structure

```
klaro/
├── frontend/
│   └── src/
│       ├── pages/            # LandingPage, CoursePage, LessonPage
│       ├── content/
│       │   ├── course.ts     # builds the module/lesson tree from the file layout
│       │   └── modules/      # lessons as MDX (NN-module/NN-lesson.mdx)
│       ├── components/ui/    # button, card
│       ├── lib/utils.ts
│       └── index.css         # Tailwind v4 theme (OKLCH dark)
├── REBRAND.md                # the course plan (current)
└── README.md
```

### Adding a lesson

Drop an `.mdx` file into a numbered module folder with frontmatter — it appears
in the course automatically:

```mdx
---
title: Pulling OHLCV from MT5
free: false
order: 1
---

# ...lesson content...
```

Folder `NN-slug` sets module order/title; file `NN-slug` sets lesson order.

---

## Tech Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4 (OKLCH dark theme)
- MDX (`@mdx-js/rollup`) for lessons
- React Router

---

## Status

Early build. The content pipeline, landing page, and course/lesson pages are in
place with a free intro module. Payment gating (one-time purchase), progress
tracking, and a Discord community are planned — see **[REBRAND.md](REBRAND.md)**.

---

## License

MIT — see LICENSE.

---

## Disclaimer

Educational content only. Not financial advice. Trading involves substantial
risk; past performance is not indicative of future results.
