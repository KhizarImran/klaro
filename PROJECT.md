# Klaro - Multi-User MT5 Trading Dashboard

**Live MT5 Analytics Platform for Algorithmic Traders**

---

## 🎯 Vision

Transform Klaro from a file-upload analytics tool into a live SaaS platform where traders connect their MT5 accounts and get real-time analytics, performance tracking, and fund management insights.

**Target Users:** Algorithmic traders, prop traders, fund managers  
**Business Model:** $15/month subscription  
**Tech Stack:** React + TypeScript + Python/FastAPI + Supabase + MT5 API

---

## 📊 Current State vs Target State

| Aspect | Current | Target |
|--------|---------|--------|
| **Users** | Single user, manual uploads | Multi-user SaaS |
| **Data Source** | Static XLSX files | Live MT5 connections |
| **Storage** | Browser localStorage | Supabase PostgreSQL |
| **Backend** | None | Python/FastAPI + Celery |
| **Accounts** | One report at a time | Multiple MT5 accounts per user |
| **Updates** | Manual re-upload | Auto-sync every 15 min |
| **Analytics** | Trade history only | Live positions + history + advanced analytics |

---

## 🏗️ Architecture Overview

### The System

```
Users (browsers)
    ↓
Ubuntu VPS ($15/mo)
├── FastAPI (API endpoints)
├── Redis (job queue)
├── Celery Beat (scheduler)
└── Nginx + SSL
    ↓ (Tailscale VPN)
    ↓
Windows Server (Home laptop or VPS)
├── 4 MT5 Terminals
└── 4 Celery Workers
    ├── Login to user MT5 accounts
    ├── Fetch data every 15 min
    └── Write to Supabase
    ↓
Supabase (PostgreSQL)
├── User accounts
├── MT5 credentials (encrypted)
├── Account snapshots
├── Positions
└── Trades
```

### How It Works

1. **User adds MT5 account** (login, password, server)
2. **Credentials encrypted** and stored in Supabase
3. **Every 15 minutes**: Celery Beat creates sync jobs
4. **Workers pick up jobs** from Redis queue
5. **Worker logs into MT5** using Python MetaTrader5 library
6. **Fetches data**: Balance, equity, positions, trade history
7. **Stores in Supabase** database
8. **Frontend reads** from Supabase and displays live dashboard

---

## 💾 Database Schema

### Core Tables

**user_mt5_accounts** - User's connected MT5 accounts
```sql
- id (UUID)
- user_id (UUID, references auth.users)
- mt5_login (BIGINT)
- mt5_password_encrypted (TEXT) -- AES-256 encrypted
- mt5_server (TEXT)
- account_name (TEXT) -- User-friendly name
- account_category (TEXT) -- Demo/Funded/Challenge/Real
- is_active (BOOLEAN)
- last_synced (TIMESTAMPTZ)
- created_at (TIMESTAMPTZ)
```

**account_snapshots** - Time-series balance/equity data
```sql
- id (UUID)
- account_id (UUID, references user_mt5_accounts)
- balance (NUMERIC)
- equity (NUMERIC)
- profit (NUMERIC)
- margin (NUMERIC)
- margin_level (NUMERIC)
- timestamp (TIMESTAMPTZ)
```

**positions** - Current open positions
```sql
- ticket (BIGINT, PK)
- account_id (UUID)
- symbol (TEXT)
- type (TEXT) -- BUY/SELL
- volume (NUMERIC)
- price_open (NUMERIC)
- price_current (NUMERIC)
- sl, tp (NUMERIC)
- profit (NUMERIC)
- magic (BIGINT)
- comment (TEXT)
- time (TIMESTAMPTZ)
```

**trades** - Historical closed trades
```sql
- ticket (BIGINT, PK)
- account_id (UUID)
- symbol (TEXT)
- type (TEXT)
- volume (NUMERIC)
- price_open, price_close (NUMERIC)
- profit (NUMERIC)
- magic (BIGINT)
- comment (TEXT)
- time, time_close (TIMESTAMPTZ)
```

