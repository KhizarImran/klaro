# Klaro

**Live MT5 Analytics Platform for Algorithmic Traders**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19+-61DAFB)](https://reactjs.org/)
[![Python](https://img.shields.io/badge/Python-3.11+-blue)](https://www.python.org/)

---

## What is Klaro?

Klaro is a **multi-user SaaS platform** where algorithmic traders connect their MT5 accounts and get real-time analytics, performance tracking, and fund management insights.

**Connect your MT5 accounts → Auto-sync every 15 minutes → Live dashboard with advanced analytics**

---

## Features

- 🔌 **Connect Multiple MT5 Accounts** - Link unlimited demo, live, prop, or challenge accounts
- 📊 **Live Performance Monitoring** - Real-time balance, equity, and position tracking
- 📈 **Advanced Analytics** - EA performance, symbol breakdowns, time-based analysis
- 📉 **Trade History Database** - Unlimited historical data retention
- 🔄 **Auto-Sync** - Data updates every 15 minutes automatically
- 🎨 **Beautiful Dashboard** - Bloomberg terminal-inspired dark theme
- 💰 **Multi-Account Aggregation** - View total fund performance across all accounts

---

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+ (for backend)
- Supabase account
- MT5 account(s) for testing

### Frontend Setup

```bash
git clone https://github.com/yourusername/klaro.git
cd klaro/frontend
npm install
npm run dev
```

### Backend Setup

See **[PROJECT.md](PROJECT.md)** for complete implementation guide.

---

## Project Structure

```
klaro/
├── frontend/          # React + Vite + TypeScript
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── pages/        # Dashboard, analytics, settings
│   │   ├── utils/        # MT5 parsers, API clients
│   │   └── types/        # TypeScript definitions
│   └── package.json
│
├── backend/           # Python/FastAPI (coming soon)
│   ├── app/
│   │   ├── main.py       # FastAPI routes
│   │   ├── worker.py     # Celery worker for MT5 sync
│   │   └── models.py     # Data models
│   └── requirements.txt
│
├── PROJECT.md         # 📘 Complete implementation plan
└── README.md          # This file
```

---

## Tech Stack

**Frontend:**
- React 19 + TypeScript + Vite
- Tailwind CSS v4 (OKLCH colors)
- shadcn/ui components
- Recharts visualizations

**Backend:**
- Python 3.11 + FastAPI
- Celery (task queue)
- Redis (message broker)
- MetaTrader5 library (MT5 API)

**Infrastructure:**
- Supabase (PostgreSQL + auth)
- Ubuntu VPS (API server)
- Windows Server (MT5 workers)
- Stripe (payments)

---

## Development Status

🚧 **Currently pivoting from file-upload tool to live SaaS platform**

**Completed:**
- ✅ File upload analytics (XLSX parser)
- ✅ Dashboard UI with charts
- ✅ Supabase authentication
- ✅ Type-safe data models

**In Progress:**
- 🔄 Backend MT5 sync infrastructure
- 🔄 Multi-account support
- 🔄 Stripe payment integration

**Roadmap:**
- Week 1-2: Backend setup (workers, API)
- Week 3: Frontend adaptation
- Week 4: Integration & testing
- Week 5-6: Beta launch
- Week 7: Payment integration
- Week 8: Public launch

See **[PROJECT.md](PROJECT.md)** for detailed roadmap.

---

## Documentation

- **[PROJECT.md](PROJECT.md)** - Complete project documentation
  - Architecture overview
  - Database schema
  - Implementation roadmap (8-week plan)
  - Scaling strategy
  - Cost analysis & projections
  - Security considerations

- **[frontend/CLAUDE.md](frontend/CLAUDE.md)** - Frontend architecture guide

---

## Business Model

**Free Tier:**
- 1 MT5 account
- 30 days history

**Pro - $15/month:**
- Unlimited MT5 accounts
- Unlimited history
- Advanced analytics
- Priority support

**Target:** $10k MRR in 12 months

---

## Contributing

This is currently a solo project, but contributions are welcome once we launch!

---

## License

MIT License - See LICENSE file for details

---

## Disclaimer

This software is for informational and educational purposes only. It does not constitute financial advice. Trading involves substantial risk and is not suitable for every investor. Past performance is not indicative of future results.

---

**Built with ❤️ for algorithmic traders**
