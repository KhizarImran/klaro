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