**subscriptions** - Stripe billing
```sql
- id (UUID)
- user_id (UUID)
- stripe_subscription_id (TEXT)
- stripe_customer_id (TEXT)
- status (TEXT) -- active/canceled/past_due
- current_period_end (TIMESTAMPTZ)
```

---

## 🔧 Backend Setup

### Ubuntu VPS (Cloud)

**Tech:** FastAPI + Redis + Celery Beat + Docker

**API Endpoints:**
```
POST   /api/accounts              # Add MT5 account
GET    /api/accounts              # List user's accounts
DELETE /api/accounts/{id}         # Remove account
POST   /api/accounts/{id}/sync    # Trigger manual sync
GET    /api/dashboard/summary     # All accounts summary
GET    /api/analytics/*           # Performance analytics
```

**Deployment:**
```bash
# docker-compose.yml
services:
  api:
    build: .
    ports: ["8000:8000"]
    environment:
      - SUPABASE_URL
      - REDIS_URL=redis://redis:6379
  
  redis:
    image: redis:7-alpine
  
  scheduler:
    build: .
    command: celery -A scheduler beat
  
  nginx:
    image: nginx:alpine
    ports: ["80:80", "443:443"]
```

### Windows Server (Home or Cloud)

**Tech:** Windows 11 + Python + MT5 + Celery Workers

**Setup:**
```
C:\MT5-Terminal-1\     # First MT5 instance
C:\MT5-Terminal-2\     # Second MT5 instance
C:\MT5-Terminal-3\     # Third MT5 instance
C:\MT5-Terminal-4\     # Fourth MT5 instance
C:\worker\
  ├── worker.py        # Celery worker script
  └── .env            # Config (Redis URL, Supabase keys)
```

**Worker Code (Simplified):**
```python
from celery import Celery
import MetaTrader5 as mt5
from supabase import create_client

app = Celery('mt5_worker', broker='redis://ubuntu-vps:6379')
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

TERMINALS = [
    r"C:\MT5-Terminal-1\terminal64.exe",
    r"C:\MT5-Terminal-2\terminal64.exe",
    r"C:\MT5-Terminal-3\terminal64.exe",
    r"C:\MT5-Terminal-4\terminal64.exe"
]

@app.task
def sync_account(account_id, terminal_index):
    # Get credentials from Supabase
    account = supabase.table('user_mt5_accounts')\
        .select('*').eq('id', account_id).single()
    
    # Initialize MT5 with specific terminal
    mt5.initialize(path=TERMINALS[terminal_index])
    
    # Login
    mt5.login(
        account['mt5_login'],
        decrypt(account['mt5_password_encrypted']),
        account['mt5_server']
    )
    
    # Fetch account info
    info = mt5.account_info()
    positions = mt5.positions_get()
    history = mt5.history_deals_get(from_date, to_date)
    
    # Store in Supabase
    supabase.table('account_snapshots').insert({
        'account_id': account_id,
        'balance': info.balance,
        'equity': info.equity,
        'profit': info.profit,
        # ... more fields
    })
    
    # Update positions
    supabase.table('positions').delete().eq('account_id', account_id)
    supabase.table('positions').insert([...positions])
    
    # Cleanup
    mt5.shutdown()
```

**Install as Windows Service:**
```powershell
# Install Python packages
pip install celery redis MetaTrader5 supabase-py cryptography

# Install as service
python install_service.py install
sc config MT5Worker start= auto
sc start MT5Worker
```

---

## 🎨 Frontend Changes

### Keep Existing ✅
- React + Vite + TypeScript
- Tailwind CSS v4 (OKLCH dark theme)
- shadcn/ui components
- Recharts visualizations
- Existing chart components

### Add New 🆕
- Account connection flow (add MT5 credentials)
- Account management page (list, edit, delete)
- Multi-account dashboard view
- Real-time data fetching (replace localStorage)
- API integration layer

