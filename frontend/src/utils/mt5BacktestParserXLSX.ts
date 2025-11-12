import * as XLSX from 'xlsx'
import type {
  MT5BacktestSettings,
  MT5BacktestTrade,
  MT5BacktestMetrics,
  MT5BacktestReport,
  ParsedMT5BacktestData,
} from '@/types/mt5'

/**
 * Parse MT5 Backtest XLSX file and extract all data
 * Much simpler and more reliable than HTML parsing!
 */
export function parseMT5BacktestReportXLSX(file: ArrayBuffer): ParsedMT5BacktestData {
  try {
    // Read workbook
    const workbook = XLSX.read(file)
    const sheet = workbook.Sheets[workbook.SheetNames[0]]

    // Convert to 2D array for easy access
    const data: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

    // Verify this is a backtest report
    if (!data[0] || !data[0][0]?.toString().includes('Strategy Tester Report')) {
      return {
        success: false,
        error: 'This does not appear to be an MT5 Backtest Report. Please upload a Strategy Tester Report.',
      }
    }

    // Extract settings
    const settings = parseSettings(data)

    // Extract trades
    const { trades, initialDeposit, finalBalance } = parseTrades(data)

    // Extract metrics
    const metrics = parseMetrics(data, initialDeposit, finalBalance)

    // Determine report period from trades
    const reportPeriodStart = trades.length > 0
      ? new Date(Math.min(...trades.map(t => t.openTime.getTime())))
      : undefined
    const reportPeriodEnd = trades.length > 0
      ? new Date(Math.max(...trades.map(t => t.closeTime.getTime())))
      : undefined

    const report: MT5BacktestReport = {
      type: 'backtest',
      settings,
      trades,
      metrics,
      uploadedAt: new Date(),
      reportPeriodStart,
      reportPeriodEnd,
    }

    return { success: true, report }
  } catch (error) {
    console.error('Error parsing MT5 backtest XLSX:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error parsing backtest report',
    }
  }
}

function parseSettings(data: any[][]): MT5BacktestSettings {
  // Extract basic info
  const broker = data[1]?.[0] || '' // Row 1: "ICMarketsSC-Demo (Build 5399)"
  const expert = data[3]?.[3] || '' // Row 3, column D
  const symbol = data[4]?.[3] || '' // Row 4, column D
  const period = data[5]?.[3] || '' // Row 5, column D

  // Extract broker name and build
  const brokerMatch = broker.match(/^(.+?)\s*\(Build\s+(\d+)\)/)
  const brokerName = brokerMatch ? brokerMatch[1] : broker
  const build = brokerMatch ? brokerMatch[2] : ''

  // Extract inputs (rows 6-44, column D contains "Key=Value")
  const inputs: Record<string, string | number | boolean> = {}
  for (let i = 6; i <= 44; i++) {
    const value = data[i]?.[3]
    if (value && typeof value === 'string') {
      const match = value.match(/^([^=]+)=(.+)$/)
      if (match) {
        const key = match[1].trim()
        const val = match[2].trim()

        // Parse value type
        if (val === 'true' || val === 'false') {
          inputs[key] = val === 'true'
        } else if (!isNaN(Number(val))) {
          inputs[key] = Number(val)
        } else {
          inputs[key] = val
        }
      }
    }
  }

  return {
    expert,
    symbol,
    period,
    inputs,
    broker: brokerName,
    build,
  }
}

