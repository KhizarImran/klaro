import type {
  MT5BacktestSettings,
  MT5BacktestTrade,
  MT5BacktestMetrics,
  MT5BacktestReport,
  ParsedMT5BacktestData,
} from '@/types/mt5'

/**
 * Parse MT5 Backtest HTML report and extract all data
 */
export function parseMT5BacktestReport(htmlContent: string): ParsedMT5BacktestData {
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(htmlContent, 'text/html')

    // Verify this is a backtest report
    const title = doc.querySelector('title')?.textContent || ''
    if (!title.includes('Strategy Tester Report')) {
      return {
        success: false,
        error: 'This does not appear to be an MT5 Backtest Report. Please upload a Strategy Tester Report.',
      }
    }

    // Extract settings
    const settings = parseBacktestSettings(doc)

    // Extract trades
    const { trades, initialDeposit, finalBalance } = parseBacktestTrades(doc)

    // Extract performance metrics
    const metrics = parseBacktestMetrics(doc)

    // Set balance from trades
    metrics.initialDeposit = initialDeposit
    metrics.balance = finalBalance
    metrics.equity = finalBalance

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
    console.error('Error parsing MT5 backtest report:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error parsing backtest report',
    }
  }
}

function parseBacktestSettings(doc: Document): MT5BacktestSettings {
  const rows = doc.querySelectorAll('tr')

  let expert = ''
  let symbol = ''
  let period = ''
  let broker = ''
  let build = ''
  const inputs: Record<string, string | number | boolean> = {}

  // Parse broker and build from header
  rows.forEach(row => {
    const cells = row.querySelectorAll('td')
    if (cells.length === 1) {
      const text = cells[0].textContent?.trim() || ''
      // Match "ICMarketsSC-Demo (Build 5399)"
      const match = text.match(/^(.+?)\s*\(Build\s+(\d+)\)$/)
      if (match) {
        broker = match[1]
        build = match[2]
      }
    }
  })

  // Parse settings section
  rows.forEach(row => {
    const cells = Array.from(row.querySelectorAll('td'))
    if (cells.length >= 4) {
      const label = cells.find(c => c.getAttribute('colspan') === '3')?.textContent?.trim() || ''
      const valueCell = cells.find(c => c.getAttribute('colspan') === '10' || c.querySelector('b'))
      const value = valueCell?.textContent?.trim() || ''

      if (label === 'Expert:') {
        expert = value
      } else if (label === 'Symbol:') {
        symbol = value
      } else if (label === 'Period:') {
        period = value
      } else if (label === 'Inputs:' || label === '') {
        // Parse input parameters (e.g., "TimeframeRangeCalculation=1")
        const inputMatch = value.match(/^([^=]+)=(.+)$/)
        if (inputMatch) {
          const key = inputMatch[1].trim()
          const val = inputMatch[2].trim()

          // Try to parse as number or boolean
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
  })

  return {
    expert,
    symbol,
    period,
    inputs,
    broker,
    build,
  }
}

function parseBacktestTrades(doc: Document): { trades: MT5BacktestTrade[]; initialDeposit: number; finalBalance: number } {
  const trades: MT5BacktestTrade[] = []
  const rows = doc.querySelectorAll('tr[bgcolor]')

  // Track open positions by order number
  const openPositions = new Map<number, Partial<MT5BacktestTrade>>()
  let initialDeposit = 10000 // Default
  let finalBalance = 10000

  rows.forEach(row => {
    const cells = row.querySelectorAll('td')
    if (cells.length < 12) return

    const datetime = cells[0]?.textContent?.trim() || ''
    const ticket = parseInt(cells[1]?.textContent?.trim() || '0')
    const symbol = cells[2]?.textContent?.trim() || ''
    const typeText = cells[3]?.textContent?.trim().toLowerCase() || ''
    const direction = cells[4]?.textContent?.trim().toLowerCase() as 'in' | 'out' | ''
    const volume = parseFloat(cells[5]?.textContent?.trim() || '0')
    const price = parseFloat(cells[6]?.textContent?.trim() || '0')
    const order = parseInt(cells[7]?.textContent?.trim() || '0')
    const commission = parseFloat(cells[8]?.textContent?.trim() || '0')
    const swap = parseFloat(cells[9]?.textContent?.trim() || '0')
    const profit = parseFloat(cells[10]?.textContent?.trim() || '0')
    const balance = parseFloat(cells[11]?.textContent?.trim() || '0')
    const comment = cells[12]?.textContent?.trim() || ''

    // Capture initial deposit from balance entry
    if (typeText === 'balance') {
      const balanceValue = parseFloat(cells[11]?.textContent?.trim() || '0')
      if (trades.length === 0 && balanceValue > 0) {
        initialDeposit = balanceValue
        finalBalance = balanceValue
      }
      return
    }

    // Skip empty rows
    if (symbol === '') return

    const time = parseDateTime(datetime)
    if (!time) return

    if (direction === 'in') {
      // Opening position
      openPositions.set(order, {
        ticket,
        position: ticket.toString(), // Use ticket as position ID
        symbol,
        type: typeText as 'buy' | 'sell',
        direction,
        volume,
        openPrice: price,
        openTime: time,
        order,
        commission: 0,
        swap: 0,
        profit: 0,
        balance,
        comment,
        stopLoss: 0,
        takeProfit: 0,
        closePrice: 0,
        closeTime: time, // Will be updated on close
      })
    } else if (direction === 'out') {
      // Closing position
      const openPos = openPositions.get(order)
      if (openPos) {
        const completedTrade: MT5BacktestTrade = {
          ticket: openPos.ticket || ticket,
          position: (openPos.ticket || ticket).toString(),
          symbol: openPos.symbol || symbol,
          type: openPos.type || (typeText as 'buy' | 'sell'),
          direction,
          volume: openPos.volume || volume,
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
        finalBalance = balance
        openPositions.delete(order)
      }
    }
  })

  return { trades, initialDeposit, finalBalance }
}

function parseBacktestMetrics(doc: Document): MT5BacktestMetrics {
  const rows = doc.querySelectorAll('tr')
  const metrics: Partial<MT5BacktestMetrics> = {}

  rows.forEach(row => {
    const cells = Array.from(row.querySelectorAll('td'))

    // Iterate through cells and find label-value pairs
    // Structure is: [label with colspan="3"][value][label with colspan="3"][value]...
    let i = 0
    while (i < cells.length) {
      const cell = cells[i]
      const colspan = cell.getAttribute('colspan')

      // If this cell has colspan="3" or colspan="2", it's likely a label
      if (colspan === '3' || colspan === '2') {
        const label = cell.textContent?.trim() || ''
        // Next cell should be the value
        if (i + 1 < cells.length) {
          const valueCell = cells[i + 1]
          const value = valueCell.textContent?.trim() || ''
          parseMetricValue(label, value, metrics)
          i += 2 // Skip to next label
        } else {
          i++
        }
      } else {
        i++
      }
    }
  })

  // Set defaults for missing values (will be overridden by actual values from trades)
  return {
    // Basic metrics
    initialDeposit: metrics.initialDeposit || 10000,
    balance: metrics.balance || metrics.initialDeposit || 10000,
    equity: metrics.equity || metrics.balance || metrics.initialDeposit || 10000,
    margin: 0,
    freeMargin: 0,
    marginLevel: metrics.marginLevel || 0,
    floatingPL: 0,
    creditFacility: 0,

    // Profit metrics
    totalNetProfit: metrics.totalNetProfit || 0,
    grossProfit: metrics.grossProfit || 0,
    grossLoss: metrics.grossLoss || 0,
    profitFactor: metrics.profitFactor || 0,
    expectedPayoff: metrics.expectedPayoff || 0,

    // Risk metrics
    recoveryFactor: metrics.recoveryFactor || 0,
    sharpeRatio: metrics.sharpeRatio || 0,
    balanceDrawdownAbsolute: metrics.balanceDrawdownAbsolute || 0,
    balanceDrawdownMaximal: metrics.balanceDrawdownMaximal || 0,
    balanceDrawdownMaximalPercent: metrics.balanceDrawdownMaximalPercent || 0,
    balanceDrawdownRelative: metrics.balanceDrawdownRelative || 0,
    balanceDrawdownRelativePercent: metrics.balanceDrawdownRelativePercent || 0,

    // Trade statistics
    totalTrades: metrics.totalTrades || 0,
    shortTrades: metrics.shortTrades || 0,
    shortTradesWon: metrics.shortTradesWon || 0,
    shortTradesWonPercent: metrics.shortTradesWonPercent || 0,
    longTrades: metrics.longTrades || 0,
    longTradesWon: metrics.longTradesWon || 0,
    longTradesWonPercent: metrics.longTradesWonPercent || 0,
    profitTrades: metrics.profitTrades || 0,
    profitTradesPercent: metrics.profitTradesPercent || 0,
    lossTrades: metrics.lossTrades || 0,
    lossTradesPercent: metrics.lossTradesPercent || 0,

    // Win/Loss analysis
    largestProfitTrade: metrics.largestProfitTrade || 0,
    largestLossTrade: metrics.largestLossTrade || 0,
    averageProfitTrade: metrics.averageProfitTrade || 0,
    averageLossTrade: metrics.averageLossTrade || 0,

    // Consecutive statistics
    maxConsecutiveWins: metrics.maxConsecutiveWins || 0,
    maxConsecutiveWinsMoney: metrics.maxConsecutiveWinsMoney || 0,
    maxConsecutiveLosses: metrics.maxConsecutiveLosses || 0,
    maxConsecutiveLossesMoney: metrics.maxConsecutiveLossesMoney || 0,
    maximalConsecutiveProfit: metrics.maximalConsecutiveProfit || 0,
    maximalConsecutiveProfitCount: metrics.maximalConsecutiveProfitCount || 0,
    maximalConsecutiveLoss: metrics.maximalConsecutiveLoss || 0,
    maximalConsecutiveLossCount: metrics.maximalConsecutiveLossCount || 0,
    averageConsecutiveWins: metrics.averageConsecutiveWins || 0,
    averageConsecutiveLosses: metrics.averageConsecutiveLosses || 0,

    // Backtest-specific metrics
    bars: metrics.bars || 0,
    ticks: metrics.ticks || 0,
    symbols: metrics.symbols || 1,
    equityDrawdownAbsolute: metrics.equityDrawdownAbsolute || 0,
    equityDrawdownMaximal: metrics.equityDrawdownMaximal || 0,
    equityDrawdownMaximalPercent: metrics.equityDrawdownMaximalPercent || 0,
    equityDrawdownRelative: metrics.equityDrawdownRelative || 0,
    equityDrawdownRelativePercent: metrics.equityDrawdownRelativePercent || 0,
    zScore: metrics.zScore || 0,
    zScorePercent: metrics.zScorePercent || 0,
    ahpr: metrics.ahpr || 0,
    ahprPercent: metrics.ahprPercent || 0,
    ghpr: metrics.ghpr || 0,
    ghprPercent: metrics.ghprPercent || 0,
    lrCorrelation: metrics.lrCorrelation || 0,
    lrStandardError: metrics.lrStandardError || 0,
    correlationProfitsMFE: metrics.correlationProfitsMFE || 0,
    correlationProfitsMAE: metrics.correlationProfitsMAE || 0,
    correlationMFEMAE: metrics.correlationMFEMAE || 0,
    minPositionHoldingTime: metrics.minPositionHoldingTime || '0:00:00',
    maxPositionHoldingTime: metrics.maxPositionHoldingTime || '0:00:00',
    avgPositionHoldingTime: metrics.avgPositionHoldingTime || '0:00:00',
    totalDeals: metrics.totalDeals || 0,
    onTesterResult: metrics.onTesterResult || 0,
  }
}

function parseMetricValue(label: string, value: string, metrics: Partial<MT5BacktestMetrics>) {
  const cleanValue = value.replace(/[,\s]/g, '')

  // Parse different metric types
  if (label.includes('Total Net Profit:')) {
    metrics.totalNetProfit = parseFloat(cleanValue)
  } else if (label.includes('Gross Profit:')) {
    metrics.grossProfit = parseFloat(cleanValue)
  } else if (label.includes('Gross Loss:')) {
    metrics.grossLoss = parseFloat(cleanValue)
  } else if (label.includes('Profit Factor:')) {
    metrics.profitFactor = parseFloat(cleanValue)
  } else if (label.includes('Expected Payoff:')) {
    metrics.expectedPayoff = parseFloat(cleanValue)
  } else if (label.includes('Recovery Factor:')) {
    metrics.recoveryFactor = parseFloat(cleanValue)
  } else if (label.includes('Sharpe Ratio:')) {
    metrics.sharpeRatio = parseFloat(cleanValue)
  } else if (label.includes('Balance Drawdown Absolute:')) {
    metrics.balanceDrawdownAbsolute = parseFloat(cleanValue)
  } else if (label.includes('Balance Drawdown Maximal:')) {
    const match = value.match(/([\d\s.]+)\s*\(([\d.]+)%\)/)
    if (match) {
      metrics.balanceDrawdownMaximal = parseFloat(match[1].replace(/\s/g, ''))
      metrics.balanceDrawdownMaximalPercent = parseFloat(match[2])
    }
  } else if (label.includes('Balance Drawdown Relative:')) {
    const match = value.match(/([\d.]+)%\s*\(([\d\s.]+)\)/)
    if (match) {
      metrics.balanceDrawdownRelativePercent = parseFloat(match[1])
      metrics.balanceDrawdownRelative = parseFloat(match[2].replace(/\s/g, ''))
    }
  } else if (label.includes('Equity Drawdown Absolute:')) {
    metrics.equityDrawdownAbsolute = parseFloat(cleanValue)
  } else if (label.includes('Equity Drawdown Maximal:')) {
    const match = value.match(/([\d\s.]+)\s*\(([\d.]+)%\)/)
    if (match) {
      metrics.equityDrawdownMaximal = parseFloat(match[1].replace(/\s/g, ''))
      metrics.equityDrawdownMaximalPercent = parseFloat(match[2])
    }
  } else if (label.includes('Equity Drawdown Relative:')) {
    const match = value.match(/([\d.]+)%\s*\(([\d\s.]+)\)/)
    if (match) {
      metrics.equityDrawdownRelativePercent = parseFloat(match[1])
      metrics.equityDrawdownRelative = parseFloat(match[2].replace(/\s/g, ''))
    }
  } else if (label.includes('Total Trades:')) {
    metrics.totalTrades = parseInt(cleanValue)
  } else if (label.includes('Total Deals:')) {
    metrics.totalDeals = parseInt(cleanValue)
  } else if (label.includes('Short Trades')) {
    const match = value.match(/(\d+)\s*\(([\d.]+)%\)/)
    if (match) {
      metrics.shortTrades = parseInt(match[1])
      metrics.shortTradesWonPercent = parseFloat(match[2])
      metrics.shortTradesWon = Math.round(metrics.shortTrades * metrics.shortTradesWonPercent / 100)
    }
  } else if (label.includes('Long Trades')) {
    const match = value.match(/(\d+)\s*\(([\d.]+)%\)/)
    if (match) {
      metrics.longTrades = parseInt(match[1])
      metrics.longTradesWonPercent = parseFloat(match[2])
      metrics.longTradesWon = Math.round(metrics.longTrades * metrics.longTradesWonPercent / 100)
    }
  } else if (label.includes('Profit Trades')) {
    const match = value.match(/(\d+)\s*\(([\d.]+)%\)/)
    if (match) {
      metrics.profitTrades = parseInt(match[1])
      metrics.profitTradesPercent = parseFloat(match[2])
    }
  } else if (label.includes('Loss Trades')) {
    const match = value.match(/(\d+)\s*\(([\d.]+)%\)/)
    if (match) {
      metrics.lossTrades = parseInt(match[1])
      metrics.lossTradesPercent = parseFloat(match[2])
    }
  } else if (label.includes('Largest profit trade:')) {
    metrics.largestProfitTrade = parseFloat(cleanValue)
  } else if (label.includes('Largest loss trade:')) {
    metrics.largestLossTrade = parseFloat(cleanValue)
  } else if (label.includes('Average profit trade:')) {
    metrics.averageProfitTrade = parseFloat(cleanValue)
  } else if (label.includes('Average loss trade:')) {
    metrics.averageLossTrade = parseFloat(cleanValue)
  } else if (label.includes('Maximum consecutive wins')) {
    const match = value.match(/(\d+)\s*\(([\d\s.-]+)\)/)
    if (match) {
      metrics.maxConsecutiveWins = parseInt(match[1])
      metrics.maxConsecutiveWinsMoney = parseFloat(match[2].replace(/\s/g, ''))
    }
  } else if (label.includes('Maximum consecutive losses')) {
    const match = value.match(/(\d+)\s*\(([\d\s.-]+)\)/)
    if (match) {
      metrics.maxConsecutiveLosses = parseInt(match[1])
      metrics.maxConsecutiveLossesMoney = parseFloat(match[2].replace(/\s/g, ''))
    }
  } else if (label.includes('Maximal consecutive profit')) {
    const match = value.match(/([\d\s.]+)\s*\((\d+)\)/)
    if (match) {
      metrics.maximalConsecutiveProfit = parseFloat(match[1].replace(/\s/g, ''))
      metrics.maximalConsecutiveProfitCount = parseInt(match[2])
    }
  } else if (label.includes('Maximal consecutive loss')) {
    const match = value.match(/([\d\s.-]+)\s*\((\d+)\)/)
    if (match) {
      metrics.maximalConsecutiveLoss = parseFloat(match[1].replace(/\s/g, ''))
      metrics.maximalConsecutiveLossCount = parseInt(match[2])
    }
  } else if (label.includes('Average consecutive wins:')) {
    metrics.averageConsecutiveWins = parseInt(cleanValue)
  } else if (label.includes('Average consecutive losses:')) {
    metrics.averageConsecutiveLosses = parseInt(cleanValue)
  } else if (label.includes('Bars:')) {
    metrics.bars = parseInt(cleanValue)
  } else if (label.includes('Ticks:')) {
    metrics.ticks = parseInt(cleanValue)
  } else if (label.includes('Symbols:')) {
    metrics.symbols = parseInt(cleanValue)
  } else if (label.includes('Margin Level:')) {
    metrics.marginLevel = parseFloat(cleanValue.replace('%', ''))
  } else if (label.includes('Z-Score:')) {
    const match = value.match(/([\d.-]+)\s*\(([\d.]+)%\)/)
    if (match) {
      metrics.zScore = parseFloat(match[1])
      metrics.zScorePercent = parseFloat(match[2])
    }
  } else if (label.includes('AHPR:')) {
    const match = value.match(/([\d.]+)\s*\(([\d.]+)%\)/)
    if (match) {
      metrics.ahpr = parseFloat(match[1])
      metrics.ahprPercent = parseFloat(match[2])
    }
  } else if (label.includes('GHPR:')) {
    const match = value.match(/([\d.]+)\s*\(([\d.]+)%\)/)
    if (match) {
      metrics.ghpr = parseFloat(match[1])
      metrics.ghprPercent = parseFloat(match[2])
    }
  } else if (label.includes('LR Correlation:')) {
    metrics.lrCorrelation = parseFloat(cleanValue)
  } else if (label.includes('LR Standard Error:')) {
    metrics.lrStandardError = parseFloat(cleanValue)
  } else if (label.includes('Correlation (Profits,MFE):')) {
    metrics.correlationProfitsMFE = parseFloat(cleanValue)
  } else if (label.includes('Correlation (Profits,MAE):')) {
    metrics.correlationProfitsMAE = parseFloat(cleanValue)
  } else if (label.includes('Correlation (MFE,MAE):')) {
    metrics.correlationMFEMAE = parseFloat(cleanValue)
  } else if (label.includes('Minimal position holding time:')) {
    metrics.minPositionHoldingTime = value
  } else if (label.includes('Maximal position holding time:')) {
    metrics.maxPositionHoldingTime = value
  } else if (label.includes('Average position holding time:')) {
    metrics.avgPositionHoldingTime = value
  } else if (label.includes('OnTester result:')) {
    metrics.onTesterResult = parseFloat(cleanValue)
  }
}

function parseDateTime(dateTimeStr: string): Date | null {
  // Parse format: "2025.01.02 06:06:40"
  const match = dateTimeStr.match(/(\d{4})\.(\d{2})\.(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/)
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
