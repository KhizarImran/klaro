import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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

    // Group trades by magic number
    const groupedTrades = new Map<number | string, MT5Trade[]>()

    trades.forEach(trade => {
      const key = trade.magicNumber ?? 'No Magic Number'
      if (!groupedTrades.has(key)) {
        groupedTrades.set(key, [])
      }
      groupedTrades.get(key)!.push(trade)
    })

    // Calculate stats for each magic number
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
          <CardTitle className="text-white">Magic Number Breakdown</CardTitle>
          <CardDescription>No trade data available</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="border-[oklch(25%_0.01_240)] bg-[oklch(14%_0.01_240)]">
      <CardHeader>
        <CardTitle className="text-white">Magic Number Breakdown</CardTitle>
        <CardDescription>Performance analysis by trading algorithm (magic number)</CardDescription>
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
              labelStyle={{ color: 'oklch(65% 0.01 240)' }}
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
                  <th className="text-left text-[oklch(65%_0.01_240)] font-medium p-2">Magic #</th>
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
          <p><strong>Note:</strong> Magic numbers identify different trading algorithms or strategies. Trades without a magic number are grouped under "No Magic Number".</p>
        </div>
      </CardContent>
    </Card>
  )
}