### Remove ❌
- File upload components
- XLSX parsing (keep for optional import feature)
- localStorage persistence (move to Supabase)

### New Page Structure
```
/login                    # Supabase auth
/signup                   # User registration
/dashboard                # Multi-account overview
/accounts                 # Manage MT5 connections
/accounts/add             # Add new MT5 account form
/analytics                # Advanced analytics
/settings                 # User preferences + billing
```

---

## 💰 Pricing & Business Model

### Subscription Plans

**Free Tier:**
- 1 MT5 account
- 30 days history
- Basic analytics

**Pro - $15/month:**
- Unlimited MT5 accounts
- Unlimited history
- Advanced analytics (EA breakdown, symbol analysis)
- Priority support

**Future - Usage-Based:**
- $5/mo base + $2 per MT5 account
- Fairer for users with few accounts
- More revenue from power users

### Revenue Projections

| Month | Users | MRR | Costs | Profit |
|-------|-------|-----|-------|--------|
| 1 | 20 | $300 | $15 | $285 |
| 3 | 75 | $1,125 | $25 | $1,100 |
| 6 | 250 | $3,750 | $45 | $3,705 |
| 12 | 600 | $9,000 | $85 | $8,915 |

**Year 1 ARR: $108,000 on ~$1,000 infrastructure costs** 🚀

---

## 📈 Scaling Strategy

### Infrastructure Scaling

| Users | Accounts | Workers | VPS Needed | Monthly Cost | Sync Time |
|-------|----------|---------|------------|--------------|-----------|
| 0-100 | ~200 | 4 | 1 Ubuntu + Home | $15 | 4 min |
| 100-300 | ~600 | 8 | 1 Ubuntu + 1 Win | $25 | 5 min |
| 300-600 | ~1200 | 16 | 1 Ubuntu + 2 Win | $35 | 6 min |
| 600-1200 | ~2400 | 32 | 1 Ubuntu + 4 Win | $55 | 7 min |

**Formula:**
- 4 workers per Windows VPS (4 MT5 terminals)
- Each worker syncs 50-75 accounts (5 sec per account)
- Target sync time: 5-10 minutes

**Cost Efficiency:**
- Month 1: $0.75/user
- Month 3: $0.33/user
- Month 6: $0.18/user
- Month 12: $0.14/user

Margins improve as you scale! 💪

---

## 🛣️ Implementation Roadmap

### Phase 1: MVP Backend (Week 1-2)

**Goal:** Get MT5 sync working end-to-end

**Tasks:**
1. Set up Windows 11 on ThinkPad (or rent Windows VPS)
2. Install 4 MT5 terminals
3. Write `worker.py` Celery worker
4. Install as Windows Service
5. Set up Ubuntu VPS
6. Deploy FastAPI + Redis + Celery Beat
7. Create Supabase database schema
8. Test: Add account → Sync → Data in database ✅

**Deliverable:** Working backend that syncs MT5 data

---

### Phase 2: Frontend Adaptation (Week 3)

**Goal:** Transform UI from file uploads to live data

**Tasks:**
1. Create account management pages
2. Replace localStorage with Supabase queries
3. Add "Add MT5 Account" form (login/password/server)
4. Update dashboard to show multi-account view
5. Add real-time data refresh (30s polling)
6. Port QuantFund analytics page (EA/Symbol breakdowns)

**Deliverable:** Working frontend connected to backend

---

### Phase 3: Integration & Testing (Week 4)

**Goal:** Polish and test with real accounts

**Tasks:**
1. Add error handling (invalid credentials, network failures)
2. Implement retry logic for failed syncs
3. Add loading states and skeleton screens
4. Test with multiple MT5 accounts (demo accounts)
5. Fix bugs, optimize queries
6. Add user onboarding flow

**Deliverable:** Stable, tested application

---

### Phase 4: Beta Launch (Week 5-6)

