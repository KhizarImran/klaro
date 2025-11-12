// MT5 Data Types

export interface MT5AccountInfo {
  name: string
  accountNumber: string
  company: string
  currency: string
  server: string
  accountType: string // real, demo
  hedgingMode: string // Hedge, Netting
  reportDate: Date
}

export interface MT5Trade {
  openTime: Date
  position: string
  symbol: string
  type: 'buy' | 'sell'
  volume: number
  openPrice: number
  stopLoss: number
  takeProfit: number
  closeTime: Date
  closePrice: number
  commission: number
  swap: number
  profit: number
  comment?: string
  magicNumber?: number
  strategy?: string // Strategy name from EA or comment field
}

export interface MT5PerformanceMetrics {
  // Balance metrics
  initialDeposit: number
  balance: number
  equity: number
  margin: number
  freeMargin: number
  marginLevel: number
  floatingPL: number
  creditFacility: number

  // Profit metrics
  totalNetProfit: number
  grossProfit: number
  grossLoss: number
  profitFactor: number
  expectedPayoff: number

  // Risk metrics
  recoveryFactor: number
  sharpeRatio: number
  balanceDrawdownAbsolute: number
  balanceDrawdownMaximal: number
  balanceDrawdownMaximalPercent: number
  balanceDrawdownRelative: number
  balanceDrawdownRelativePercent: number

  // Trade statistics
  totalTrades: number
  shortTrades: number
  shortTradesWon: number
  shortTradesWonPercent: number
  longTrades: number
  longTradesWon: number
  longTradesWonPercent: number
  profitTrades: number
  profitTradesPercent: number
  lossTrades: number
  lossTradesPercent: number

  // Win/Loss analysis
  largestProfitTrade: number
  largestLossTrade: number
  averageProfitTrade: number
  averageLossTrade: number

  // Consecutive statistics
  maxConsecutiveWins: number
  maxConsecutiveWinsMoney: number
  maxConsecutiveLosses: number
  maxConsecutiveLossesMoney: number
  maximalConsecutiveProfit: number
  maximalConsecutiveProfitCount: number
  maximalConsecutiveLoss: number
  maximalConsecutiveLossCount: number
  averageConsecutiveWins: number
  averageConsecutiveLosses: number
}

export interface MT5Report {
  id?: string
  userId?: string
  type: 'trade-history'
  accountInfo: MT5AccountInfo
  trades: MT5Trade[]
  metrics: MT5PerformanceMetrics
  uploadedAt?: Date
  reportPeriodStart?: Date
  reportPeriodEnd?: Date
}

export interface ParsedMT5Data {
  success: boolean
  report?: MT5Report
  error?: string
}

// Backtest-specific types
export interface MT5BacktestSettings {
  expert: string
  symbol: string
  period: string
  inputs: Record<string, string | number | boolean>
  broker: string
  build: string
}

export interface MT5BacktestTrade extends MT5Trade {
  ticket: number
  direction: 'in' | 'out'
  order: number
  balance: number // Running balance after trade
}

export interface MT5BacktestMetrics extends MT5PerformanceMetrics {
  // Additional backtest-specific metrics
  bars: number
  ticks: number
  symbols: number
  equityDrawdownAbsolute: number
  equityDrawdownMaximal: number
  equityDrawdownMaximalPercent: number
  equityDrawdownRelative: number
  equityDrawdownRelativePercent: number
  marginLevel: number
  zScore: number
  zScorePercent: number
  ahpr: number
  ahprPercent: number
  ghpr: number
  ghprPercent: number
  lrCorrelation: number
  lrStandardError: number
  correlationProfitsMFE: number
  correlationProfitsMAE: number
  correlationMFEMAE: number
  minPositionHoldingTime: string
  maxPositionHoldingTime: string
  avgPositionHoldingTime: string
  totalDeals: number
  onTesterResult: number
}

export interface MT5BacktestReport {
  id?: string
  userId?: string
  type: 'backtest'
  settings: MT5BacktestSettings
  trades: MT5BacktestTrade[]
  metrics: MT5BacktestMetrics
  uploadedAt?: Date
  reportPeriodStart?: Date
  reportPeriodEnd?: Date
}

// Union type for all report types
export type AnyMT5Report = MT5Report | MT5BacktestReport

export interface ParsedMT5BacktestData {
  success: boolean
  report?: MT5BacktestReport
  error?: string
}
