# Klaro Dashboard UI/UX Design Document

Based on MT5 Trade History Report Analysis

---

## Dashboard Layout Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER: Logo | Navigation | Account Switcher | User Menu       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  SECTION 1: ACCOUNT OVERVIEW (Key Metrics Cards)                │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐      │
│  │ Balance  │  Equity  │ Profit   │ Win Rate │ Drawdown │      │
│  │ $5,978   │ $5,978   │ -$21.22  │  33.33%  │  7.75%   │      │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘      │
│                                                                   │
│  SECTION 2: PERFORMANCE CHART                                    │
│  ┌───────────────────────────────────────────────────────┐      │
│  │  Equity Curve Chart (Time Series)                     │      │
│  │  [Interactive line chart showing balance over time]   │      │
│  └───────────────────────────────────────────────────────┘      │
│                                                                   │
│  SECTION 3: STATISTICS GRID                                      │
│  ┌──────────────────────┬──────────────────────┐                │
│  │  Trading Stats       │  Risk Metrics        │                │
│  │  - Total Trades: 60  │  - Profit Factor: 0.99│               │
│  │  - Avg Win: $71.92   │  - Sharpe Ratio: 0.01│                │
│  │  - Avg Loss: -$36.49 │  - Recovery: -0.04   │                │
│  └──────────────────────┴──────────────────────┘                │
│                                                                   │
│  SECTION 4: RECENT TRADES TABLE                                  │
│  ┌───────────────────────────────────────────────────────┐      │
│  │ Time  │ Symbol │ Type │ Volume │ P/L │ Duration │ ... │      │
│  │ ...   │ ...    │ ...  │ ...    │ ... │ ...      │ ... │      │
│  └───────────────────────────────────────────────────────┘      │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Detailed Component Breakdown

### 1. **Header Section**
- Logo (Klaro with TrendingUp icon)
- Navigation tabs: Dashboard | Analytics | Strategies | Settings
- Account switcher dropdown (for multiple MT5 accounts)
- User menu (profile, sign out)

### 2. **Account Overview Cards** (5 Key Metrics)

#### Card 1: Balance
```
┌─────────────────┐
│ 💰 Balance      │
│ $5,978.78       │  ← Large, bold number
│ ────────────    │
│ Deposit: $6,000 │  ← Secondary info
└─────────────────┘
```

#### Card 2: Equity
```
┌─────────────────┐
│ 📊 Equity       │
│ $5,978.78       │
│ ────────────    │
│ Margin: $0.00   │
└─────────────────┘
```

#### Card 3: Net Profit/Loss
```
┌─────────────────┐
│ 💵 Net P/L      │
│ -$21.22         │  ← Red if negative, green if positive
│ ────────────    │
│ -0.35% ROI      │
└─────────────────┘
```

#### Card 4: Win Rate
```
┌─────────────────┐
│ 🎯 Win Rate     │
│ 33.33%          │
│ ────────────    │
│ 20W / 40L       │  ← Green/Red split
└─────────────────┘
```

#### Card 5: Max Drawdown
```
┌─────────────────┐
│ ⚠️  Drawdown    │
│ 7.75%           │  ← Color-coded by severity
│ ────────────    │
│ $476.90 max     │
└─────────────────┘
```

**Design Notes:**
- Dark background (oklch(14% 0.01 240))
- Border: oklch(25% 0.01 240)
- Positive values: Emerald-500
- Negative values: Red-500
- Icons from lucide-react

---

### 3. **Equity Curve Chart**

```
┌──────────────────────────────────────────────────────┐
│  Balance & Equity Over Time                          │
│  [Time Range Selector: 1D | 1W | 1M | 3M | 1Y | All] │
│                                                       │
│  $6,200 ┤                                             │
│         │     ╱╲                                      │
│  $6,000 ┤────╱  ╲──╲                                  │
│         │          ╲  ╱╲                              │
│  $5,800 ┤           ╲╱  ╲                             │
│         │                ╲                            │
│  $5,600 ┤                 ╲___                        │
│         └────────────────────────────────────         │
│         Dec 24    Jan 02    Jan 15    Jan 30         │
│                                                       │
│  Legend: ─── Balance   ─── Equity                    │
└──────────────────────────────────────────────────────┘
```

**Features:**
- Interactive tooltips on hover
- Zoom/pan capabilities
- Highlight drawdown periods (red shading)
- Mark significant events (large wins/losses)
- Use Recharts library

---

### 4. **Statistics Grid**

