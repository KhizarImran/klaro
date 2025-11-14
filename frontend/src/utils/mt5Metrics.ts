import type { MT5Report } from '@/types/mt5'

/**
 * Calculate derived metrics from an MT5 report
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
