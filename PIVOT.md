# Klaro Platform Pivot: MT5 Analytics to Multi-User Fund Dashboard

**Document Version**: 1.0  
**Last Updated**: February 12, 2026  
**Status**: Planning Phase

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Target State Vision](#target-state-vision)
4. [Reference Implementation: QuantFund](#reference-implementation-quantfund)
5. [Technical Architecture](#technical-architecture)
6. [Migration Roadmap](#migration-roadmap)
7. [Cost Analysis](#cost-analysis)
8. [Risk Assessment](#risk-assessment)
9. [Success Metrics](#success-metrics)

---

## Executive Summary

### The Pivot

**From**: Single-user file upload analytics tool for MT5 reports  
**To**: Multi-user SaaS platform for live MT5 trading fund monitoring

### Key Changes

| Aspect | Current (Klaro) | Target (New Klaro) |
|--------|-----------------|-------------------|
| **Users** | Single user, file uploads | Multi-user SaaS with authentication |
| **Data Source** | Static XLSX/HTML reports | Live MT5 account connections |
| **Storage** | Browser localStorage | Supabase PostgreSQL database |
| **Backend** | None (frontend only) | Python/FastAPI on VPS |
| **Accounts** | One report at a time | Multiple MT5 accounts per user |
| **Updates** | Manual file re-upload | Scheduled sync (5-15 min intervals) |
| **Analytics** | Trade history only | Live positions + history + analytics |
| **Frontend** | React + Vite | Keep existing (migrate to Next.js later optional) |

### Business Model Shift

- **Before**: Free tool or one-time purchase
- **After**: Subscription SaaS ($10-30/month per user)
- **Target Market**: Algorithmic traders, prop traders, trading fund managers

---

## Current State Analysis

### Klaro v1.0 (File Upload Analytics)

**Tech Stack:**
- Frontend: React 19 + TypeScript + Vite
- UI: Tailwind CSS v4 (OKLCH colors, dark theme)
- Components: shadcn/ui + Recharts
- Storage: Browser localStorage
- Auth: Supabase (partially implemented)
- Deployment: Netlify

**Features:**
- ✅ Upload MT5 Trade History reports (XLSX)
- ✅ Upload MT5 Backtest reports (XLSX)
- ✅ Parse account info, trades, metrics
- ✅ Display dashboard with 5 key metrics
- ✅ Charts: Equity curve, monthly returns heatmap, magic number breakdown
- ✅ Paginated trades table with sorting
- ✅ Save multiple reports per user (localStorage)
- ✅ Strategy extraction from order comments and magic numbers

**Strengths:**
- Clean, modern UI with Bloomberg terminal aesthetic
- Robust XLSX parser (dynamic column detection)
- Type-safe dual report system (trade-history vs backtest)
- Strong data visualization

**Limitations:**
- ❌ Static data (no live updates)
- ❌ Manual file uploads required
- ❌ No historical data persistence across devices
- ❌ Single-report view (can't aggregate multiple accounts)
- ❌ No backend API
- ❌ Limited to reports user can export

### Key Files Reference

**Current Klaro Structure:**
```
klaro/
├── frontend/
│   ├── src/
│   │   ├── types/mt5.ts              # Type definitions
│   │   ├── utils/
│   │   │   ├── mt5ParserXLSX.ts      # Trade history parser
│   │   │   ├── mt5BacktestParserXLSX.ts  # Backtest parser
│   │   │   └── reportStorage.ts      # localStorage wrapper
│   │   ├── pages/
│   │   │   └── DashboardPage.tsx     # Main analytics UI
│   │   └── components/
│   │       ├── charts/               # Recharts visualizations
│   │       └── ReportUpload.tsx      # File upload UI
│   ├── CLAUDE.md                     # Architecture documentation
│   └── DASHBOARD_DESIGN.md           # UI/UX specifications
├── README.md
└── [migration guides, SQL files]
```

---

## Target State Vision

### New Klaro (Live Fund Dashboard)

**Vision Statement:**  
*A Bloomberg terminal-style platform where algorithmic traders connect their MT5 accounts and get real-time analytics, performance tracking, and fund management insights.*

**Core Value Proposition:**
- Connect multiple MT5 accounts (demo, funded, challenge, real)
- Real-time balance, equity, and position monitoring
- Advanced analytics: EA performance, symbol breakdown, time-based analysis
- Historical trade database with unlimited retention
- Multi-account aggregation (view total fund performance)
- Professional dashboard for serious traders

**Target Users:**
1. **Algorithmic Traders**: Running EAs across multiple accounts
2. **Prop Traders**: Managing challenges and funded accounts
3. **Fund Managers**: Overseeing multiple client accounts
4. **Retail Traders**: Tracking personal trading across brokers

**Differentiation from Competitors:**
- ✅ Unlimited MT5 accounts per user
- ✅ Advanced EA/Magic Number analytics (inspired by QuantFund)
- ✅ Beautiful, fast UI (not clunky like MyFxBook)
- ✅ Privacy-focused (data not shared publicly unless user wants)
- ✅ Affordable pricing ($10-20/mo vs $50+ competitors)

---

## Reference Implementation: QuantFund

### Your Existing Personal Project

**QuantFund** is the proof-of-concept that validates the technical approach.

**Architecture:**
```
Windows VPS (Home or Cloud)
  ├── MT5 Terminal 1 (Dedicated for API)
  ├── MT5 Terminal 2 (Dedicated for API)
  └── Python/FastAPI Backend
      ├── Sequential login to multiple accounts
      ├── Fetches account info, positions, history
      └── Exposes REST API

Next.js Frontend (Vercel)
  ├── Real-time dashboard (30s refresh)
  ├── Advanced analytics page
  ├── Cascading filters (EA → Symbol → Magic)
  └── Bloomberg terminal theme
```

**Key Learnings from QuantFund:**

1. **MT5 Connection Works**: Python `MetaTrader5` library is reliable
2. **Sequential Login is Fine**: One terminal can log into multiple accounts sequentially
3. **5 Seconds per Account**: Average sync time for account info + positions + history
4. **Data Structure**: QuantFund's API response format is proven and works well
5. **UI/UX Patterns**: Bloomberg-style dark theme, cascading filters, metric cards all validated

**QuantFund as Template:**
- Backend code can be forked/adapted for multi-user
- Frontend patterns (analytics, charts) can be ported to Klaro
- API endpoints proven in production (your personal use)

**QuantFund Tech Stack:**
- Backend: Python 3.11, FastAPI, MetaTrader5 library, Uvicorn
- Frontend: Next.js 16, React 19, Tailwind v4, Recharts, date-fns
- Deployment: Windows VPS (backend), Vercel (frontend)
- No database (live queries only)

---

## Technical Architecture

### Target Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Users (1000+)                        │
│              (Web browsers, mobile)                     │
└────────────────────┬────────────────────────────────────┘
                     │ HTTPS
                     │
┌────────────────────▼────────────────────────────────────┐
│          Ubuntu VPS (Hetzner/DigitalOcean)              │
│                  $15-30/mo                              │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  FastAPI (Main API)                               │  │
│  │  - User authentication (Supabase JWT)            │  │
│  │  - Account CRUD endpoints                        │  │
│  │  - Analytics API                                 │  │
│  │  - Trigger sync jobs                             │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Redis (Job Queue)                                │  │
│  │  - Sync job distribution                         │  │
│  │  - Worker coordination                           │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Celery Beat (Scheduler)                          │  │
│  │  - Triggers periodic syncs (every 15 min)        │  │
│  │  - Monitors worker health                        │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Nginx (Reverse Proxy)                            │  │
│  │  - SSL termination (Let's Encrypt)               │  │
│  │  - Load balancing                                │  │
│  └───────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │
          ┌──────────┴──────────┐
          │                     │
    Tailscale VPN          HTTPS API
    (Workers)              (Database)
          │                     │
          │                     │
┌─────────▼──────────┐   ┌──────▼───────────────────────┐
│  MT5 Workers       │   │  Supabase (Database)         │
│  (Windows VPS/Home)│   │  Free tier → $25/mo          │
│                    │   │                              │
│  Worker 1 ($10/mo) │   │  Tables:                     │
│  ├─ 4 MT5 terms    │   │  - users (auth.users)        │
│  └─ Celery worker  │   │  - user_mt5_accounts         │
│                    │   │  - account_snapshots         │
│  Worker 2 ($10/mo) │   │  - positions                 │
│  ├─ 4 MT5 terms    │   │  - trades                    │
│  └─ Celery worker  │   │  - user_settings             │
│                    │   │                              │
│  Worker N (scale)  │   │  Features:                   │
│  ├─ 4 MT5 terms    │   │  - Row Level Security (RLS)  │
│  └─ Celery worker  │   │  - Real-time subscriptions   │
│                    │   │  - Automatic backups         │
└────────────────────┘   └──────────────────────────────┘
```

### Scaling Strategy

**Horizontal Scaling (Workers):**

| Users | Accounts | Workers Needed | Windows VPS | Monthly Cost |
|-------|----------|----------------|-------------|--------------|
| 0-100 | ~200 | 4 workers | 1 VPS or Home | $0-10 |
| 100-300 | ~600 | 8 workers | 2 VPS | $20 |
| 300-600 | ~1200 | 16 workers | 4 VPS | $40 |
| 600-1200 | ~2400 | 32 workers | 8 VPS | $80 |
| 1200+ | ~2400+ | 40+ workers | 10+ VPS | $100+ |

**Formula:**
- Average sync time per account: 5 seconds
- Target total sync time: 5-10 minutes
- Accounts per worker: 50-75
- Workers needed = Total Accounts ÷ 60 (rounded up)

**Worker Distribution:**
- 4 MT5 terminals per Windows VPS
- Each terminal = 1 Celery worker
- Workers pull jobs from Redis queue automatically
- Linear scaling: 2x users ≈ 2x workers ≈ 2x cost

### Database Schema (Supabase)

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User MT5 Accounts (credentials + metadata)
CREATE TABLE user_mt5_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- MT5 Credentials (encrypted)
  mt5_login BIGINT NOT NULL,
  mt5_password_encrypted TEXT NOT NULL,  -- AES-256 encrypted
  mt5_server TEXT NOT NULL,
  
  -- Metadata
  account_name TEXT,  -- User-friendly name
  account_category TEXT CHECK (account_category IN ('Demo', 'Funded', 'Challenge', 'Real')),
  
  -- Sync status
  is_active BOOLEAN DEFAULT true,
  last_synced TIMESTAMPTZ,
  last_sync_error TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, mt5_login, mt5_server)
);

-- Account Snapshots (time-series data for charts)
CREATE TABLE account_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES user_mt5_accounts(id) ON DELETE CASCADE,
  
  -- Account metrics
  balance NUMERIC(15, 2) NOT NULL,
  equity NUMERIC(15, 2) NOT NULL,
  profit NUMERIC(15, 2) NOT NULL,
  margin NUMERIC(15, 2),
  free_margin NUMERIC(15, 2),
  margin_level NUMERIC(10, 2),
  
  -- Metadata
  currency TEXT DEFAULT 'USD',
  leverage INTEGER,
  
  -- Timestamp
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  
  -- Index for fast queries
  INDEX idx_snapshots_account_time (account_id, timestamp DESC)
);

-- Open Positions (current state)
CREATE TABLE positions (
  ticket BIGINT PRIMARY KEY,
  account_id UUID REFERENCES user_mt5_accounts(id) ON DELETE CASCADE,
  
  -- Position details
  symbol TEXT NOT NULL,
  type TEXT CHECK (type IN ('BUY', 'SELL')) NOT NULL,
  volume NUMERIC(10, 2) NOT NULL,
  price_open NUMERIC(15, 5) NOT NULL,
  price_current NUMERIC(15, 5) NOT NULL,
  sl NUMERIC(15, 5) DEFAULT 0,
  tp NUMERIC(15, 5) DEFAULT 0,
  
  -- Financials
  profit NUMERIC(15, 2) NOT NULL,
  swap NUMERIC(15, 2) DEFAULT 0,
  commission NUMERIC(15, 2) DEFAULT 0,
  
  -- Strategy identifiers
  magic BIGINT DEFAULT 0,
  comment TEXT,
  
  -- Timestamps
  time TIMESTAMPTZ NOT NULL,  -- Position open time
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_positions_account (account_id),
  INDEX idx_positions_symbol (symbol),
  INDEX idx_positions_magic (magic)
);

-- Historical Trades (closed positions)
CREATE TABLE trades (
  ticket BIGINT PRIMARY KEY,
  account_id UUID REFERENCES user_mt5_accounts(id) ON DELETE CASCADE,
  
  -- Trade details
  symbol TEXT NOT NULL,
  type TEXT CHECK (type IN ('BUY', 'SELL')) NOT NULL,
  volume NUMERIC(10, 2) NOT NULL,
  price_open NUMERIC(15, 5) NOT NULL,
  price_close NUMERIC(15, 5) NOT NULL,
  sl NUMERIC(15, 5) DEFAULT 0,
  tp NUMERIC(15, 5) DEFAULT 0,
  
  -- Financials
  profit NUMERIC(15, 2) NOT NULL,
  swap NUMERIC(15, 2) DEFAULT 0,
  commission NUMERIC(15, 2) DEFAULT 0,
  
  -- Strategy identifiers
  magic BIGINT DEFAULT 0,
  comment TEXT,
  
  -- Timestamps
  time TIMESTAMPTZ NOT NULL,  -- Trade open time
  time_close TIMESTAMPTZ NOT NULL,  -- Trade close time
  
  -- Indexes for analytics queries
  INDEX idx_trades_account (account_id),
  INDEX idx_trades_symbol (symbol),
  INDEX idx_trades_magic (magic),
  INDEX idx_trades_time (time DESC),
  INDEX idx_trades_account_time (account_id, time DESC)
);

-- User Settings
CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Preferences
  default_currency TEXT DEFAULT 'USD',
  sync_interval_minutes INTEGER DEFAULT 15,
  timezone TEXT DEFAULT 'UTC',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS) Policies
ALTER TABLE user_mt5_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own accounts" ON user_mt5_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own accounts" ON user_mt5_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own accounts" ON user_mt5_accounts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own accounts" ON user_mt5_accounts
  FOR DELETE USING (auth.uid() = user_id);

-- Similar policies for other tables
CREATE POLICY "Users can view own snapshots" ON account_snapshots
  FOR SELECT USING (
    account_id IN (
      SELECT id FROM user_mt5_accounts WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own positions" ON positions
  FOR SELECT USING (
    account_id IN (
      SELECT id FROM user_mt5_accounts WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own trades" ON trades
  FOR SELECT USING (
    account_id IN (
      SELECT id FROM user_mt5_accounts WHERE user_id = auth.uid()
    )
  );

-- Backend service role can write to all tables (bypass RLS)
-- Use service_role key for worker writes
```

### API Endpoints (FastAPI)

```python
# User Authentication (Supabase handles this)
POST   /auth/signup
POST   /auth/login
POST   /auth/logout

# MT5 Account Management
GET    /api/accounts                    # List user's MT5 accounts
POST   /api/accounts                    # Add new MT5 account
GET    /api/accounts/{id}               # Get account details
PUT    /api/accounts/{id}               # Update account (name, category)
DELETE /api/accounts/{id}               # Remove account
POST   /api/accounts/{id}/sync          # Trigger immediate sync

# Dashboard Data
GET    /api/dashboard/summary           # All accounts summary
GET    /api/dashboard/accounts/{id}     # Single account dashboard

# Analytics
GET    /api/analytics/performance       # Performance metrics
GET    /api/analytics/trades            # Filtered trade list
GET    /api/analytics/equity-curve      # Historical equity data
GET    /api/analytics/breakdown         # EA/Symbol/Magic breakdowns

# Real-time (WebSocket - future)
WS     /ws/positions                    # Live position updates
WS     /ws/account/{id}                 # Live account updates

# Admin/Internal (service role only)
POST   /internal/sync/trigger-all       # Trigger sync for all accounts
GET    /internal/health                 # System health check
```

### Frontend Changes

**Keep Existing:**
- ✅ React + Vite + TypeScript
- ✅ Tailwind CSS v4 dark theme
- ✅ shadcn/ui components
- ✅ Recharts visualizations
- ✅ Existing chart components

**Add New:**
- Account connection flow (add MT5 credentials form)
- Account management page (list, edit, delete accounts)
- Multi-account dashboard view
- Real-time data fetching (replace localStorage)
- API integration layer

**Remove:**
- File upload components
- XLSX parsing (move to backend optional feature)
- localStorage persistence

**New Page Structure:**
```
/login                    # Supabase auth
/dashboard                # Multi-account overview (like QuantFund)
/accounts                 # Manage MT5 connections
/accounts/add             # Add new MT5 account form
/analytics                # Advanced analytics (port from QuantFund)
/settings                 # User preferences
```

---

## Migration Roadmap

### Phase 0: Preparation (Week 1)

**Goal**: Set up development environment and backup data

**Tasks:**
1. ✅ Document current state (this file)
2. Create new git branch: `feature/multi-user-pivot`
3. Backup current Klaro localStorage data structure
4. Set up local Supabase instance for testing
5. Clone QuantFund backend as reference

**Deliverables:**
- PIVOT.md (this document)
- Clean development branch
- Local development environment ready

---

### Phase 1: Home Server Setup (Week 1-2)

**Goal**: Convert ThinkPad to Windows 11 MT5 worker server

**Prerequisites:**
- ⚠️ Backup Arch Linux data
- Purchase Windows 11 Pro license ($100)
- Test home internet upload speed (target: 50+ Mbps)

**Tasks:**

**1.1 Windows Installation**
- Wipe Arch Linux, install Windows 11 Pro
- Configure for 24/7 operation (no sleep, auto-login)
- Install drivers and updates
- Enable Remote Desktop

**1.2 Software Setup**
- Install Python 3.11
- Install 4x MT5 terminals (separate directories)
- Install Git, VS Code
- Configure Windows Firewall

**1.3 MT5 Worker Development**
- Create `worker.py` (Celery worker for MT5 sync)
- Implement MT5 login/data fetch logic
- Add error handling and retry logic
- Create `.env` configuration

**1.4 Service Installation**
- Install as Windows Service
- Configure auto-start on boot
- Test restart resilience

**1.5 Network Setup**
- Install Tailscale VPN
- Connect to private network
- Test remote access

**Deliverables:**
- Working Windows 11 server at home
- 4 MT5 terminals installed
- Celery worker ready to connect to Redis
- Remote access via Tailscale

**Testing:**
- Worker can login to test MT5 account
- Worker fetches account info, positions, history
- Service restarts on reboot
- Remote desktop works

---

### Phase 2: Cloud Infrastructure (Week 2)

**Goal**: Deploy Ubuntu VPS with API, Redis, and scheduler

**2.1 VPS Setup**
- Provision Ubuntu 22.04 VPS (Hetzner CX22, $5-7/mo)
- Configure SSH keys
- Install Docker, Docker Compose
- Install Tailscale VPN

**2.2 Supabase Configuration**
- Create Supabase project (free tier)
- Run database migration (schema from architecture section)
- Configure Row Level Security (RLS) policies
- Test authentication flow
- Get API keys (anon key, service role key)

**2.3 Backend API Development**
```
backend/
├── app/
│   ├── main.py              # FastAPI app
│   ├── config.py            # Settings (Supabase, Redis)
│   ├── models.py            # Pydantic models
│   ├── auth.py              # Supabase auth middleware
│   ├── routers/
│   │   ├── accounts.py      # Account CRUD
│   │   ├── dashboard.py     # Dashboard endpoints
│   │   └── analytics.py     # Analytics endpoints
│   └── services/
│       ├── supabase.py      # Supabase client
│       └── sync.py          # Sync job creation
├── scheduler.py             # Celery Beat scheduler
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
└── .env.example
```

**2.4 Deploy to VPS**
```yaml
# docker-compose.yml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - SUPABASE_URL
      - SUPABASE_SERVICE_KEY
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
  
  scheduler:
    build: .
    command: celery -A scheduler beat --loglevel=info
    environment:
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
  
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - /etc/letsencrypt:/etc/letsencrypt
    depends_on:
      - api

volumes:
  redis_data:
```

**2.5 SSL Setup**
- Configure Nginx reverse proxy
- Install Certbot
- Obtain Let's Encrypt SSL certificate
- Configure auto-renewal

**Deliverables:**
- Ubuntu VPS running at api.klaro.com
- FastAPI + Redis + Celery Beat deployed
- HTTPS configured
- Connected to Supabase
- Health check endpoint working

**Testing:**
- `curl https://api.klaro.com/health` returns 200
- Can create user account via Supabase
- Redis accepts jobs
- Scheduler triggers every 15 minutes

---

### Phase 3: Integration & Testing (Week 3)

**Goal**: Connect home worker to cloud API, test end-to-end sync

**3.1 Connect Worker to Cloud**
- Configure home worker to connect to cloud Redis (via Tailscale)
- Test worker picks up sync jobs
- Verify data writes to Supabase

**3.2 End-to-End Test**
- Create test user account
- Add test MT5 account credentials
- Trigger sync via API
- Verify data in Supabase
- Check for errors in logs

**3.3 Sync Scheduler**
- Configure Celery Beat to trigger syncs every 15 minutes
- Implement job distribution logic (one job per account)
- Test with multiple accounts

**3.4 Error Handling**
- Invalid credentials handling
- Network timeout handling
- MT5 server down handling
- Retry logic testing

**Deliverables:**
- Working sync pipeline: Cloud API → Redis → Home Worker → MT5 → Supabase
- Automated 15-minute sync schedule
- Error handling and logging
- Monitoring dashboard (optional: Grafana)

**Testing Checklist:**
- [ ] Add account via API
- [ ] Sync triggered automatically
- [ ] Data appears in Supabase
- [ ] Invalid credentials rejected gracefully
- [ ] Network failures retry correctly
- [ ] Multiple accounts sync in parallel
- [ ] Position updates reflect in database
- [ ] Historical trades stored correctly

---

### Phase 4: Frontend Adaptation (Week 3-4)

**Goal**: Transform Klaro frontend from file upload to live dashboard

**4.1 Authentication UI**
```tsx
// New pages
src/pages/LoginPage.tsx          # Supabase auth
src/pages/SignupPage.tsx         # User registration
```

**4.2 Account Management**
```tsx
src/pages/AccountsPage.tsx       # List MT5 accounts
src/pages/AddAccountPage.tsx     # Add MT5 credentials form
src/components/AccountCard.tsx   # Account display card
```

**4.3 Dashboard Overhaul**
```tsx
// Modify existing DashboardPage.tsx
- Remove: File upload UI, localStorage logic
- Add: API data fetching, multi-account view
- Keep: Metric cards, charts (adapt for live data)
```

**4.4 API Integration Layer**
```typescript
// src/lib/api.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export async function getAccounts() {
  const { data, error } = await supabase
    .from('user_mt5_accounts')
    .select('*')
  return data
}

export async function getDashboardSummary() {
  const response = await fetch('/api/dashboard/summary', {
    headers: {
      'Authorization': `Bearer ${await getAccessToken()}`
    }
  })
  return response.json()
}
```

**4.5 Port QuantFund Analytics**
- Copy analytics page structure from QuantFund
- Adapt cascading filters (EA → Symbol → Magic)
- Integrate with Klaro's existing chart components

**4.6 Real-time Updates (Optional)**
- Add SWR or React Query for data fetching
- Auto-refresh every 30 seconds
- WebSocket integration (future enhancement)

**Deliverables:**
- Login/signup flow working
- Account management UI functional
- Dashboard shows live data from API
- Analytics page with advanced filters
- Responsive design maintained

**Testing:**
- [ ] User can sign up and login
- [ ] User can add MT5 account
- [ ] Dashboard displays account data
- [ ] Charts update with live data
- [ ] Analytics filters work correctly
- [ ] Mobile responsive

---

### Phase 5: Beta Testing (Week 5-6)

**Goal**: Invite 10-20 beta users, gather feedback

**5.1 Beta Preparation**
- Deploy frontend to Netlify/Vercel
- Create beta signup landing page
- Prepare onboarding documentation
- Set up support channel (Discord/Slack)

**5.2 Beta User Recruitment**
- Post on trading forums (Reddit, ForexFactory)
- Share in algo trading Discord servers
- Invite personal trading network
- Target: 10-20 users with 20-50 total accounts

**5.3 Monitoring & Support**
- Monitor sync success rates
- Track API errors
- Respond to user issues
- Collect feedback on UI/UX

**5.4 Iteration**
- Fix critical bugs
- Improve error messages
- Optimize slow queries
- Enhance UI based on feedback

**Success Criteria:**
- 80%+ of syncs successful
- < 10 minute average sync time
- 90%+ user satisfaction
- Zero critical data loss incidents

---

### Phase 6: Production Launch (Week 7-8)

**Goal**: Public launch with payment integration

**6.1 Pricing & Billing**
- Integrate Stripe or Polar (see STRIPE_MIGRATION_GUIDE.md)
- Implement subscription plans:
  - Free: 1 account, 30 days history
  - Pro: $15/mo - Unlimited accounts, full history
  - Team: $50/mo - 5 users, shared accounts
- Add billing UI (subscription management)

**6.2 Marketing Preparation**
- Create landing page (emphasize value props)
- Prepare demo video
- Write launch blog post
- Set up analytics (Plausible/Fathom)

**6.3 Infrastructure Scaling**
- Add second Windows VPS worker (redundancy)
- Upgrade Supabase to Pro ($25/mo if needed)
- Configure CDN (Cloudflare)
- Set up monitoring (UptimeRobot, Sentry)

**6.4 Launch**
- Announce on Twitter, Reddit, ProductHunt
- Email beta users
- Post in trading communities
- Offer launch discount (first 100 users)

**6.5 Post-Launch**
- Monitor server load
- Scale workers as needed
- Fix bugs reported by users
- Iterate on feedback

**Target Metrics (Month 1):**
- 100 signups
- 50 paying users
- $750 MRR
- 95% uptime

---

### Phase 7: Growth & Optimization (Ongoing)

**7.1 Feature Additions**
- Real-time WebSocket updates
- Mobile app (React Native)
- Email/Telegram alerts (trade notifications)
- Advanced risk analytics
- Drawdown calculations
- Sharpe ratio, Sortino ratio
- Trade journal (add notes to trades)

**7.2 Scaling Infrastructure**
- Add workers as user count grows
- Migrate to dedicated database (if Supabase limits hit)
- Implement caching (Redis for frequently accessed data)
- Optimize database queries

**7.3 Business Development**
- Affiliate program (10% commission for referrals)
- Partnerships with prop firms
- White-label solution for brokers
- API access for developers

---

## Cost Analysis

### MVP Phase (Month 1-3)

**Infrastructure:**
```
Ubuntu VPS (Hetzner CX22):        $7/mo
Supabase (Free tier):             $0/mo
Tailscale VPN:                    $0/mo
Home ThinkPad Worker:             $0/mo (electricity ~$3/mo)
Domain (klaro.com):               $12/year = $1/mo
SSL Certificate:                  $0 (Let's Encrypt)
────────────────────────────────────────
Total Monthly:                    $8/mo
```

**One-time Costs:**
```
Windows 11 Pro License:           $100
Domain Registration:              $12
────────────────────────────────────────
Total One-time:                   $112
```

**First 3 Months Total**: $112 + ($8 × 3) = **$136**

### Growth Phase (Month 4-6, 50-100 users)

**Infrastructure:**
```
Ubuntu VPS (upgraded):            $15/mo
Windows VPS Worker 1:             $10/mo
Supabase (Free tier):             $0/mo
Domain + SSL:                     $1/mo
────────────────────────────────────────
Total Monthly:                    $26/mo
```

**Revenue:**
```
50 users × $15/mo:                $750/mo
Stripe fees (2.9% + $0.30):       -$27/mo
────────────────────────────────────────
Net Revenue:                      $723/mo
```

**Profit Margin**: ($723 - $26) / $723 = **96.4%** 🚀

### Scale Phase (Month 7-12, 200-500 users)

**Infrastructure:**
```
Ubuntu VPS:                       $20/mo
Windows VPS Workers (3x):         $30/mo
Supabase Pro:                     $25/mo
Monitoring (Sentry):              $10/mo
────────────────────────────────────────
Total Monthly:                    $85/mo
```

**Revenue:**
```
300 users × $15/mo:               $4,500/mo
Stripe fees (~3%):                -$135/mo
────────────────────────────────────────
Net Revenue:                      $4,365/mo
```

**Profit Margin**: ($4,365 - $85) / $4,365 = **98.1%** 🚀

### Unit Economics

| Metric | Value |
|--------|-------|
| **Cost per User** (at 300 users) | $0.28/mo |
| **Revenue per User** | $15/mo |
| **Gross Margin per User** | $14.72/mo |
| **LTV (12 month retention)** | $176 |
| **CAC (organic)** | ~$0 |
| **LTV:CAC Ratio** | ∞ (organic growth) |

**Key Insight**: Infrastructure costs scale sub-linearly while revenue scales linearly. Margins improve as you grow.

---

## Risk Assessment

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Home internet outage** | Medium | High | Add cloud VPS worker as backup, Tailscale allows failover |
| **MT5 API rate limiting** | Low | Medium | Implement backoff, use multiple terminals |
| **Data loss (Supabase)** | Very Low | Critical | Daily backups, point-in-time recovery enabled |
| **Worker server failure** | Medium | Medium | Quick VPS spin-up (30 min), keep backup ready |
| **Broker blocks API access** | Low | High | Use dedicated MT5 instances, rotate connections |
| **Supabase free tier limits** | Medium | Low | Upgrade to Pro ($25/mo) when needed |
| **Scaling bottleneck** | Low | Medium | Horizontal scaling proven, can add workers quickly |

### Business Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Low user adoption** | Medium | High | Beta test first, validate demand, offer free trial |
| **Churn (users leave)** | Medium | Medium | Focus on UX, provide value, responsive support |
| **Competitors (MyFxBook, etc.)** | High | Medium | Differentiate on price, UX, features |
| **Broker TOS violations** | Low | Critical | Review broker terms, use read-only API access |
| **Payment processing issues** | Low | Medium | Use Stripe (reliable), have backup (Polar) |
| **Legal/compliance** | Low | High | Add ToS, Privacy Policy, consult lawyer if needed |

### Security Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **MT5 credentials leaked** | Low | Critical | AES-256 encryption, never log passwords, RLS policies |
| **Supabase breach** | Very Low | Critical | Supabase handles security, enable 2FA for admin |
| **DDoS attack** | Low | Medium | Cloudflare protection, rate limiting |
| **SQL injection** | Very Low | High | Supabase ORM prevents this, input validation |
| **XSS attacks** | Low | Medium | React escapes by default, use DOMPurify for UGC |

### Mitigation Strategy

**Backup Plan:**
1. Weekly full database backups to external storage (AWS S3)
2. Disaster recovery playbook (can rebuild infrastructure in 2 hours)
3. Monitoring alerts for downtime (PagerDuty/UptimeRobot)
4. Maintain $500 emergency fund for urgent VPS scaling

**Security Checklist:**
- [x] Supabase RLS policies enabled
- [x] MT5 passwords encrypted at rest
- [x] HTTPS everywhere (no HTTP)
- [x] API authentication required (JWT tokens)
- [x] Input validation on all endpoints
- [x] Rate limiting on auth endpoints
- [x] CORS configured properly
- [x] Environment variables secured (never in git)
- [x] Regular dependency updates (Dependabot)

---

## Success Metrics

### Technical KPIs

| Metric | Target | Measurement |
|--------|--------|-------------|
| **API Uptime** | 99.5%+ | UptimeRobot monitoring |
| **Sync Success Rate** | 95%+ | Worker logs, error tracking |
| **Average Sync Time** | < 8 minutes | Redis job timing |
| **API Response Time** | < 200ms (p95) | FastAPI metrics |
| **Database Query Time** | < 100ms (p95) | Supabase analytics |
| **Error Rate** | < 1% | Sentry error tracking |

### Business KPIs

| Metric | Month 1 | Month 3 | Month 6 | Month 12 |
|--------|---------|---------|---------|----------|
| **Signups** | 50 | 150 | 400 | 1000 |
| **Paying Users** | 20 | 75 | 250 | 600 |
| **MRR** | $300 | $1,125 | $3,750 | $9,000 |
| **Churn Rate** | < 10% | < 8% | < 5% | < 5% |
| **NPS Score** | 40+ | 50+ | 60+ | 70+ |
| **Support Tickets** | < 10/wk | < 20/wk | < 40/wk | < 80/wk |

### User Engagement

| Metric | Target |
|--------|--------|
| **Daily Active Users** | 60%+ |
| **Weekly Active Users** | 85%+ |
| **Avg Session Duration** | 5+ minutes |
| **Accounts per User** | 2.5+ |
| **Feature Adoption (Analytics)** | 70%+ |

### Financial Goals

**Year 1 Projections:**

| Quarter | Users | MRR | ARR | Costs | Profit |
|---------|-------|-----|-----|-------|--------|
| Q1 | 75 | $1,125 | $13,500 | $312 | $13,188 |
| Q2 | 250 | $3,750 | $45,000 | $780 | $44,220 |
| Q3 | 450 | $6,750 | $81,000 | $1,020 | $79,980 |
| Q4 | 600 | $9,000 | $108,000 | $1,320 | $106,680 |

**Year 1 Total Revenue**: $108,000  
**Year 1 Total Costs**: $3,432  
**Year 1 Net Profit**: **$104,568** 🚀

**ROI Calculation:**
- Initial Investment: $136 (MVP setup)
- Year 1 Profit: $104,568
- ROI: 76,800%

---

## Next Steps

### Immediate Actions (This Week)

1. **Create backup of Arch Linux data**
   - Backup ~/Projects (klaro, quantfund code)
   - Backup ~/.ssh keys
   - Backup ~/.config files

2. **Purchase Windows 11 Pro license** ($100)

3. **Test home internet speed**
   ```bash
   # Upload speed test
   curl -s https://raw.githubusercontent.com/sivel/speedtest-cli/master/speedtest.py | python3 -
   ```

4. **Create development branch**
   ```bash
   cd /home/khzrimrn/@khizar/devlab/klaro
   git checkout -b feature/multi-user-pivot
   git add PIVOT.md
   git commit -m "docs: add complete pivot plan to multi-user platform"
   ```

5. **Decision Point: Home Server vs Cloud-Only**
   - Option A: Start with home server (save costs, faster MVP)
   - Option B: Start with cloud Windows VPS (more reliable, easier scaling)
   - **Recommendation**: Option A (validate product first, migrate later)

### Week 1 Plan

**Monday-Tuesday**: Windows Setup
- Wipe laptop, install Windows 11
- Configure for 24/7 operation
- Install all software (Python, MT5, etc.)

**Wednesday-Thursday**: Worker Development
- Create worker.py (adapt from QuantFund)
- Test MT5 connections
- Install as Windows Service

**Friday-Sunday**: Cloud Infrastructure
- Provision Ubuntu VPS
- Deploy FastAPI + Redis
- Set up Supabase database
- Configure Tailscale VPN

### Week 2 Plan

**Monday-Wednesday**: Integration
- Connect home worker to cloud Redis
- End-to-end sync testing
- Error handling implementation

**Thursday-Friday**: Frontend Start
- Create auth pages (login/signup)
- Start account management UI

### Decision Points

Before proceeding, confirm:
- [ ] Home internet speed adequate (50+ Mbps upload)
- [ ] Willing to run laptop 24/7 initially
- [ ] Windows 11 license purchased
- [ ] Comfortable with technical complexity
- [ ] Time commitment available (20-30 hrs/week for 8 weeks)

**Alternative Path (Low-Risk):**
If home server feels risky, start with cloud-only:
- Skip Phase 1 (home server)
- Use cheap Windows VPS ($10/mo) from day 1
- Total initial cost: $17/mo (Ubuntu + Windows VPS)
- Less complexity, more reliable, easier to scale

---

## Appendix

### A. Reference Projects

**QuantFund (Personal):**
- Location: `/home/khzrimrn/@khizar/devlab/quantfund`
- Backend: Python/FastAPI, MT5 integration proven
- Frontend: Next.js, Bloomberg theme, advanced analytics
- Key files to reference:
  - `backend/app/main.py` - FastAPI structure
  - `backend/app/mt5_service.py` - MT5 connection logic
  - `frontend/app/analytics/page.tsx` - Cascading filters pattern
  - `frontend/lib/types.ts` - Data models

**Klaro (Current):**
- Location: `/home/khzrimrn/@khizar/devlab/klaro/frontend`
- Strong foundation: UI components, chart library, type safety
- Files to preserve:
  - `src/components/charts/*` - All chart components
  - `src/components/ui/*` - shadcn/ui components
  - `tailwind.config.js` - OKLCH color system
  - `DASHBOARD_DESIGN.md` - UI specifications

### B. Technology Stack Summary

**Frontend:**
- React 19 + TypeScript
- Vite (build tool)
- Tailwind CSS v4 (OKLCH colors)
- shadcn/ui components
- Recharts (data visualization)
- Supabase JS client (auth + database)

**Backend:**
- Python 3.11
- FastAPI (API framework)
- Celery (distributed task queue)
- Redis (message broker)
- MetaTrader5 library (MT5 integration)
- python-supabase (database client)
- Uvicorn (ASGI server)

**Infrastructure:**
- Ubuntu 22.04 VPS (Hetzner/DigitalOcean)
- Windows 11 Pro (MT5 workers)
- Supabase (PostgreSQL database + auth)
- Tailscale (VPN mesh network)
- Nginx (reverse proxy)
- Let's Encrypt (SSL certificates)
- Docker + Docker Compose (containerization)

**DevOps:**
- Git (version control)
- GitHub Actions (CI/CD)
- Sentry (error tracking)
- UptimeRobot (uptime monitoring)
- Plausible/Fathom (privacy-friendly analytics)

### C. Learning Resources

**MT5 Python API:**
- Official Docs: https://www.mql5.com/en/docs/python_metatrader5
- Community Forum: https://www.mql5.com/en/forum

**FastAPI:**
- Official Docs: https://fastapi.tiangolo.com/
- Tutorial: https://fastapi.tiangolo.com/tutorial/

**Supabase:**
- Docs: https://supabase.com/docs
- Row Level Security: https://supabase.com/docs/guides/auth/row-level-security

**Celery:**
- Docs: https://docs.celeryq.dev/en/stable/
- Windows Setup: https://docs.celeryq.dev/en/stable/userguide/windows.html

### D. Community & Support

**Potential Beta Testers:**
- r/algotrading (Reddit)
- r/Forex (Reddit)
- Forex Factory forums
- Trading View community
- Algo trading Discord servers

**Support Channels:**
- Discord server (create for users)
- Email support (support@klaro.com)
- GitHub issues (for bug reports)

---

## Document Changelog

**Version 1.0** (February 12, 2026)
- Initial comprehensive pivot plan
- Covers current state through production launch
- Includes cost analysis, risk assessment, success metrics
- Based on QuantFund reference implementation

**Next Review**: End of Phase 1 (after home server setup)

---

**Ready to proceed?** Start with Phase 0 tasks and confirm decision on home server vs cloud-only approach.