#### Left Column: Trading Statistics
```
┌─────────────────────────────────┐
│  📈 Trading Statistics          │
├─────────────────────────────────┤
│  Total Trades         60        │
│  ────────────────────────       │
│  Long Trades          37        │
│  └─ Won               24.32%    │
│                                 │
│  Short Trades         23        │
│  └─ Won               47.83%    │
│  ────────────────────────       │
│  Profit Trades        20        │
│  Loss Trades          40        │
│  ────────────────────────       │
│  Largest Win          $179.64   │  ← Green
│  Largest Loss         -$92.64   │  ← Red
│  ────────────────────────       │
│  Average Win          $71.92    │
│  Average Loss         -$36.49   │
│  ────────────────────────       │
│  Max Consecutive Wins  5 ($78)  │
│  Max Consecutive Loss  12 (-$470)│
└─────────────────────────────────┘
```

#### Right Column: Risk Metrics
```
┌─────────────────────────────────┐
│  ⚡ Risk & Performance Metrics  │
├─────────────────────────────────┤
│  Profit Factor        0.99      │  ← Color-coded
│  └─ Target: > 1.5              │
│                                 │
│  Sharpe Ratio         0.01      │
│  └─ Target: > 1.0              │
│                                 │
│  Recovery Factor      -0.04     │
│  └─ Target: > 2.0              │
│  ────────────────────────       │
│  Expected Payoff      -$0.35    │
│  ────────────────────────       │
│  Gross Profit         $1,438.32 │
│  Gross Loss           -$1,459.54│
│  Net Profit           -$21.22   │
│  ────────────────────────       │
│  Balance Drawdown                │
│  └─ Absolute          $0.00     │
│  └─ Maximal           $476.90   │
│  └─ Relative          7.75%     │
└─────────────────────────────────┘
```

**Design Notes:**
- Add "ℹ️" tooltips explaining each metric
- Color-code metrics based on good/bad thresholds
- Show targets/benchmarks for key ratios

---

### 5. **Recent Trades Table**

```
┌────────────────────────────────────────────────────────────────────────────┐
│  📋 Trade History                                    [Export CSV] [Filter] │
├────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┬────────┬──────┬────────┬─────────┬─────────┬─────────┐ │
│  │ Date/Time    │ Symbol │ Type │ Volume │ Entry   │ Exit    │ P/L     │ │
│  ├──────────────┼────────┼──────┼────────┼─────────┼─────────┼─────────┤ │
│  │ 2024.12.24   │ EURJPY │ BUY  │ 0.20   │ 163.140 │ 163.733 │ +$75.31 │ │  ← Green row
│  │ 05:48:00     │        │      │        │         │         │         │ │
│  ├──────────────┼────────┼──────┼────────┼─────────┼─────────┼─────────┤ │
│  │ 2024.12.24   │ GBPJPY │ BUY  │ 0.23   │ 196.664 │ 197.168 │ +$73.77 │ │  ← Green row
│  │ 06:08:28     │        │      │        │         │         │         │ │
│  ├──────────────┼────────┼──────┼────────┼─────────┼─────────┼─────────┤ │
│  │ 2024.12.27   │ GBPUSD │ SELL │ 0.24   │ 1.25329 │ 1.25365 │ -$8.64  │ │  ← Red row
│  │ 10:01:10     │        │      │        │         │         │         │ │
│  └──────────────┴────────┴──────┴────────┴─────────┴─────────┴─────────┘ │
│                                                                            │
│  [Load More]                                          Showing 1-10 of 60  │
└────────────────────────────────────────────────────────────────────────────┘
```

**Features:**
- Expandable rows (click to see S/L, T/P, Commission, Swap details)
- Filter by: Symbol, Type, Date Range, Profit/Loss
- Sort by any column
- Color-coded P/L (green/red)
- Badge for trade type (BUY/SELL)
- Pagination or infinite scroll

---

### 6. **Additional Dashboard Sections** (Optional/Expandable)

#### A. **Symbol Performance Breakdown**
```
┌─────────────────────────────────┐
│  🌍 Performance by Symbol       │
├─────────────────────────────────┤
│  EURJPY    +$75.31  (1 trade)   │  ███████░░ 70%
│  GBPJPY    +$73.77  (1 trade)   │  ██████░░░ 60%
│  GBPUSD    -$66.39  (2 trades)  │  ░░░░░░░░░ 0%
│  ...                             │
└─────────────────────────────────┘
```

#### B. **Trading Hours Heatmap**
```
┌─────────────────────────────────┐
│  🕐 Trading Activity Heatmap    │
├─────────────────────────────────┤
│  Mon  ░░░██████░░░░░░░░░░░░░    │
│  Tue  ░░░░░████████░░░░░░░░░    │
│  Wed  ░░░░░░░░██████████░░░░    │
│  ...                             │
│       0  4  8  12 16 20  24h    │
└─────────────────────────────────┘
```

#### C. **Win/Loss Distribution Chart**
```
┌─────────────────────────────────┐
│  📊 P/L Distribution            │
├─────────────────────────────────┤
│  [Histogram showing frequency   │
│   of wins/losses by size]       │
│                                 │
│  Most common win: $70-80        │
│  Most common loss: $30-40       │
└─────────────────────────────────┘
```

