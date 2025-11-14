import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, TrendingDown, Target, Award, AlertTriangle } from 'lucide-react'
import type { MT5Trade } from '@/types/mt5'

interface MagicNumberBreakdownProps {
  trades: MT5Trade[]
  currency?: string
}

interface MagicNumberStats {
  magicNumber: number | string
  totalTrades: number
  winningTrades: number
  losingTrades: number
  totalProfit: number
  totalLoss: number
  netProfit: number
  winRate: number
  profitFactor: number
  avgWin: number
  avgLoss: number
}

export function MagicNumberBreakdown({ trades, currency = 'USD' }: MagicNumberBreakdownProps) {
  const magicNumberStats = useMemo(() => {
    if (!trades || trades.length === 0) return []

    // Group trades by strategy name (preferred) or magic number
    const groupedTrades = new Map<number | string, MT5Trade[]>()

    trades.forEach(trade => {
      // Prefer strategy name, fallback to magic number, then "Unknown"
      const key = trade.strategy ?? trade.magicNumber ?? 'Unknown'
      if (!groupedTrades.has(key)) {
        groupedTrades.set(key, [])
      }
      groupedTrades.get(key)!.push(trade)
    })

    // Calculate stats for each strategy/magic number
    const stats: MagicNumberStats[] = []

    groupedTrades.forEach((tradesForMagic, magicNumber) => {
      const totalTrades = tradesForMagic.length
      const winningTrades = tradesForMagic.filter(t => t.profit > 0)
      const losingTrades = tradesForMagic.filter(t => t.profit < 0)

      const totalProfit = winningTrades.reduce((sum, t) => sum + t.profit + t.commission + t.swap, 0)
      const totalLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.profit + t.commission + t.swap, 0))
      const netProfit = tradesForMagic.reduce((sum, t) => sum + t.profit + t.commission + t.swap, 0)

      const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0
      const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0
      const avgWin = winningTrades.length > 0 ? totalProfit / winningTrades.length : 0
      const avgLoss = losingTrades.length > 0 ? totalLoss / losingTrades.length : 0

      stats.push({
        magicNumber,
        totalTrades,
        winningTrades: winningTrades.length,
        losingTrades: losingTrades.length,
        totalProfit,
        totalLoss,
        netProfit,
        winRate,
        profitFactor,
        avgWin,
        avgLoss,
      })
    })

    // Sort by net profit descending
    return stats.sort((a, b) => b.netProfit - a.netProfit)
  }, [trades])

  const chartData = useMemo(() => {
    return magicNumberStats.map(stat => ({
      name: String(stat.magicNumber),
      profit: stat.netProfit,
      trades: stat.totalTrades,
    }))
  }, [magicNumberStats])

  if (magicNumberStats.length === 0) {
    return (
      <Card className="border-[oklch(25%_0.01_240)] bg-[oklch(14%_0.01_240)]">
        <CardHeader>
          <CardTitle className="text-white">Strategy Breakdown</CardTitle>
          <CardDescription>No trade data available</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  // Single strategy view - enhanced card layout
  if (magicNumberStats.length === 1) {
    const stat = magicNumberStats[0]
    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value)
    }

    return (
      <Card className="border-[oklch(25%_0.01_240)] bg-[oklch(14%_0.01_240)]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Strategy Performance</CardTitle>
              <CardDescription>Detailed analysis for {String(stat.magicNumber)}</CardDescription>
            </div>
            <Badge
              variant={stat.netProfit >= 0 ? "default" : "destructive"}
              className={stat.netProfit >= 0 ? "bg-emerald-500 hover:bg-emerald-600" : ""}
            >
              {stat.netProfit >= 0 ? '+' : ''}{formatCurrency(stat.netProfit)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Win Rate Card */}
            <div className="bg-[oklch(18%_0.01_240)] rounded-lg p-4 border border-[oklch(25%_0.01_240)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[oklch(65%_0.01_240)]">Win Rate</span>
                <Target className={`h-4 w-4 ${stat.winRate >= 50 ? 'text-emerald-500' : 'text-red-500'}`} />
              </div>
              <div className="text-2xl font-bold text-white mb-2">
                {stat.winRate.toFixed(1)}%
              </div>
              <Progress
                value={stat.winRate}
                className="h-2"
              />
              <div className="mt-2 text-xs text-[oklch(65%_0.01_240)]">
                {stat.winningTrades}W / {stat.losingTrades}L of {stat.totalTrades} trades
              </div>
            </div>

            {/* Profit Factor Card */}
            <div className="bg-[oklch(18%_0.01_240)] rounded-lg p-4 border border-[oklch(25%_0.01_240)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[oklch(65%_0.01_240)]">Profit Factor</span>
                <Award className={`h-4 w-4 ${stat.profitFactor >= 1.5 ? 'text-emerald-500' : 'text-amber-500'}`} />
              </div>
              <div className="text-2xl font-bold text-white mb-2">
                {stat.profitFactor === Infinity ? '∞' : stat.profitFactor.toFixed(2)}
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="flex-1">
                  <div className="text-[oklch(65%_0.01_240)]">Gross Profit</div>
                  <div className="text-emerald-500 font-semibold">{formatCurrency(stat.totalProfit)}</div>
                </div>
                <div className="text-[oklch(45%_0.01_240)]">vs</div>
                <div className="flex-1 text-right">
                  <div className="text-[oklch(65%_0.01_240)]">Gross Loss</div>
                  <div className="text-red-500 font-semibold">{formatCurrency(stat.totalLoss)}</div>
                </div>
              </div>
            </div>

            {/* Average Trade Card */}
            <div className="bg-[oklch(18%_0.01_240)] rounded-lg p-4 border border-[oklch(25%_0.01_240)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[oklch(65%_0.01_240)]">Average Trade</span>
                {stat.netProfit >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
              </div>
              <div className="text-2xl font-bold text-white mb-2">
                {formatCurrency(stat.netProfit / stat.totalTrades)}
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="flex-1">
                  <div className="text-[oklch(65%_0.01_240)]">Avg Win</div>
                  <div className="text-emerald-500 font-semibold">{formatCurrency(stat.avgWin)}</div>
                </div>
                <div className="text-[oklch(45%_0.01_240)]">/</div>
                <div className="flex-1 text-right">
                  <div className="text-[oklch(65%_0.01_240)]">Avg Loss</div>
                  <div className="text-red-500 font-semibold">{formatCurrency(stat.avgLoss)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Profit/Loss Distribution */}
          <div className="bg-[oklch(18%_0.01_240)] rounded-lg p-4 border border-[oklch(25%_0.01_240)]">
            <h4 className="text-sm font-semibold text-white mb-3">Profit/Loss Distribution</h4>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-[oklch(65%_0.01_240)]">Winning Trades</span>
                  <span className="text-emerald-500 font-semibold">
                    {stat.winningTrades} trades ({((stat.winningTrades / stat.totalTrades) * 100).toFixed(1)}%)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress
                    value={(stat.winningTrades / stat.totalTrades) * 100}
                    className="h-2 flex-1"
                  />
                  <span className="text-emerald-500 text-xs font-semibold min-w-[80px] text-right">
                    {formatCurrency(stat.totalProfit)}
                  </span>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-[oklch(65%_0.01_240)]">Losing Trades</span>
                  <span className="text-red-500 font-semibold">
                    {stat.losingTrades} trades ({((stat.losingTrades / stat.totalTrades) * 100).toFixed(1)}%)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress
                    value={(stat.losingTrades / stat.totalTrades) * 100}
                    className="h-2 flex-1 [&>div]:bg-red-500"
                  />
                  <span className="text-red-500 text-xs font-semibold min-w-[80px] text-right">
                    {formatCurrency(stat.totalLoss)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-[oklch(18%_0.01_240)] rounded text-xs text-[oklch(65%_0.01_240)]">
            <p><strong>Strategy:</strong> {String(stat.magicNumber)} • All {stat.totalTrades} trades from this account use this strategy</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Multiple strategies view - bar chart + table
  return (
    <Card className="border-[oklch(25%_0.01_240)] bg-[oklch(14%_0.01_240)]">
      <CardHeader>
        <CardTitle className="text-white">Strategy Breakdown</CardTitle>
        <CardDescription>Performance comparison across {magicNumberStats.length} strategies</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(25% 0.01 240)" />
            <XAxis
              dataKey="name"
              stroke="oklch(65% 0.01 240)"
              tick={{ fill: 'oklch(65% 0.01 240)' }}
              tickLine={{ stroke: 'oklch(25% 0.01 240)' }}
            />
            <YAxis
              stroke="oklch(65% 0.01 240)"
              tick={{ fill: 'oklch(65% 0.01 240)' }}
              tickLine={{ stroke: 'oklch(25% 0.01 240)' }}
              tickFormatter={(value) => `${value.toFixed(0)}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'oklch(14% 0.01 240)',
                border: '1px solid oklch(25% 0.01 240)',
                borderRadius: '6px',
                color: 'white',
              }}
              labelStyle={{ color: 'white' }}
              itemStyle={{ color: 'white' }}
              formatter={(value: number, name: string) => {
                if (name === 'profit') return [`${value.toFixed(2)} ${currency}`, 'Net Profit']
                if (name === 'trades') return [value, 'Total Trades']
                return [value, name]
              }}
            />
            <Legend
              wrapperStyle={{ color: 'oklch(65% 0.01 240)' }}
            />
            <Bar dataKey="profit" name="Net Profit" radius={[8, 8, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? '#10b981' : '#ef4444'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <div className="mt-6 space-y-4">
          <h4 className="text-sm font-semibold text-white">Detailed Statistics</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[oklch(25%_0.01_240)]">
                  <th className="text-left text-[oklch(65%_0.01_240)] font-medium p-2">Strategy</th>
                  <th className="text-right text-[oklch(65%_0.01_240)] font-medium p-2">Trades</th>
                  <th className="text-right text-[oklch(65%_0.01_240)] font-medium p-2">Win Rate</th>
                  <th className="text-right text-[oklch(65%_0.01_240)] font-medium p-2">Net Profit</th>
                  <th className="text-right text-[oklch(65%_0.01_240)] font-medium p-2">Profit Factor</th>
                  <th className="text-right text-[oklch(65%_0.01_240)] font-medium p-2">Avg Win</th>
                  <th className="text-right text-[oklch(65%_0.01_240)] font-medium p-2">Avg Loss</th>
                </tr>
              </thead>
              <tbody>
                {magicNumberStats.map((stat, index) => (
                  <tr key={index} className="border-b border-[oklch(20%_0.01_240)]">
                    <td className="text-white font-medium p-2">{String(stat.magicNumber)}</td>
                    <td className="text-right text-white p-2">
                      {stat.totalTrades}
                      <span className="text-[oklch(65%_0.01_240)] ml-1">
                        ({stat.winningTrades}W / {stat.losingTrades}L)
                      </span>
                    </td>
                    <td className="text-right text-white p-2">
                      <span className={stat.winRate >= 50 ? 'text-emerald-500' : 'text-red-500'}>
                        {stat.winRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="text-right p-2">
                      <span className={stat.netProfit >= 0 ? 'text-emerald-500 font-semibold' : 'text-red-500 font-semibold'}>
                        {stat.netProfit >= 0 ? '+' : ''}{stat.netProfit.toFixed(2)} {currency}
                      </span>
                    </td>
                    <td className="text-right text-white p-2">
                      {stat.profitFactor === Infinity ? '∞' : stat.profitFactor.toFixed(2)}
                    </td>
                    <td className="text-right text-emerald-500 p-2">
                      +{stat.avgWin.toFixed(2)}
                    </td>
                    <td className="text-right text-red-500 p-2">
                      -{stat.avgLoss.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 p-3 bg-[oklch(18%_0.01_240)] rounded text-xs text-[oklch(65%_0.01_240)]">
          <p><strong>Note:</strong> Trades are grouped by strategy name from your Expert Advisor. Trades without a strategy identifier are grouped under "Unknown".</p>
        </div>
      </CardContent>
    </Card>
  )
}