**Goal:** Validate with real users

**Tasks:**
1. Invite 10-20 beta testers (trading communities)
2. Free access in exchange for feedback
3. Monitor sync success rates
4. Fix critical bugs
5. Improve UX based on feedback
6. Validate demand (are people actually using it?)

**Success Criteria:**
- 80%+ sync success rate
- <10 min average sync time
- 90%+ user satisfaction
- Users logging in daily

---

### Phase 5: Payment Integration (Week 7)

**Goal:** Add Stripe and enable billing

**Tasks:**
1. Install `@stripe/stripe-js` package
2. Create Stripe account, get API keys
3. Create product ($15/mo subscription)
4. Deploy Supabase Edge Functions:
   - `create-checkout-session`
   - `stripe-webhook`
5. Set up Stripe webhook
6. Test checkout with test cards
7. Implement free tier limits (1 account, 30 days)

**Deliverable:** Users can subscribe and pay

---

### Phase 6: Public Launch (Week 8)

**Goal:** Launch to the world

**Pre-Launch:**
1. Create landing page with value prop
2. Record demo video (2-3 min)
3. Write launch blog post
4. Prepare social media posts
5. Set up analytics (Plausible/Fathom)
6. Add monitoring (Sentry for errors, UptimeRobot)

**Launch Day:**
1. Post on Product Hunt
2. Share on Twitter/X
3. Post in trading subreddits (r/algotrading, r/Forex)
4. Post on Forex Factory forums
5. Email beta users
6. Launch discount: First 100 users get 20% off

**Post-Launch:**
1. Monitor server load
2. Respond to user questions
3. Fix bugs quickly
4. Scale workers as needed

**Target Metrics (Month 1):**
- 100 signups
- 50 paying users
- $750 MRR
- 95%+ uptime

---

## 🔐 Security Considerations

### Credentials Storage
- MT5 passwords encrypted with AES-256
- Encryption key stored in environment variables
- Never log passwords
- Use Supabase Row Level Security (RLS)