function parseTrades(data: any[][]): { trades: MT5BacktestTrade[]; initialDeposit: number; finalBalance: number } {
  const trades: MT5BacktestTrade[] = []

  // Find "Deals" section header dynamically (can be at different row numbers)
  let dealsRowStart = -1
  for (let i = 50; i < data.length; i++) {
    if (data[i]?.[0]?.toString().toLowerCase() === 'deals') {
      dealsRowStart = i + 1 // Next row is headers
      break
    }
  }

  if (dealsRowStart === -1) {
    return { trades: [], initialDeposit: 10000, finalBalance: 10000 }
  }

  // Skip header row, start parsing deals
  const dealsStart = dealsRowStart + 1

  // First row should be balance entry
  let initialDeposit = 10000
  if (data[dealsStart]?.[3]?.toString().toLowerCase() === 'balance') {
    initialDeposit = parseFloat(data[dealsStart]?.[11] || 10000)
  }

  // Track open positions
  // Key insight: "buy in" matches with "sell out" (long positions)
  //              "sell in" matches with "buy out" (short positions)
  const openLongs: Array<Partial<MT5BacktestTrade>> = []  // from "buy in"
  const openShorts: Array<Partial<MT5BacktestTrade>> = [] // from "sell in"
  let finalBalance = initialDeposit

  // Parse each deal
  for (let i = dealsStart; i < data.length; i++) {
    const row = data[i]
    if (!row || row.length < 12) break

    const timeStr = row[0]?.toString() || ''
    const dealNum = parseInt(row[1] || 0)
    const symbol = row[2]?.toString() || ''
    const type = row[3]?.toString().toLowerCase() || ''
    const direction = row[4]?.toString().toLowerCase() as 'in' | 'out' | ''
    const volume = parseFloat(row[5] || 0)
    const price = parseFloat(row[6] || 0)
    const order = parseInt(row[7] || 0)
    const commission = parseFloat(row[8] || 0)
    const swap = parseFloat(row[9] || 0)
    const profit = parseFloat(row[10] || 0)
    const balance = parseFloat(row[11] || 0)
    const comment = row[12]?.toString() || ''

    // Skip balance rows, break on empty rows
    if (type === 'balance') continue
    if (!symbol || symbol === '') break

    // Parse datetime
    const time = parseExcelDateTime(timeStr)
    if (!time) continue

    // Update final balance with each deal
    if (balance) finalBalance = balance

    if (type === 'buy' && direction === 'in') {
      // Opening long position
      openLongs.push({
        ticket: dealNum,
        position: dealNum.toString(),
        symbol,
        type: 'buy',
        direction,
        volume,
        openPrice: price,
        openTime: time,
        order,
        comment,
      })
    } else if (type === 'sell' && direction === 'in') {
      // Opening short position
      openShorts.push({
        ticket: dealNum,
        position: dealNum.toString(),
        symbol,
        type: 'sell',
        direction,
        volume,
        openPrice: price,
        openTime: time,
        order,
        comment,
      })
    } else if (type === 'sell' && direction === 'out') {
      // Closing long position (sell to close a buy)
      const openPos = openLongs.find(pos => pos.volume === volume)
      if (openPos) {
        const completedTrade: MT5BacktestTrade = {
          ticket: openPos.ticket || dealNum,
          position: (openPos.ticket || dealNum).toString(),
          symbol: openPos.symbol || symbol,
          type: 'buy', // The original position type
          direction: 'out',
          volume,
          openPrice: openPos.openPrice || 0,
          closePrice: price,
          openTime: openPos.openTime || time,
          closeTime: time,
          order,
          commission,
          swap,
          profit,
          balance,
          comment: comment || openPos.comment || '',
          stopLoss: 0,
          takeProfit: 0,
        }
        trades.push(completedTrade)
        // Remove the matched position
        const index = openLongs.indexOf(openPos)
        if (index > -1) openLongs.splice(index, 1)
      }
    } else if (type === 'buy' && direction === 'out') {
      // Closing short position (buy to close a sell)
      const openPos = openShorts.find(pos => pos.volume === volume)
      if (openPos) {
        const completedTrade: MT5BacktestTrade = {
          ticket: openPos.ticket || dealNum,
          position: (openPos.ticket || dealNum).toString(),
          symbol: openPos.symbol || symbol,
          type: 'sell', // The original position type
          direction: 'out',
          volume,
          openPrice: openPos.openPrice || 0,
          closePrice: price,
          openTime: openPos.openTime || time,
          closeTime: time,
          order,
          commission,
          swap,
          profit,
          balance,
          comment: comment || openPos.comment || '',
          stopLoss: 0,
          takeProfit: 0,
        }
        trades.push(completedTrade)
        // Remove the matched position
        const index = openShorts.indexOf(openPos)
        if (index > -1) openShorts.splice(index, 1)
      }
    }
  }

  return { trades, initialDeposit, finalBalance }
}

