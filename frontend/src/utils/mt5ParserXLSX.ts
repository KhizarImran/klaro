import * as XLSX from 'xlsx'
import type {
  MT5AccountInfo,
  MT5Trade,
  MT5PerformanceMetrics,
  MT5Report,
  ParsedMT5Data,
} from '@/types/mt5'

/**
 * Parse MT5 Trade History XLSX file and extract all data
 * Dynamic parser that adapts to different XLSX structures
 */
export function parseMT5ReportXLSX(file: ArrayBuffer): ParsedMT5Data {
  try {
    // Read workbook
    const workbook = XLSX.read(file)
    const sheet = workbook.Sheets[workbook.SheetNames[0]]

    // Convert to 2D array for easy access
    const data: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

    // Extract account info
    const accountInfo = parseAccountInfo(data)

    // Extract trades
    const trades = parseTrades(data)

    // Extract performance metrics
    const metrics = parseMetrics(data, trades)

    // Determine report period from trades
    const reportPeriodStart = trades.length > 0
      ? new Date(Math.min(...trades.map(t => t.openTime.getTime())))
      : undefined
    const reportPeriodEnd = trades.length > 0
      ? new Date(Math.max(...trades.map(t => t.closeTime.getTime())))
      : undefined

    const report: MT5Report = {
      type: 'trade-history',
      accountInfo,
      trades,
      metrics,
      uploadedAt: new Date(),
      reportPeriodStart,
      reportPeriodEnd,
    }

    return { success: true, report }
  } catch (error) {
    console.error('Error parsing MT5 XLSX report:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error parsing report'
    }
  }
}

function parseAccountInfo(data: any[][]): MT5AccountInfo {
  let name = ''
  let accountNumber = ''
  let company = ''
  let reportDate = new Date()
  let currency = 'USD'
  let server = ''
  let accountType = 'real'
  let hedgingMode = 'Hedge'

  // Search for account info in first 20 rows
  // Account info is typically in column 3 after the label in column 0
  for (let i = 0; i < Math.min(20, data.length); i++) {
    const row = data[i]
    if (!row) continue

    const label = row[0]?.toString().trim() || ''
    const value = row[3]?.toString().trim() || row[1]?.toString().trim() || ''

    // Look for "Name:" label
    if (label.includes('Name:')) {
      name = value
    }
    // Look for "Account:" label
    else if (label.includes('Account:')) {
      // Parse: "13342140 (USD, FundedNext-Server 2, real, Hedge)" or "52597896 (USD, ICMarketsSC-Demo, demo, Hedge)"
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
    }
    // Look for "Company:" label
    else if (label.includes('Company:')) {
      company = value
    }
    // Look for "Date:" label
    else if (label.includes('Date:')) {
      const parsed = parseDateTime(value)
      if (parsed) reportDate = parsed
    }
  }

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

/**
 * Parse Orders section to extract strategy names from comments
 * Returns a map of order numbers to strategy names
 */
function parseOrderStrategies(data: any[][]): Map<string, string> {
  const orderStrategyMap = new Map<string, string>()

  // Find "Orders" section header
  let ordersRowStart = -1
  for (let i = 0; i < data.length; i++) {
    const cell = data[i]?.[0]?.toString().trim() || ''
    if (cell === 'Orders') {
      ordersRowStart = i + 1 // Next row is the header row
      break
    }
  }

  if (ordersRowStart === -1) {
    return orderStrategyMap
  }

  // Find where Orders section ends
  let ordersRowEnd = data.length
  for (let i = ordersRowStart + 1; i < data.length; i++) {
    const cell = data[i]?.[0]?.toString().trim() || ''
    if (cell === 'Deals' || cell === 'Summary') {
      ordersRowEnd = i
      break
    }
  }

  // Parse header row to find Order and Comment columns
  const headerRow = data[ordersRowStart]
  let orderColIndex = -1
  let commentColIndex = -1

  headerRow.forEach((cell: any, index: number) => {
    const header = cell?.toString().toLowerCase().trim() || ''
    if (header === 'order') orderColIndex = index
    if (header === 'comment') commentColIndex = index
  })

  if (orderColIndex === -1 || commentColIndex === -1) {
    return orderStrategyMap
  }

  // Parse each order row and extract strategy from comment
  for (let i = ordersRowStart + 1; i < ordersRowEnd; i++) {
    const row = data[i]
    if (!row || row.length < 5) continue

    const orderNumber = row[orderColIndex]?.toString().trim()
    const comment = row[commentColIndex]?.toString().trim() || ''

    if (!orderNumber || !comment) continue

    // Extract strategy name from comment using the same patterns
    let strategy: string | undefined
    const bracketMatch = comment.match(/\[([^\]]+)\]/)
    const braceMatch = comment.match(/\{([^}]+)\}/)
    const underscoreMatch = comment.match(/^([A-Z][A-Za-z0-9_]+)/)

    if (bracketMatch) {
      strategy = bracketMatch[1].trim()
    } else if (braceMatch) {
      strategy = braceMatch[1].trim()
    } else if (underscoreMatch) {
      strategy = underscoreMatch[1].trim()
    } else {
      // If no pattern matches, use the comment as-is (like "RangeBO")
      strategy = comment
    }

    if (strategy) {
      orderStrategyMap.set(orderNumber, strategy)
    }
  }

  return orderStrategyMap
}