---

## Color Scheme (Based on Current Theme)

### Background Colors:
- Page background: `oklch(10% 0.01 240)` (very dark blue)
- Card background: `oklch(14% 0.01 240)` (slightly lighter)
- Border: `oklch(25% 0.01 240)` (subtle border)

### Accent Colors:
- **Positive/Profit**: `emerald-500` (#10b981)
- **Negative/Loss**: `red-500` (#ef4444)
- **Neutral**: `oklch(65% 0.01 240)` (gray text)
- **Warning**: `amber-500` (#f59e0b)

### Typography:
- Headers: Bold, 24-32px
- Large numbers: Bold, 28-36px
- Body: Regular, 14-16px
- Small text: 12-14px

---

## Responsive Design Breakpoints

### Desktop (1920px+):
- 5 metric cards in one row
- Side-by-side stats grid
- Full-width table

### Laptop (1280px-1919px):
- 5 metric cards in one row (slightly smaller)
- Side-by-side stats grid
- Full-width table

### Tablet (768px-1279px):
- 3 cards per row (top row)
- 2 cards on second row
- Stacked stats grid
- Horizontal scroll on table

### Mobile (< 768px):
- 1 card per row
- Stacked layout
- Simplified table (key columns only)
- Swipe to see more trade details

---

## Interactive Features

### 1. **Account Switcher**
- Dropdown in header to switch between multiple connected MT5 accounts
- Shows: Account number, broker, current balance

### 2. **Date Range Filter**
- Global filter affecting all charts/stats
- Presets: Today | This Week | This Month | This Year | All Time | Custom

### 3. **Real-time Updates**
- WebSocket connection for live price updates
- Auto-refresh account data every 30 seconds
- Visual indicator when data is updating

### 4. **Export Options**
- Export trades to CSV
- Export performance report as PDF
- Copy metrics to clipboard

### 5. **Tooltips & Help**
- Hover tooltips explaining metrics
- "ℹ️" icons with detailed explanations
- Link to documentation for complex metrics

---

## Data Refresh Strategy

### Initial Load:
1. Fetch account info
2. Fetch recent trades (last 30 days)
3. Calculate metrics
4. Render charts

### Periodic Updates:
- Every 30s: Update account balance/equity
- Every 60s: Fetch new trades
- On user action: Refresh on demand

### Caching:
- Cache historical data locally
- Only fetch new trades since last update
- Store in Supabase for persistence

---

## Technical Implementation Notes

### Components to Create:
```
frontend/src/
├── pages/
│   └── DashboardPage.tsx (main layout)
├── components/
│   ├── dashboard/
│   │   ├── MetricCard.tsx
│   │   ├── EquityCurveChart.tsx
│   │   ├── StatsGrid.tsx
│   │   ├── TradesTable.tsx
│   │   ├── SymbolPerformance.tsx
│   │   └── AccountSwitcher.tsx
│   └── ui/ (existing shadcn components)
└── hooks/
    ├── useAccountData.ts
    ├── useTrades.ts
    └── useMetrics.ts
```

### Data Models:
```typescript
interface MT5Account {
  id: string
  accountNumber: string
  broker: string
  balance: number
  equity: number
  margin: number
  freeMargin: number
  currency: string
}

interface Trade {
  position: string
  symbol: string
  type: 'buy' | 'sell'
  volume: number
  openPrice: number
  closePrice: number
  openTime: Date
  closeTime: Date
  stopLoss: number
  takeProfit: number
  commission: number
  swap: number
  profit: number
}

interface PerformanceMetrics {
  totalNetProfit: number
  grossProfit: number
  grossLoss: number
  profitFactor: number
  sharpeRatio: number
  recoveryFactor: number
  expectedPayoff: number
  maxDrawdown: number
  maxDrawdownPercent: number
  totalTrades: number
  winningTrades: number
  losingTrades: number
  winRate: number
  avgProfit: number
  avgLoss: number
  largestWin: number
  largestLoss: number
}
```

---

## Next Steps

1. **Create base components** (MetricCard, StatsGrid, etc.)
2. **Build mock data service** (simulate MT5 data structure)
3. **Implement DashboardPage with real layout**
4. **Add charts** (equity curve, distributions)
5. **Build trades table** with filtering/sorting
6. **Add real-time updates** (WebSocket/polling)
7. **Connect to actual MT5 data** (via backend API)

---

## Questions / Decisions Needed:

1. Do you want all sections on one page, or tabs for different views?
2. Should we add a "Strategies" view to tag/group trades?
3. Do you want calendar view for trades?
4. Should we include a "Risk Management" section with position sizing calculator?
5. Any specific metrics or KPIs you want to prioritize?
