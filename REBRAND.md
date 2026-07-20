# Klaro Rebrand — "Build Your Own Quantfund in Python"

**From:** MT5 analytics tool (upload XLSX → see metrics)
**To:** A course teaching traders to build a Python quantfund targeting MT5 / FX markets.

Same domain, same stack, different product surface. Most of the existing app becomes course material rather than being thrown away.

---

## Locked decisions

- **Format:** Text + code + live demos (MDX lessons, Python snippets, existing React charts embedded as demos).
- **Community:** Discord — gated invite link behind purchase. No bot/role-sync until link-sharing is a real problem.
- **Monetization:** One-time course purchase (Stripe `payment` mode, not subscription).
- **Companion code:** Downloadable repo per module. Students run it locally where MT5 actually works.
- **Content architecture:** MDX files in the repo. No CMS — one author doesn't need one.

---

## Keep / repurpose / cut

| Current | Fate | Why |
|---|---|---|
| React/Vite/Tailwind/shadcn shell | Keep | Good course site foundation |
| Supabase auth | Keep | Login + progress + purchases |
| Netlify hosting | Keep | Static MDX builds suit it |
| Chart components (`EquityBalanceCurve`, `MonthlyReturnsHeatmap`, `MagicNumberBreakdown`) | Repurpose | Embed as live lesson demos |
| `mt5Metrics`, XLSX parsers | Repurpose | Become code you teach ("parse your MT5 report") |
| `DashboardPage` | Repurpose | The **capstone** — what students build toward |
| `PROJECT.md` sync architecture | Repurpose | Source for the automation/infra module |
| Landing / waitlist | Keep, restyle | Course lead-gen |
| Stripe subscription scaffolding | Swap | One-time price instead of recurring |
| MT5 live-sync SaaS vision | Cut | No longer the product |

Nothing is wasted — the dashboard already built is the finished artifact of the course.

---

## Design direction

Reference: **edgeskool.net**, but **dark mode**. Marketing-funnel course site.

- **Layout:** sticky top nav → bold hero (big headline + CTA) → course cards (with lesson counts) → feature blocks → highlighted pricing tier → testimonials → FAQ accordion → footer (legal + socials).
- **Theme:** keep existing OKLCH dark base (bg `oklch(10% 0.01 240)`, cards `oklch(14%…)`, borders `oklch(25%…)`).
- **Accent:** blue for CTAs / "Join Now" buttons (edgeskool uses blue). Emerald/red reserved for P/L data in demos.
- **Vibe:** clean, high-contrast, conversion-focused. Minimal noise, generous spacing, large bold headlines.

## Content architecture

```
frontend/src/content/
  modules/
    01-foundations/
      01-what-is-a-quantfund.mdx
      02-mt5-python-setup.mdx
    02-data/ ...
    ...
```

- **MDX** so lessons drop in live React demos + syntax-highlighted Python.
- Frontmatter per lesson: `title`, `module`, `order`, `free: true|false`.
- Course tree built from the file glob at build time — no DB for structure.
- Progress + purchases in Supabase; companion Python repo downloadable per module.

Skipped: CMS, custom LMS, video infra. Add when there's >1 author or paid video.

---

## Curriculum — "Build Your Own Quantfund in Python"

0. **Foundations** — what a quant fund is, MT5 + `MetaTrader5` package, connecting a demo account
1. **Data** — pulling OHLCV/tick data from MT5, FX symbols & sessions, storage
2. **Research & backtesting** — vectorized vs event-driven, avoiding lookahead/survivorship, metrics (Sharpe, drawdown, profit factor — already computed in `mt5Metrics`)
3. **Strategy building** — a real FX strategy end-to-end, signals, optimization, walk-forward
4. **Risk & position sizing** — fixed-fractional, volatility targeting, drawdown limits
5. **Execution** — orders via MT5 API, order types, slippage, magic numbers
6. **Automation & infra** — 24/5 running, VPS/Windows, scheduling, logging, monitoring (recycled `PROJECT.md`)
7. **Capstone: the fund dashboard** — parse reports, track performance, investor reporting (current Klaro app)

The ordering is the differentiator — it ends at the exact tool already working.

---

## Build plan

### Phase 1 — Scaffold

**Content pipeline**
- Add `@mdx-js/rollup` to Vite; `content/modules/**/*.mdx`.
- Frontmatter parsed; build course tree from file glob.

**Routing** (replaces dashboard-as-app)
- `/` landing (restyled) → `/course` TOC → `/course/:module/:lesson`.
- Keep `/login`, waitlist. Move protected dashboard to `/course/capstone`.

**Lesson shell**
- One `<LessonLayout>`: sidebar TOC + prev/next + "mark complete".
- MDX components: `<Py>` (Python highlight), `<Demo>` (wraps existing charts), `<RepoLink module="03">`.

**Supabase — two tables**
- `user_progress(user_id, lesson_id, completed_at)`
- `course_access(user_id, granted_at, stripe_session_id)` — set by Stripe webhook.

**Payment**
- Reuse `create-checkout-session` edge function, switch to `mode: payment`, single price.
- Webhook writes `course_access`. Free lessons render for all; paid lessons check access. `SubscriptionGate` → `CourseGate` (~10 lines changed).

**Discord**
- Invite URL in env; shown on success page + persistent "Community" link once access granted.

### Sequence to ship

1. Pipeline + shell + Modules 0–1 **free** (lead magnet).
2. `course_access` gate + Stripe one-time purchase.
3. Discord link.
4. Fill Modules 2–7 while selling.

Skipped: CMS, video infra, in-browser Python, Discord bot. Add each only when a real limit forces it.