function parseTrades(data: any[][]): MT5Trade[] {
  const trades: MT5Trade[] = []

  // First, parse the Orders section to build a map of order numbers to strategy names
  const orderStrategyMap = parseOrderStrategies(data)

  // Find "Positions" section header
  let positionsRowStart = -1
  for (let i = 0; i < data.length; i++) {
    const cell = data[i]?.[0]?.toString().trim() || ''
    if (cell === 'Positions') {
      positionsRowStart = i + 1 // Next row is the header row
      break
    }
  }

  if (positionsRowStart === -1) {
    console.warn('Positions section not found')
    return trades
  }

  // Find where Positions section ends (when "Orders" or "Deals" section starts)
  let positionsRowEnd = data.length
  for (let i = positionsRowStart + 1; i < data.length; i++) {
    const cell = data[i]?.[0]?.toString().trim() || ''
    if (cell === 'Orders' || cell === 'Deals') {
      positionsRowEnd = i
      break
    }
  }

  // Parse header row to get column indices (dynamic mapping)
  const headerRow = data[positionsRowStart]
  const colMap: Record<string, number> = {}

  headerRow.forEach((cell: any, index: number) => {
    const header = cell?.toString().toLowerCase().trim() || ''

    // Map headers to columns
    if (header.includes('time') && !colMap.time) colMap.time = index
    if (header.includes('position') || header.includes('ticket')) colMap.position = index
    if (header.includes('symbol')) colMap.symbol = index
    if (header.includes('type')) colMap.type = index
    if (header.includes('volume')) colMap.volume = index
    if (header.includes('price') && !header.includes('t / p') && !colMap.openPrice) colMap.openPrice = index
    if (header.includes('s / l') || header.includes('stop')) colMap.stopLoss = index
    if (header.includes('t / p') || header.includes('take')) colMap.takeProfit = index
    if (header.includes('commission')) colMap.commission = index
    if (header.includes('swap')) colMap.swap = index
    if (header.includes('profit')) colMap.profit = index
    if (header.includes('comment')) colMap.comment = index
    if (header.includes('magic')) colMap.magicNumber = index
  })

  // The close time and close price are in later columns (typically after the first Time/Price)
  // Based on the file structure: Time, Position, Symbol, Type, Volume, Price, S/L, T/P, Time, Price, Commission, Swap, Profit
  // So we need to find the second Time and Price
  let timeCount = 0
  let priceCount = 0
  headerRow.forEach((cell: any, index: number) => {
    const header = cell?.toString().toLowerCase().trim() || ''
    if (header.includes('time')) {
      timeCount++
      if (timeCount === 2) colMap.closeTime = index
    }
    if (header.includes('price') && !header.includes('t / p') && !header.includes('s / l')) {
      priceCount++
      if (priceCount === 2) colMap.closePrice = index
    }
  })

  // Parse trades starting from the row after header
  const tradesStart = positionsRowStart + 1
  for (let i = tradesStart; i < positionsRowEnd; i++) {
    const row = data[i]
    if (!row || row.length < 5) continue

    try {
      // Extract data using column map
      const symbol = row[colMap.symbol]?.toString().trim() || ''
      const type = row[colMap.type]?.toString().toLowerCase().trim() || ''

      // Stop if we hit empty rows or non-trade data
      if (!symbol || (type !== 'buy' && type !== 'sell')) {
        continue
      }

      const timeStr = row[colMap.time]?.toString() || ''
      const position = row[colMap.position]?.toString() || ''
      const volume = parseFloat(row[colMap.volume] || 0)
      const openPrice = parseFloat(row[colMap.openPrice] || 0)
      const stopLoss = parseFloat(row[colMap.stopLoss] || 0)
      const takeProfit = parseFloat(row[colMap.takeProfit] || 0)
      const closeTimeStr = row[colMap.closeTime]?.toString() || ''
      const closePrice = parseFloat(row[colMap.closePrice] || 0)
      const commission = parseFloat(row[colMap.commission] || 0)
      const swap = parseFloat(row[colMap.swap] || 0)
      const profit = parseFloat(row[colMap.profit] || 0)
      const comment = row[colMap.comment]?.toString() || ''

      // Extract magic number if column exists
      const magicNumberRaw = colMap.magicNumber !== undefined ? row[colMap.magicNumber] : undefined
      const magicNumber = magicNumberRaw !== undefined && magicNumberRaw !== '' ? parseInt(magicNumberRaw.toString()) : undefined

      // Extract strategy name - try multiple sources in priority order:
      // 1. Look up position number in Orders section (most reliable)
      // 2. Extract from comment column in Positions section
      // 3. Fallback to undefined
      let strategy: string | undefined

      // Priority 1: Look up strategy from Orders section using position number
      if (position && orderStrategyMap.has(position)) {
        strategy = orderStrategyMap.get(position)
      }
      // Priority 2: Try to extract from comment column if it exists
      else if (comment) {
        const bracketMatch = comment.match(/\[([^\]]+)\]/)
        const braceMatch = comment.match(/\{([^}]+)\}/)
        const underscoreMatch = comment.match(/^([A-Z][A-Za-z0-9_]+)/)

        if (bracketMatch) {
          strategy = bracketMatch[1].trim()
        } else if (braceMatch) {
          strategy = braceMatch[1].trim()
        } else if (underscoreMatch) {
          strategy = underscoreMatch[1].trim()
        } else if (comment.length > 0) {
          // Use comment as-is if no pattern matches (like "RangeBO")
          strategy = comment
        }
      }

      const openTime = parseDateTime(timeStr)
      const closeTime = parseDateTime(closeTimeStr)

      if (!openTime || !closeTime) {
        console.warn('Failed to parse dates for trade:', { timeStr, closeTimeStr })
        continue
      }

      const trade: MT5Trade = {
        openTime,
        position,
        symbol,
        type: type as 'buy' | 'sell',
        volume,
        openPrice,
        stopLoss,
        takeProfit,
        closeTime,
        closePrice,
        commission,
        swap,
        profit,
        comment,
        ...(magicNumber !== undefined && !isNaN(magicNumber) && { magicNumber }),
        ...(strategy && { strategy }),
      }

      trades.push(trade)
    } catch (error) {
      console.warn('Error parsing trade row:', error)
      continue
    }
  }

  return trades
}