function createDefaultMetrics(initialDeposit: number, finalBalance: number): MT5BacktestMetrics {
  return {
    initialDeposit,
    balance: finalBalance,
    equity: finalBalance,
    margin: 0,
    freeMargin: 0,
    floatingPL: 0,
    creditFacility: 0,
    totalNetProfit: finalBalance - initialDeposit,
    grossProfit: 0,
    grossLoss: 0,
    profitFactor: 0,
    expectedPayoff: 0,
    recoveryFactor: 0,
    sharpeRatio: 0,
    totalTrades: 0,
    shortTrades: 0,
    shortTradesWon: 0,
    shortTradesWonPercent: 0,
    longTrades: 0,
    longTradesWon: 0,
    longTradesWonPercent: 0,
    profitTrades: 0,
    profitTradesPercent: 0,
    lossTrades: 0,
    lossTradesPercent: 0,
    largestProfitTrade: 0,
    largestLossTrade: 0,
    averageProfitTrade: 0,
    averageLossTrade: 0,
    maxConsecutiveWins: 0,
    maxConsecutiveWinsMoney: 0,
    maxConsecutiveLosses: 0,
    maxConsecutiveLossesMoney: 0,
    maximalConsecutiveProfit: 0,
    maximalConsecutiveProfitCount: 0,
    maximalConsecutiveLoss: 0,
    maximalConsecutiveLossCount: 0,
    averageConsecutiveWins: 0,
    averageConsecutiveLosses: 0,
    bars: 0,
    ticks: 0,
    symbols: 1,
    totalDeals: 0,
    balanceDrawdownAbsolute: 0,
    balanceDrawdownMaximal: 0,
    balanceDrawdownMaximalPercent: 0,
    balanceDrawdownRelative: 0,
    balanceDrawdownRelativePercent: 0,
    equityDrawdownAbsolute: 0,
    equityDrawdownMaximal: 0,
    equityDrawdownMaximalPercent: 0,
    equityDrawdownRelative: 0,
    equityDrawdownRelativePercent: 0,
    marginLevel: 0,
    zScore: 0,
    zScorePercent: 0,
    ahpr: 0,
    ahprPercent: 0,
    ghpr: 0,
    ghprPercent: 0,
    lrCorrelation: 0,
    lrStandardError: 0,
    onTesterResult: 0,
    correlationProfitsMFE: 0,
    correlationProfitsMAE: 0,
    correlationMFEMAE: 0,
    minPositionHoldingTime: '0:00:00',
    maxPositionHoldingTime: '0:00:00',
    avgPositionHoldingTime: '0:00:00',
  }
}

