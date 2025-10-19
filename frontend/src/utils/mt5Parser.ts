import type { MT5AccountInfo, MT5Trade, MT5PerformanceMetrics, MT5Report, ParsedMT5Data } from '@/types/mt5'

/**
 * Parse MT5 HTML report and extract all data
 */
export function parseMT5Report(htmlContent: string): ParsedMT5Data {
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(htmlContent, 'text/html')

    // Extract account info
    const accountInfo = parseAccountInfo(doc)

    // Extract trades
    const trades = parseTrades(doc)

    // Extract performance metrics
    const metrics = parseMetrics(doc)

    // Determine report period from trades
    const reportPeriodStart = trades.length > 0
      ? new Date(Math.min(...trades.map(t => t.openTime.getTime())))
      : undefined
    const reportPeriodEnd = trades.length > 0
      ? new Date(Math.max(...trades.map(t => t.closeTime.getTime())))
      : undefined

    const report: MT5Report = {
      accountInfo,
      trades,
      metrics,
      uploadedAt: new Date(),
      reportPeriodStart,
      reportPeriodEnd,
    }

    return { success: true, report }
  } catch (error) {
    console.error('Error parsing MT5 report:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error parsing report'
    }
  }
}

function parseAccountInfo(doc: Document): MT5AccountInfo {
  // Extract from header table
  const rows = doc.querySelectorAll('tr')

  let name = ''
  let accountNumber = ''
  let company = ''
  let reportDate = new Date()
  let currency = 'USD'
  let server = ''
  let accountType = 'real'
  let hedgingMode = 'Hedge'

  rows.forEach(row => {
    const cells = row.querySelectorAll('th')
    if (cells.length >= 2) {
      const label = cells[0]?.textContent?.trim() || ''
      const value = cells[1]?.textContent?.trim() || ''

      if (label.includes('Name:')) {
        name = value.replace(/\*$/, '')
      } else if (label.includes('Account:')) {
        // Parse: "13342140 (USD, FundedNext-Server 2, real, Hedge)"
        const match = value.match(/^(\d+)\s*\(([^,]+),\s*([^,]+),\s*([^,]+),\s*([^)]+)\)/)
        if (match) {
          accountNumber = match[1]
          currency = match[2].trim()
          server = match[3].trim()
          accountType = match[4].trim()
          hedgingMode = match[5].trim()
        } else {
          accountNumber = value.split(/\s+/)[0] || ''
        }
      } else if (label.includes('Company:')) {
        company = value
      } else if (label.includes('Date:')) {
        reportDate = parseDate(value) || new Date()
      }
    }
  })

  return {
    name,
    accountNumber,
    company,
    currency,
    server,
    accountType,
    hedgingMode,
    reportDate,
  }
}

function parseTrades(doc: Document): MT5Trade[] {
  const trades: MT5Trade[] = []

  // Find the positions table
  const tables = doc.querySelectorAll('table')
  let positionsTable: Element | null = null

  // Find table with "Positions" header
  for (const table of tables) {
    const header = table.querySelector('th[colspan="14"]')
    if (header?.textContent?.includes('Positions')) {
      positionsTable = table
      break
    }
  }

  if (!positionsTable) return trades

  // Find data rows (skip header rows)
  const rows = positionsTable.querySelectorAll('tr[bgcolor="#FFFFFF"], tr[bgcolor="#F7F7F7"]')

  rows.forEach(row => {
    const cells = row.querySelectorAll('td')
    if (cells.length >= 13) {
      try {
        const trade: MT5Trade = {
          openTime: parseDate(cells[0]?.textContent?.trim() || '') || new Date(),
          position: cells[1]?.textContent?.trim() || '',
          symbol: cells[2]?.textContent?.trim() || '',
          type: cells[3]?.textContent?.trim().toLowerCase() === 'buy' ? 'buy' : 'sell',
          volume: parseFloat(cells[4]?.textContent?.trim() || '0'),
          openPrice: parseFloat(cells[5]?.textContent?.trim() || '0'),
          stopLoss: parseFloat(cells[6]?.textContent?.trim() || '0'),
          takeProfit: parseFloat(cells[7]?.textContent?.trim() || '0'),
          closeTime: parseDate(cells[8]?.textContent?.trim() || '') || new Date(),
          closePrice: parseFloat(cells[9]?.textContent?.trim() || '0'),
          commission: parseFloat(cells[10]?.textContent?.trim() || '0'),
          swap: parseFloat(cells[11]?.textContent?.trim() || '0'),
          profit: parseFloat(cells[12]?.textContent?.trim().replace(/\s/g, '') || '0'),
        }
        trades.push(trade)
      } catch (error) {
        console.warn('Error parsing trade row:', error)
      }
    }
  })

  return trades
}