function parseMetrics(data: any[][], trades: MT5Trade[]): MT5PerformanceMetrics {
  const metrics: Partial<MT5PerformanceMetrics> = {}

  // Helper function to find value by exact row search
  const findValueInRow = (rowIndex: number, colIndex: number): number => {
    if (rowIndex < 0 || rowIndex >= data.length) return 0
    const value = data[rowIndex]?.[colIndex]
    if (value === undefined || value === '') return 0

    const str = value.toString().replace(/[,\s]/g, '')
    const num = parseFloat(str)
    return isNaN(num) ? 0 : num
  }

  // Find initial deposit from Deals section
  let initialDeposit = 0
  for (let i = 0; i < data.length; i++) {
    const row = data[i]
    if (row && row[0]?.toString().trim() === 'Deals') {
      // Check a few rows after "Deals" for balance entry
      for (let j = i + 1; j < Math.min(i + 10, data.length); j++) {
        const dealRow = data[j]
        const dealType = dealRow?.[3]?.toString().toLowerCase() || ''
        if (dealType === 'balance') {
          initialDeposit = parseFloat(dealRow?.[11] || 0)
          break
        }
      }
      break
    }
  }

  // Find metrics section dynamically
  let metricsSection: { balance?: number; equity?: number; margin?: number; freeMargin?: number; marginLevel?: number; floatingPL?: number; creditFacility?: number } = {}
  let resultsRowStart = -1

  for (let i = 0; i < data.length; i++) {
    const row = data[i]
    if (!row) continue

    const label0 = row[0]?.toString().trim() || ''
    const label6 = row[6]?.toString().trim() || ''

    // Parse balance/equity section (around row 109-112)
    if (label0 === 'Balance:') {
      metricsSection.balance = findValueInRow(i, 3)
    } else if (label0 === 'Equity:') {
      metricsSection.equity = findValueInRow(i, 3)
    } else if (label0 === 'Credit Facility:') {
      metricsSection.creditFacility = findValueInRow(i, 3)
    } else if (label0 === 'Floating P/L:') {
      metricsSection.floatingPL = findValueInRow(i, 3)
    } else if (label6 === 'Free Margin:') {
      metricsSection.freeMargin = findValueInRow(i, 9)
    } else if (label6 === 'Margin:') {
      metricsSection.margin = findValueInRow(i, 9)
    } else if (label6 === 'Margin Level:') {
      metricsSection.marginLevel = findValueInRow(i, 9)
    } else if (label0 === 'Results') {
      resultsRowStart = i
    }
  }

  // Set balance metrics
  metrics.initialDeposit = initialDeposit || 10000
  metrics.balance = metricsSection.balance || 0
  metrics.equity = metricsSection.equity || metrics.balance || 0
  metrics.margin = metricsSection.margin || 0
  metrics.freeMargin = metricsSection.freeMargin || 0
  metrics.marginLevel = metricsSection.marginLevel || 0
  metrics.floatingPL = metricsSection.floatingPL || 0
  metrics.creditFacility = metricsSection.creditFacility || 0

  // Parse Results section if found
  if (resultsRowStart > 0) {
    // Total Net Profit (row +1, col 3), Gross Profit (row +1, col 7), Gross Loss (row +1, col 11)
    metrics.totalNetProfit = findValueInRow(resultsRowStart + 1, 3)
    metrics.grossProfit = findValueInRow(resultsRowStart + 1, 7)
    metrics.grossLoss = findValueInRow(resultsRowStart + 1, 11)

    // Profit Factor (row +2, col 3), Expected Payoff (row +2, col 7)
    metrics.profitFactor = findValueInRow(resultsRowStart + 2, 3)
    metrics.expectedPayoff = findValueInRow(resultsRowStart + 2, 7)

    // Recovery Factor (row +3, col 3), Sharpe Ratio (row +3, col 7)
    metrics.recoveryFactor = findValueInRow(resultsRowStart + 3, 3)
    metrics.sharpeRatio = findValueInRow(resultsRowStart + 3, 7)

    // Balance Drawdown (row +5)
    metrics.balanceDrawdownAbsolute = findValueInRow(resultsRowStart + 5, 3)

    // Parse Balance Drawdown Maximal: "2 704.88 (2.65%)"
    const ddMaxStr = data[resultsRowStart + 5]?.[7]?.toString() || ''
    const ddMaxMatch = ddMaxStr.replace(/\s/g, '').match(/([\d.]+)\(([\d.]+)%\)/)
    if (ddMaxMatch) {
      metrics.balanceDrawdownMaximal = parseFloat(ddMaxMatch[1])
      metrics.balanceDrawdownMaximalPercent = parseFloat(ddMaxMatch[2])
    } else {
      metrics.balanceDrawdownMaximal = 0
      metrics.balanceDrawdownMaximalPercent = 0
    }

    // Parse Balance Drawdown Relative: "2.65% (2 704.88)"
    const ddRelStr = data[resultsRowStart + 5]?.[11]?.toString() || ''
    const ddRelMatch = ddRelStr.replace(/\s/g, '').match(/([\d.]+)%\(([\d.]+)\)/)
    if (ddRelMatch) {
      metrics.balanceDrawdownRelativePercent = parseFloat(ddRelMatch[1])
      metrics.balanceDrawdownRelative = parseFloat(ddRelMatch[2])
    } else {
      metrics.balanceDrawdownRelative = 0
      metrics.balanceDrawdownRelativePercent = 0
    }

    // Total Trades (row +6, col 3)
    metrics.totalTrades = Math.round(findValueInRow(resultsRowStart + 6, 3))

    // Short Trades: "9 (66.67%)" at (row +6, col 7)
    const shortStr = data[resultsRowStart + 6]?.[7]?.toString() || ''
    const shortMatch = shortStr.replace(/\s/g, '').match(/(\d+)\(([\d.]+)%\)/)
    if (shortMatch) {
      metrics.shortTrades = parseInt(shortMatch[1])
      metrics.shortTradesWonPercent = parseFloat(shortMatch[2])
      metrics.shortTradesWon = Math.round(metrics.shortTrades * metrics.shortTradesWonPercent / 100)
    } else {
      metrics.shortTrades = 0
      metrics.shortTradesWonPercent = 0
      metrics.shortTradesWon = 0
    }

    // Long Trades: "9 (44.44%)" at (row +6, col 11)
    const longStr = data[resultsRowStart + 6]?.[11]?.toString() || ''
    const longMatch = longStr.replace(/\s/g, '').match(/(\d+)\(([\d.]+)%\)/)
    if (longMatch) {
      metrics.longTrades = parseInt(longMatch[1])
      metrics.longTradesWonPercent = parseFloat(longMatch[2])
      metrics.longTradesWon = Math.round(metrics.longTrades * metrics.longTradesWonPercent / 100)
    } else {
      metrics.longTrades = 0
      metrics.longTradesWonPercent = 0
      metrics.longTradesWon = 0
    }

    // Profit Trades: "10 (55.56%)" at (row +7, col 7)
    const profitStr = data[resultsRowStart + 7]?.[7]?.toString() || ''
    const profitMatch = profitStr.replace(/\s/g, '').match(/(\d+)\(([\d.]+)%\)/)
    if (profitMatch) {
      metrics.profitTrades = parseInt(profitMatch[1])
      metrics.profitTradesPercent = parseFloat(profitMatch[2])
    } else {
      metrics.profitTrades = 0
      metrics.profitTradesPercent = 0
    }

    // Loss Trades: "8 (44.44%)" at (row +7, col 11)
    const lossStr = data[resultsRowStart + 7]?.[11]?.toString() || ''
    const lossMatch = lossStr.replace(/\s/g, '').match(/(\d+)\(([\d.]+)%\)/)
    if (lossMatch) {
      metrics.lossTrades = parseInt(lossMatch[1])
      metrics.lossTradesPercent = parseFloat(lossMatch[2])
    } else {
      metrics.lossTrades = 0
      metrics.lossTradesPercent = 0
    }

    // Largest profit/loss trades (row +8)
    metrics.largestProfitTrade = findValueInRow(resultsRowStart + 8, 7)
    metrics.largestLossTrade = findValueInRow(resultsRowStart + 8, 11)

    // Average profit/loss trades (row +9)
    metrics.averageProfitTrade = findValueInRow(resultsRowStart + 9, 7)
    metrics.averageLossTrade = findValueInRow(resultsRowStart + 9, 11)

    // Maximum consecutive wins/losses: "3 (773.29)" at (row +10)
    const maxWinsStr = data[resultsRowStart + 10]?.[7]?.toString() || ''
    const maxWinsMatch = maxWinsStr.replace(/\s/g, '').match(/(\d+)\(([\d.-]+)\)/)
    if (maxWinsMatch) {
      metrics.maxConsecutiveWins = parseInt(maxWinsMatch[1])
      metrics.maxConsecutiveWinsMoney = parseFloat(maxWinsMatch[2])
    } else {
      metrics.maxConsecutiveWins = 0
      metrics.maxConsecutiveWinsMoney = 0
    }

    const maxLossStr = data[resultsRowStart + 10]?.[11]?.toString() || ''
    const maxLossMatch = maxLossStr.replace(/\s/g, '').match(/(\d+)\(([\d.-]+)\)/)
    if (maxLossMatch) {
      metrics.maxConsecutiveLosses = parseInt(maxLossMatch[1])
      metrics.maxConsecutiveLossesMoney = parseFloat(maxLossMatch[2])
    } else {
      metrics.maxConsecutiveLosses = 0
      metrics.maxConsecutiveLossesMoney = 0
    }

    // Maximal consecutive profit/loss: "1 487.73 (2)" at (row +11)
    const maxProfitStr = data[resultsRowStart + 11]?.[7]?.toString() || ''
    const maxProfitMatch = maxProfitStr.replace(/\s/g, '').match(/([\d.-]+)\((\d+)\)/)
    if (maxProfitMatch) {
      metrics.maximalConsecutiveProfit = parseFloat(maxProfitMatch[1])
      metrics.maximalConsecutiveProfitCount = parseInt(maxProfitMatch[2])
    } else {
      metrics.maximalConsecutiveProfit = 0
      metrics.maximalConsecutiveProfitCount = 0
    }

    const maxLoss2Str = data[resultsRowStart + 11]?.[11]?.toString() || ''
    const maxLoss2Match = maxLoss2Str.replace(/\s/g, '').match(/([\d.-]+)\((\d+)\)/)
    if (maxLoss2Match) {
      metrics.maximalConsecutiveLoss = parseFloat(maxLoss2Match[1])
      metrics.maximalConsecutiveLossCount = parseInt(maxLoss2Match[2])
    } else {
      metrics.maximalConsecutiveLoss = 0
      metrics.maximalConsecutiveLossCount = 0
    }

    // Average consecutive wins/losses
    metrics.averageConsecutiveWins = 0
    metrics.averageConsecutiveLosses = 0
  } else {
    // No results section found, set defaults
    metrics.totalNetProfit = 0
    metrics.grossProfit = 0
    metrics.grossLoss = 0
    metrics.profitFactor = 0
    metrics.expectedPayoff = 0
    metrics.recoveryFactor = 0
    metrics.sharpeRatio = 0
    metrics.balanceDrawdownAbsolute = 0
    metrics.balanceDrawdownMaximal = 0
    metrics.balanceDrawdownMaximalPercent = 0
    metrics.balanceDrawdownRelative = 0
    metrics.balanceDrawdownRelativePercent = 0
    metrics.totalTrades = trades.length
    metrics.shortTrades = 0
    metrics.shortTradesWon = 0
    metrics.shortTradesWonPercent = 0
    metrics.longTrades = 0
    metrics.longTradesWon = 0
    metrics.longTradesWonPercent = 0
    metrics.profitTrades = 0
    metrics.profitTradesPercent = 0
    metrics.lossTrades = 0
    metrics.lossTradesPercent = 0
    metrics.largestProfitTrade = 0
    metrics.largestLossTrade = 0
    metrics.averageProfitTrade = 0
    metrics.averageLossTrade = 0
    metrics.maxConsecutiveWins = 0
    metrics.maxConsecutiveWinsMoney = 0
    metrics.maxConsecutiveLosses = 0
    metrics.maxConsecutiveLossesMoney = 0
    metrics.maximalConsecutiveProfit = 0
    metrics.maximalConsecutiveProfitCount = 0
    metrics.maximalConsecutiveLoss = 0
    metrics.maximalConsecutiveLossCount = 0
    metrics.averageConsecutiveWins = 0
    metrics.averageConsecutiveLosses = 0
  }

  return metrics as MT5PerformanceMetrics
}