### API Security
- JWT authentication (Supabase)
- Rate limiting on auth endpoints
- HTTPS everywhere (Let's Encrypt SSL)
- CORS configured properly
- Input validation on all endpoints

### Infrastructure
- Tailscale VPN for worker communication (encrypted)
- Firewall rules (only necessary ports open)
- Regular dependency updates
- Monitoring and alerts

---

## 🎯 Success Metrics

### Technical KPIs
- API uptime: 99.5%+
- Sync success rate: 95%+
- Average sync time: <8 minutes
- API response time: <200ms (p95)
- Error rate: <1%

### Business KPIs
- Monthly Recurring Revenue (MRR)
- Churn rate: <5%
- Customer Acquisition Cost (CAC)
- Lifetime Value (LTV)
- Net Promoter Score (NPS): 60+

### User Engagement
- Daily Active Users: 60%+
- Weekly Active Users: 85%+
- Avg accounts per user: 2.5+
- Feature adoption (analytics): 70%+

---

## ⚠️ Risks & Mitigations

### Technical Risks

**Home internet outage**
- Mitigation: Add cloud Windows VPS as backup, Tailscale allows failover

**Broker blocks API access**
- Mitigation: Use dedicated MT5 instances, rotate connections, respect rate limits

**Database data loss**
- Mitigation: Daily Supabase backups, point-in-time recovery enabled

**Worker server failure**
- Mitigation: Quick VPS spin-up (30 min), multiple workers for redundancy

### Business Risks

**Low user adoption**
- Mitigation: Validate with waitlist/beta first, offer free trial

**High churn**
- Mitigation: Focus on UX, provide value, responsive support

**Competitors (MyFxBook, etc.)**
- Mitigation: Differentiate on price, UX, features, privacy

### Security Risks

**MT5 credentials leaked**
- Mitigation: AES-256 encryption, never log passwords, RLS policies

**DDoS attack**
- Mitigation: Cloudflare protection, rate limiting

**SQL injection**
- Mitigation: Supabase ORM prevents this, input validation

---

## 💻 Technology Stack Summary

### Frontend
- React 19 + TypeScript
- Vite (build tool)
- Tailwind CSS v4 (OKLCH colors)
- shadcn/ui components
- Recharts (charts)
- React Router (routing)
- Supabase JS client

### Backend
- Python 3.11
- FastAPI (API framework)
- Celery (task queue)
- Redis (message broker)
- MetaTrader5 library
- python-supabase
- Uvicorn (ASGI server)

### Infrastructure
- Ubuntu 22.04 VPS (API server)
- Windows 11 Pro (MT5 workers)
- Supabase (PostgreSQL + auth)
- Tailscale (VPN)
- Nginx (reverse proxy)
- Let's Encrypt (SSL)
- Docker + Docker Compose

### DevOps
- Git + GitHub
- GitHub Actions (CI/CD)
- Sentry (error tracking)
- UptimeRobot (monitoring)
- Plausible (analytics)

### Payments
- Stripe (subscriptions)
- Supabase Edge Functions (webhooks)

---

## 🚀 Quick Start Guide

### For Development

**1. Clone and install:**
```bash
git clone https://github.com/yourusername/klaro.git
cd klaro/frontend
npm install
```

**2. Set up Supabase:**
- Create project at supabase.com
- Run SQL migrations (see database schema above)
- Get API keys

**3. Configure environment:**
```bash
# frontend/.env.local
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
```

**4. Run dev server:**
```bash
npm run dev
# Open http://localhost:5173
```

### For Production Deployment

See detailed steps in Phase 1-6 of Implementation Roadmap.

---

## 📚 Key Reference Projects

### QuantFund (Your Personal Project)
- Location: `/home/khzrimrn/@khizar/devlab/quantfund`
- Proves: MT5 backend works, UI patterns validated
- Backend: Python/FastAPI with MT5 integration
- Frontend: Next.js with Bloomberg theme
- **Use as reference** for backend code and analytics UI

### Current Klaro
- Location: `/home/khzrimrn/@khizar/devlab/klaro`
- Strengths: XLSX parser, chart components, type safety
- **Keep**: UI components, charts, parsers (for import feature)
- **Replace**: localStorage with Supabase, file uploads with live sync

---

## 🎓 Learning Resources

- **MT5 Python API:** https://www.mql5.com/en/docs/python_metatrader5
- **FastAPI:** https://fastapi.tiangolo.com/
- **Supabase:** https://supabase.com/docs
- **Celery:** https://docs.celeryq.dev/
- **Stripe:** https://stripe.com/docs/api

---

## 📞 Support & Community

- GitHub Issues: Report bugs, request features
- Discord: (create community server when launching)
- Email: support@klaro.com
- Twitter: @klaroapp

---

## 📝 License

MIT License - See LICENSE file

---

## ⚡ Next Steps

**This Week:**
1. Decide: Home server or cloud Windows VPS?
2. Set up Windows 11 (wipe Arch Linux or rent VPS)
3. Install MT5 terminals
4. Write worker.py
5. Test MT5 connection locally

**Next Week:**
1. Set up Ubuntu VPS
2. Deploy FastAPI + Redis
3. Create Supabase schema
4. Connect worker to cloud
5. Test end-to-end sync

**Week 3:**
1. Adapt frontend for live data
2. Build account management UI
3. Test with demo MT5 accounts

**Week 4-6:**
1. Polish and test
2. Beta launch with 10-20 users
3. Gather feedback, iterate

**Week 7-8:**
1. Add Stripe payment
2. Public launch
3. Marketing push

---

**Last Updated:** February 13, 2026  
**Status:** Planning → Implementation starting soon  
**Goal:** Launch MVP in 8 weeks, $1,000 MRR in 3 months, $10,000 MRR in 12 months

---

Built with ❤️ for algorithmic traders