function parseMetrics(doc: Document): MT5PerformanceMetrics {
  const metrics: Partial<MT5PerformanceMetrics> = {}

  // Helper function to extract value from label
  const findValue = (labelText: string): number => {
    const rows = doc.querySelectorAll('tr')
    for (const row of rows) {
      const cells = row.querySelectorAll('td')
      for (let i = 0; i < cells.length; i++) {
        const cell = cells[i]
        if (cell?.textContent?.includes(labelText)) {
          // Look for bold value in next cells
          for (let j = i + 1; j < cells.length && j < i + 3; j++) {
            const valueCell = cells[j]
            const boldValue = valueCell?.querySelector('b')?.textContent?.trim()
            if (boldValue) {
              // Remove spaces and parse
              const cleaned = boldValue.replace(/\s/g, '').replace(/[()%]/g, '')
              const num = parseFloat(cleaned)
              if (!isNaN(num)) return num
            }
          }
        }
      }
    }
    return 0
  }

  const findPercentValue = (labelText: string): number => {
    const rows = doc.querySelectorAll('tr')
    for (const row of rows) {
      const cells = row.querySelectorAll('td')
      for (let i = 0; i < cells.length; i++) {
        const cell = cells[i]
        if (cell?.textContent?.includes(labelText)) {
          for (let j = i + 1; j < cells.length && j < i + 3; j++) {
            const valueCell = cells[j]
            const boldValue = valueCell?.querySelector('b')?.textContent?.trim()
            if (boldValue && boldValue.includes('%')) {
              const match = boldValue.match(/([\d.]+)%/)
              if (match) return parseFloat(match[1])
            }
          }
        }
      }
    }
    return 0
  }

  // Parse all metrics
  metrics.initialDeposit = findValue('Deposit:')
  metrics.balance = findValue('Balance:')
  metrics.equity = findValue('Equity:')
  metrics.margin = findValue('Margin:')
  metrics.freeMargin = findValue('Free Margin:')
  metrics.marginLevel = findPercentValue('Margin Level:')
  metrics.floatingPL = findValue('Floating P/L:')
  metrics.creditFacility = findValue('Credit Facility:')

  metrics.totalNetProfit = findValue('Total Net Profit:')
  metrics.grossProfit = findValue('Gross Profit:')
  metrics.grossLoss = findValue('Gross Loss:')
  metrics.profitFactor = findValue('Profit Factor:')
  metrics.expectedPayoff = findValue('Expected Payoff:')

  metrics.recoveryFactor = findValue('Recovery Factor:')
  metrics.sharpeRatio = findValue('Sharpe Ratio:')
  metrics.balanceDrawdownAbsolute = findValue('Balance Drawdown Absolute:')

  // Parse drawdown with percentage
  const drawdownMaxText = doc.body.textContent || ''
  const drawdownMatch = drawdownMaxText.match(/Balance Drawdown Maximal:\s*<\/td>\s*<td[^>]*><b>([\d\s.]+)\s*\(([\d.]+)%\)<\/b>/)
  if (drawdownMatch) {
    metrics.balanceDrawdownMaximal = parseFloat(drawdownMatch[1].replace(/\s/g, ''))
    metrics.balanceDrawdownMaximalPercent = parseFloat(drawdownMatch[2])
  } else {
    metrics.balanceDrawdownMaximal = 0
    metrics.balanceDrawdownMaximalPercent = 0
  }

  metrics.balanceDrawdownRelative = findPercentValue('Balance Drawdown Relative:')
  metrics.balanceDrawdownRelativePercent = findPercentValue('Balance Drawdown Relative:')

  metrics.totalTrades = findValue('Total Trades:')

  // Parse trades with percentages
  const parseTradeStats = (labelText: string): { count: number; percent: number } => {
    const rows = doc.querySelectorAll('tr')
    for (const row of rows) {
      const cells = row.querySelectorAll('td')
      for (let i = 0; i < cells.length; i++) {
        const cell = cells[i]
        if (cell?.textContent?.includes(labelText)) {
          for (let j = i + 1; j < cells.length && j < i + 3; j++) {
            const valueCell = cells[j]
            const boldValue = valueCell?.querySelector('b')?.textContent?.trim()
            if (boldValue) {
              const match = boldValue.match(/([\d]+)\s*\(([\d.]+)%\)/)
              if (match) {
                return { count: parseInt(match[1]), percent: parseFloat(match[2]) }
              }
            }
          }
        }
      }
    }
    return { count: 0, percent: 0 }
  }

  const shortTrades = parseTradeStats('Short Trades (won %):')
  metrics.shortTrades = shortTrades.count
  metrics.shortTradesWonPercent = shortTrades.percent
  metrics.shortTradesWon = Math.round((shortTrades.count * shortTrades.percent) / 100)

  const longTrades = parseTradeStats('Long Trades (won %):')
  metrics.longTrades = longTrades.count
  metrics.longTradesWonPercent = longTrades.percent
  metrics.longTradesWon = Math.round((longTrades.count * longTrades.percent) / 100)

  const profitTrades = parseTradeStats('Profit Trades (% of total):')
  metrics.profitTrades = profitTrades.count
  metrics.profitTradesPercent = profitTrades.percent

  const lossTrades = parseTradeStats('Loss Trades (% of total):')
  metrics.lossTrades = lossTrades.count
  metrics.lossTradesPercent = lossTrades.percent

  metrics.largestProfitTrade = findValue('Largest profit trade:')
  metrics.largestLossTrade = findValue('Largest loss trade:')
  metrics.averageProfitTrade = findValue('Average profit trade:')
  metrics.averageLossTrade = findValue('Average loss trade:')

  // Parse consecutive stats with counts
  const parseConsecutive = (labelText: string): { count: number; money: number } => {
    const rows = doc.querySelectorAll('tr')
    for (const row of rows) {
      const cells = row.querySelectorAll('td')
      for (let i = 0; i < cells.length; i++) {
        const cell = cells[i]
        if (cell?.textContent?.includes(labelText)) {
          for (let j = i + 1; j < cells.length && j < i + 3; j++) {
            const valueCell = cells[j]
            const boldValue = valueCell?.querySelector('b')?.textContent?.trim()
            if (boldValue) {
              const match = boldValue.match(/([\d]+)\s*\(([\d.-]+)\)/)
              if (match) {
                return { count: parseInt(match[1]), money: parseFloat(match[2]) }
              }
            }
          }
        }
      }
    }
    return { count: 0, money: 0 }
  }

  const maxConsecWins = parseConsecutive('Maximum consecutive wins')
  metrics.maxConsecutiveWins = maxConsecWins.count
  metrics.maxConsecutiveWinsMoney = maxConsecWins.money

  const maxConsecLosses = parseConsecutive('Maximum consecutive losses')
  metrics.maxConsecutiveLosses = maxConsecLosses.count
  metrics.maxConsecutiveLossesMoney = maxConsecLosses.money

  const maximalProfit = parseConsecutive('Maximal consecutive profit')
  metrics.maximalConsecutiveProfit = maximalProfit.money
  metrics.maximalConsecutiveProfitCount = maximalProfit.count

  const maximalLoss = parseConsecutive('Maximal consecutive loss')
  metrics.maximalConsecutiveLoss = maximalLoss.money
  metrics.maximalConsecutiveLossCount = maximalLoss.count

  metrics.averageConsecutiveWins = findValue('Average consecutive wins:')
  metrics.averageConsecutiveLosses = findValue('Average consecutive losses:')

  return metrics as MT5PerformanceMetrics
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null

  // Handle format: "2024.12.24 05:48:00" or "2025.10.19 21:49"
  const match = dateStr.match(/(\d{4})\.(\d{2})\.(\d{2})\s+(\d{2}):(\d{2})(?::(\d{2}))?/)
  if (match) {
    const [, year, month, day, hour, minute, second] = match
    return new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hour),
      parseInt(minute),
      second ? parseInt(second) : 0
    )
  }

  return null
}

/**
 * Calculate additional derived metrics
 */
export function calculateDerivedMetrics(report: MT5Report) {
  const { trades, metrics } = report

  // Calculate win rate
  const winRate = metrics.totalTrades > 0
    ? (metrics.profitTrades / metrics.totalTrades) * 100
    : 0

  // Calculate ROI
  const roi = metrics.initialDeposit > 0
    ? (metrics.totalNetProfit / metrics.initialDeposit) * 100
    : 0

  // Calculate average trade duration
  const avgDuration = trades.length > 0
    ? trades.reduce((sum, trade) => {
        const duration = trade.closeTime.getTime() - trade.openTime.getTime()
        return sum + duration
      }, 0) / trades.length
    : 0

  return {
    winRate,
    roi,
    avgTradeDurationMs: avgDuration,
    avgTradeDurationHours: avgDuration / (1000 * 60 * 60),
  }
}