function parseMetrics(data: any[][], initialDeposit: number, finalBalance: number): MT5BacktestMetrics {
  // Find metrics section dynamically by searching for "Bars:" label
  let metricsStart = -1
  for (let i = 40; i < 200; i++) {
    if (data[i]?.[0]?.toString().toLowerCase().includes('bars:')) {
      metricsStart = i
      break
    }
  }

  if (metricsStart === -1) {
    // Fallback to defaults if metrics section not found
    return createDefaultMetrics(initialDeposit, finalBalance)
  }

  const metrics: Partial<MT5BacktestMetrics> = {}

  // Helper function to get value from row
  const getValue = (row: any[], colIndex: number): any => {
    return row?.[colIndex] !== '' ? row[colIndex] : undefined
  }

  // Row +0: Bars (D), Ticks (H), Symbols (L)
  metrics.bars = parseInt(getValue(data[metricsStart], 3) || 0)
  metrics.ticks = parseInt(getValue(data[metricsStart], 7) || 0)
  metrics.symbols = parseInt(getValue(data[metricsStart], 11) || 1)

  // Row +1: Total Net Profit (D), Balance DD Absolute (H), Equity DD Absolute (L)
  metrics.totalNetProfit = parseFloat(getValue(data[metricsStart + 1], 3) || 0)
  metrics.balanceDrawdownAbsolute = parseFloat(getValue(data[metricsStart + 1], 7) || 0)
  metrics.equityDrawdownAbsolute = parseFloat(getValue(data[metricsStart + 1], 11) || 0)

  // Row +2: Gross Profit (D), Balance DD Maximal (H), Equity DD Maximal (L)
  metrics.grossProfit = parseFloat(getValue(data[metricsStart + 2], 3) || 0)
  const balanceDDMax = getValue(data[metricsStart + 2], 7)?.toString() || '0'
  const balanceDDMatch = balanceDDMax.match(/([\d.-]+)\s*\(([\d.]+)%\)/)
  if (balanceDDMatch) {
    metrics.balanceDrawdownMaximal = parseFloat(balanceDDMatch[1])
    metrics.balanceDrawdownMaximalPercent = parseFloat(balanceDDMatch[2])
  }
  const equityDDMax = getValue(data[metricsStart + 2], 11)?.toString() || '0'
  const equityDDMatch = equityDDMax.match(/([\d.-]+)\s*\(([\d.]+)%\)/)
  if (equityDDMatch) {
    metrics.equityDrawdownMaximal = parseFloat(equityDDMatch[1])
    metrics.equityDrawdownMaximalPercent = parseFloat(equityDDMatch[2])
  }

  // Row +3: Gross Loss (D), Balance DD Relative (H), Equity DD Relative (L)
  metrics.grossLoss = parseFloat(getValue(data[metricsStart + 3], 3) || 0)
  const balanceDDRel = getValue(data[metricsStart + 3], 7)?.toString() || '0'
  const balanceDDRelMatch = balanceDDRel.match(/([\d.]+)%\s*\(([\d.-]+)\)/)
  if (balanceDDRelMatch) {
    metrics.balanceDrawdownRelativePercent = parseFloat(balanceDDRelMatch[1])
    metrics.balanceDrawdownRelative = parseFloat(balanceDDRelMatch[2])
  }
  const equityDDRel = getValue(data[metricsStart + 3], 11)?.toString() || '0'
  const equityDDRelMatch = equityDDRel.match(/([\d.]+)%\s*\(([\d.-]+)\)/)
  if (equityDDRelMatch) {
    metrics.equityDrawdownRelativePercent = parseFloat(equityDDRelMatch[1])
    metrics.equityDrawdownRelative = parseFloat(equityDDRelMatch[2])
  }

  // Row +5: Profit Factor (D), Expected Payoff (H), Margin Level (L)
  metrics.profitFactor = parseFloat(getValue(data[metricsStart + 5], 3) || 0)
  metrics.expectedPayoff = parseFloat(getValue(data[metricsStart + 5], 7) || 0)
  const marginLevel = getValue(data[metricsStart + 5], 11)?.toString() || '0'
  metrics.marginLevel = parseFloat(marginLevel.replace('%', ''))

  // Row +6: Recovery Factor (D), Sharpe Ratio (H), Z-Score (L)
  metrics.recoveryFactor = parseFloat(getValue(data[metricsStart + 6], 3) || 0)
  metrics.sharpeRatio = parseFloat(getValue(data[metricsStart + 6], 7) || 0)
  const zScore = getValue(data[metricsStart + 6], 11)?.toString() || '0'
  const zScoreMatch = zScore.match(/([\d.-]+)\s*\(([\d.]+)%\)/)
  if (zScoreMatch) {
    metrics.zScore = parseFloat(zScoreMatch[1])
    metrics.zScorePercent = parseFloat(zScoreMatch[2])
  }

  // Row +7: AHPR (D), LR Correlation (H), OnTester result (L)
  const ahpr = getValue(data[metricsStart + 7], 3)?.toString() || '0'
  const ahprMatch = ahpr.match(/([\d.]+)\s*\(([\d.]+)%\)/)
  if (ahprMatch) {
    metrics.ahpr = parseFloat(ahprMatch[1])
    metrics.ahprPercent = parseFloat(ahprMatch[2])
  }
  metrics.lrCorrelation = parseFloat(getValue(data[metricsStart + 7], 7) || 0)
  metrics.onTesterResult = parseFloat(getValue(data[metricsStart + 7], 11) || 0)

  // Row +8: GHPR (D), LR Standard Error (H)
  const ghpr = getValue(data[metricsStart + 8], 3)?.toString() || '0'
  const ghprMatch = ghpr.match(/([\d.]+)\s*\(([\d.]+)%\)/)
  if (ghprMatch) {
    metrics.ghpr = parseFloat(ghprMatch[1])
    metrics.ghprPercent = parseFloat(ghprMatch[2])
  }
  metrics.lrStandardError = parseFloat(getValue(data[metricsStart + 8], 7) || 0)

  // Row +10: Correlations
  metrics.correlationProfitsMFE = parseFloat(getValue(data[metricsStart + 10], 3) || 0)
  metrics.correlationProfitsMAE = parseFloat(getValue(data[metricsStart + 10], 7) || 0)
  metrics.correlationMFEMAE = parseFloat(getValue(data[metricsStart + 10], 11) || 0)

  // Row +11: Position holding times
  metrics.minPositionHoldingTime = getValue(data[metricsStart + 11], 3)?.toString() || '0:00:00'
  metrics.maxPositionHoldingTime = getValue(data[metricsStart + 11], 7)?.toString() || '0:00:00'
  metrics.avgPositionHoldingTime = getValue(data[metricsStart + 11], 11)?.toString() || '0:00:00'

  // Row +13: Total Trades (D), Short Trades (H), Long Trades (L)
  metrics.totalTrades = parseInt(getValue(data[metricsStart + 13], 3) || 0)
  const shortTrades = getValue(data[metricsStart + 13], 7)?.toString() || '0'
  const shortMatch = shortTrades.match(/(\d+)\s*\(([\d.]+)%\)/)
  if (shortMatch) {
    metrics.shortTrades = parseInt(shortMatch[1])
    metrics.shortTradesWonPercent = parseFloat(shortMatch[2])
    metrics.shortTradesWon = Math.round(metrics.shortTrades * metrics.shortTradesWonPercent / 100)
  }
  const longTrades = getValue(data[metricsStart + 13], 11)?.toString() || '0'
  const longMatch = longTrades.match(/(\d+)\s*\(([\d.]+)%\)/)
  if (longMatch) {
    metrics.longTrades = parseInt(longMatch[1])
    metrics.longTradesWonPercent = parseFloat(longMatch[2])
    metrics.longTradesWon = Math.round(metrics.longTrades * metrics.longTradesWonPercent / 100)
  }

  // Row +14: Total Deals (D), Profit Trades (H), Loss Trades (L)
  metrics.totalDeals = parseInt(getValue(data[metricsStart + 14], 3) || 0)
  const profitTrades = getValue(data[metricsStart + 14], 7)?.toString() || '0'
  const profitMatch = profitTrades.match(/(\d+)\s*\(([\d.]+)%\)/)
  if (profitMatch) {
    metrics.profitTrades = parseInt(profitMatch[1])
    metrics.profitTradesPercent = parseFloat(profitMatch[2])
  }
  const lossTrades = getValue(data[metricsStart + 14], 11)?.toString() || '0'
  const lossMatch = lossTrades.match(/(\d+)\s*\(([\d.]+)%\)/)
  if (lossMatch) {
    metrics.lossTrades = parseInt(lossMatch[1])
    metrics.lossTradesPercent = parseFloat(lossMatch[2])
  }

  // Row +15: Largest trades
  metrics.largestProfitTrade = parseFloat(getValue(data[metricsStart + 15], 7) || 0)
  metrics.largestLossTrade = parseFloat(getValue(data[metricsStart + 15], 11) || 0)

  // Row +16: Average trades
  metrics.averageProfitTrade = parseFloat(getValue(data[metricsStart + 16], 7) || 0)
  metrics.averageLossTrade = parseFloat(getValue(data[metricsStart + 16], 11) || 0)

  // Row +17: Max consecutive
  const maxConsecWins = getValue(data[metricsStart + 17], 7)?.toString() || '0'
  const maxWinsMatch = maxConsecWins.match(/(\d+)\s*\(([\d.-]+)\)/)
  if (maxWinsMatch) {
    metrics.maxConsecutiveWins = parseInt(maxWinsMatch[1])
    metrics.maxConsecutiveWinsMoney = parseFloat(maxWinsMatch[2])
  }
  const maxConsecLoss = getValue(data[metricsStart + 17], 11)?.toString() || '0'
  const maxLossMatch = maxConsecLoss.match(/(\d+)\s*\(([\d.-]+)\)/)
  if (maxLossMatch) {
    metrics.maxConsecutiveLosses = parseInt(maxLossMatch[1])
    metrics.maxConsecutiveLossesMoney = parseFloat(maxLossMatch[2])
  }

  // Row +18: Maximal consecutive profit/loss
  const maximalProfit = getValue(data[metricsStart + 18], 7)?.toString() || '0'
  const maxProfitMatch = maximalProfit.match(/([\d.-]+)\s*\((\d+)\)/)
  if (maxProfitMatch) {
    metrics.maximalConsecutiveProfit = parseFloat(maxProfitMatch[1])
    metrics.maximalConsecutiveProfitCount = parseInt(maxProfitMatch[2])
  }
  const maximalLoss = getValue(data[metricsStart + 18], 11)?.toString() || '0'
  const maxLossMatch2 = maximalLoss.match(/([\d.-]+)\s*\((\d+)\)/)
  if (maxLossMatch2) {
    metrics.maximalConsecutiveLoss = parseFloat(maxLossMatch2[1])
    metrics.maximalConsecutiveLossCount = parseInt(maxLossMatch2[2])
  }

  // Row +19: Average consecutive
  metrics.averageConsecutiveWins = parseInt(getValue(data[metricsStart + 19], 7) || 0)
  metrics.averageConsecutiveLosses = parseInt(getValue(data[metricsStart + 19], 11) || 0)

  // Set balance info from trades
  metrics.initialDeposit = initialDeposit
  metrics.balance = finalBalance
  metrics.equity = finalBalance

  // Set defaults for base metrics
  metrics.margin = 0
  metrics.freeMargin = 0
  metrics.floatingPL = 0
  metrics.creditFacility = 0

  return metrics as MT5BacktestMetrics
}

function parseExcelDateTime(dateStr: string): Date | null {
  // Format: "2025.11.04 18:00:00"
  const match = dateStr.match(/(\d{4})\.(\d{2})\.(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/)
  if (!match) return null

  const [, year, month, day, hour, minute, second] = match
  return new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    parseInt(hour),
    parseInt(minute),
    parseInt(second)
  )
}