function parseDateTime(dateStr: string): Date | null {
  if (!dateStr) return null

  // Try string date formats FIRST (before numeric parsing)
  // This prevents "2025.11.12" from being parsed as 2025.11 (Excel serial)

  // Try format: "2025.11.14 23:49" or "2025.11.12 06:05:07"
  let match = dateStr.match(/(\d{4})\.(\d{2})\.(\d{2})\s+(\d{2}):(\d{2})(?::(\d{2}))?/)
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

  // Try format: "2024-12-24 05:48:00"
  match = dateStr.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})(?::(\d{2}))?/)
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

  // Try format: "12/24/2024 05:48:00"
  match = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{2}):(\d{2})(?::(\d{2}))?/)
  if (match) {
    const [, month, day, year, hour, minute, second] = match
    return new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hour),
      parseInt(minute),
      second ? parseInt(second) : 0
    )
  }

  // Try Excel serial date format LAST (only if it's a pure number)
  // Only use this if the string doesn't contain date separators
  if (!/[.\/\-:]/.test(dateStr)) {
    const asNumber = parseFloat(dateStr)
    if (!isNaN(asNumber) && asNumber > 1 && asNumber < 100000) {
      // Excel date serial number (days since 1900-01-01)
      const excelEpoch = new Date(1900, 0, 1)
      const msPerDay = 24 * 60 * 60 * 1000
      // Excel incorrectly treats 1900 as a leap year, so we need to subtract 2 days
      const date = new Date(excelEpoch.getTime() + (asNumber - 2) * msPerDay)
      if (!isNaN(date.getTime())) return date
    }
  }

  return null
}
