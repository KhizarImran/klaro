# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Klaro** is a React-based web application for analyzing MetaTrader 5 (MT5) trading data. It provides comprehensive analytics, charts, and metrics for both **live trading accounts** (Trade History Reports) and **backtests** (Strategy Tester Reports).

## Commands

```bash
# Development
npm run dev          # Start Vite dev server (default: http://localhost:5173)
npm run typecheck    # Run TypeScript type checking (always run before committing)
npm run lint         # Run ESLint
npm run build        # Build for production
npm run preview      # Preview production build
```

## Architecture

### Report Type System (Critical!)

The application handles **two distinct report types** using a discriminated union:

```typescript
type AnyMT5Report = MT5Report | MT5BacktestReport

// Trade History Report
interface MT5Report {
  type: 'trade-history'
  accountInfo: MT5AccountInfo  // Has account number, company, server
  trades: MT5Trade[]
  metrics: MT5PerformanceMetrics
}

// Backtest Report
interface MT5BacktestReport {
  type: 'backtest'
  settings: MT5BacktestSettings  // Has expert, symbol, period, inputs
  trades: MT5BacktestTrade[]     // Includes ticket, direction, order, balance
  metrics: MT5BacktestMetrics    // Extended with backtest-specific metrics
}
```

**Type Guards Required:** When working with `AnyMT5Report`, always use the `type` discriminator to access properties:

```typescript
// ✅ CORRECT
if (report.type === 'trade-history') {
  const accountNumber = report.accountInfo.accountNumber
} else if (report.type === 'backtest') {
  const expert = report.settings.expert
}

// ❌ WRONG - Will cause runtime errors
const accountNumber = report.accountInfo.accountNumber  // Error if backtest!
```

### Data Flow

1. **Upload**: User uploads file via `ReportUpload` component (dual upload boxes for each type)
   - Trade History: HTML files
   - Backtest: XLSX (Excel) files
2. **Parsing**:
   - Trade History: `parseMT5Report()` in `src/utils/mt5Parser.ts` (HTML parsing)
   - Backtest: `parseMT5BacktestReport()` in `src/utils/mt5BacktestParser.ts` (XLSX parsing)
3. **Storage**: Reports saved to browser localStorage (user-scoped) via `src/utils/reportStorage.ts`
4. **Display**: `DashboardPage` renders metrics, charts, and trades table with type-specific handling

### Parser Details

**Trade History (HTML Parser)**:
- MT5 HTML reports may use UTF-16 Little Endian encoding
- Browser's `DOMParser` handles encoding automatically when reading from `File.text()`
- Metrics extracted by finding cells with `colspan` attributes (labels) and adjacent value cells
- Trades parsed from `<tr bgcolor>` rows

**Backtest (XLSX Parser)**:
- Dynamic XLSX parsing for MT5 Strategy Tester reports
- Metrics and trades extracted from structured Excel sheets
- Initial deposit extracted from balance entries
- Open/close trade matching done via order number

### State Management

- **Authentication**: `AuthContext` provides user state via Supabase
- **Report State**: Managed in `DashboardPage` using React state
  - `savedReports`: Array of all user's reports from localStorage
  - `activeReportId`: Currently selected report
  - `showUpload`: Toggle between upload screen and analytics view

### Component Hierarchy

```
DashboardPage
├── ReportsSidebar (toggleable, shows all saved reports with type icons)
├── ReportUpload (dual upload: trade-history and backtest)
└── Report Analytics (conditional on report type)
    ├── MetricCard (5 key metrics)
    ├── Tabs
    │   ├── Overview (metrics grid)
    │   ├── Charts (EquityBalanceCurve, MonthlyReturnsHeatmap, MagicNumberBreakdown)
    │   └── Trades (TradesTable with pagination & sorting)
```

### Styling System

- **Tailwind CSS v4** with custom OKLCH color system
- Dark theme: `oklch(10% 0.01 240)` base background
- Card backgrounds: `oklch(14% 0.01 240)`
- Borders: `oklch(25% 0.01 240)`
- Positive values: `emerald-500`
- Negative values: `red-500`

### Key Files Reference

- **Types**: `src/types/mt5.ts` - All MT5 data structures
- **Parsers**:
  - `src/utils/mt5Parser.ts` - Trade history HTML parser
  - `src/utils/mt5BacktestParser.ts` - Backtest HTML parser
- **Storage**: `src/utils/reportStorage.ts` - localStorage wrapper with Date serialization
- **Main Page**: `src/pages/DashboardPage.tsx` - Core analytics UI
- **Charts**: `src/components/charts/` - Recharts-based visualizations

## Common Patterns

### Adding New Metrics

1. Add field to `MT5PerformanceMetrics` or `MT5BacktestMetrics` in `src/types/mt5.ts`
2. Update parser's `parseMetricValue()` function to extract from HTML
3. Add to default values in parser's return object
4. Display in `DashboardPage` Overview tab

### Working with Charts

All charts accept:
```typescript
{
  trades: MT5Trade[] | MT5BacktestTrade[],  // Both types work
  initialDeposit: number,
  currency?: string  // Extract with type guard: report.type === 'trade-history' ? report.accountInfo.currency : 'USD'
}
```

### localStorage Key Structure

```
klaro_saved_reports_{userId}        // Array of SavedReport objects
klaro_active_report_id_{userId}     // Active report ID string
```

## Design Specification

See `DASHBOARD_DESIGN.md` for detailed UI/UX specifications including:
- 5-card metric layout (Balance, Equity, Net P/L, Win Rate, Drawdown)
- Chart specifications with time range selectors
- Table design with expandable rows
- Responsive breakpoints
- Future features (symbol performance, trading hours heatmap, real-time updates)

## Known Considerations

- **Date Handling**: All dates serialized/deserialized when saving to localStorage
- **Type Safety**: Always run `npm run typecheck` before committing - the dual report types make type errors common
- **Magic Numbers**: Trade `magicNumber` field used to identify Expert Advisor strategies
- **Parser Robustness**:
  - Trade History (HTML): MT5 HTML structure may vary by version - parser uses flexible cell traversal with `colspan` detection
  - Backtest (XLSX): Dynamic parser adapts to Excel sheet structure
