import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { MT5Trade } from '@/types/mt5'

interface EquityBalanceCurveProps {
  trades: MT5Trade[]
  initialDeposit: number
  currency?: string
}

interface CurveDataPoint {
  date: string
  timestamp: number
  balance: number
  equity: number
}

export function EquityBalanceCurve({ trades, initialDeposit, currency = 'USD' }: EquityBalanceCurveProps) {
  const curveData = useMemo(() => {
    if (!trades || trades.length === 0) return []

    // Sort trades by close time
    const sortedTrades = [...trades].sort((a, b) => a.closeTime.getTime() - b.closeTime.getTime())

    const data: CurveDataPoint[] = []
    let runningBalance = initialDeposit

    // Add initial point
    data.push({
      date: sortedTrades[0].openTime.toLocaleDateString('en-GB'),
      timestamp: sortedTrades[0].openTime.getTime(),
      balance: initialDeposit,
      equity: initialDeposit,
    })

    // Calculate cumulative balance after each trade
    // Profit is gross profit, commission and swap are separate costs
    sortedTrades.forEach(trade => {
      runningBalance += trade.profit + trade.commission + trade.swap

      data.push({
        date: trade.closeTime.toLocaleDateString('en-GB'),
        timestamp: trade.closeTime.getTime(),
        balance: runningBalance,
        equity: runningBalance, // In closed trades, equity = balance
      })
    })

    return data
  }, [trades, initialDeposit])

  const stats = useMemo(() => {
    if (curveData.length === 0) return null

    const finalBalance = curveData[curveData.length - 1].balance
    const gain = finalBalance - initialDeposit
    const gainPercent = (gain / initialDeposit) * 100

    // Calculate max drawdown
    let maxBalance = initialDeposit
    let maxDrawdown = 0

    curveData.forEach(point => {
      if (point.balance > maxBalance) {
        maxBalance = point.balance
      }
      const drawdown = maxBalance - point.balance
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown
      }
    })

    const maxDrawdownPercent = maxBalance > 0 ? (maxDrawdown / maxBalance) * 100 : 0

    return {
      finalBalance,
      gain,
      gainPercent,
      maxDrawdown,
      maxDrawdownPercent,
    }
  }, [curveData, initialDeposit])

  if (curveData.length === 0) {
    return (
      <Card className="border-[oklch(25%_0.01_240)] bg-[oklch(14%_0.01_240)]">
        <CardHeader>
          <CardTitle className="text-white">Equity & Balance Curve</CardTitle>
          <CardDescription>No trade data available</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="border-[oklch(25%_0.01_240)] bg-[oklch(14%_0.01_240)]">
      <CardHeader>
        <CardTitle className="text-white">Equity & Balance Curve</CardTitle>
        <CardDescription>Account balance progression over time</CardDescription>
      </CardHeader>
      <CardContent>
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="space-y-1">
              <p className="text-xs text-[oklch(65%_0.01_240)]">Final Balance</p>
              <p className="text-lg font-semibold text-white">
                {stats.finalBalance.toFixed(2)} {currency}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-[oklch(65%_0.01_240)]">Total Gain</p>
              <p className={`text-lg font-semibold ${stats.gain >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {stats.gain >= 0 ? '+' : ''}{stats.gain.toFixed(2)} {currency}
                <span className="text-sm ml-1">({stats.gainPercent >= 0 ? '+' : ''}{stats.gainPercent.toFixed(2)}%)</span>
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-[oklch(65%_0.01_240)]">Max Drawdown</p>
              <p className="text-lg font-semibold text-red-500">
                {stats.maxDrawdown.toFixed(2)} {currency}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-[oklch(65%_0.01_240)]">Max DD %</p>
              <p className="text-lg font-semibold text-red-500">
                {stats.maxDrawdownPercent.toFixed(2)}%
              </p>
            </div>
          </div>
        )}

        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={curveData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(25% 0.01 240)" />
            <XAxis
              dataKey="date"
              stroke="oklch(65% 0.01 240)"
              tick={{ fill: 'oklch(65% 0.01 240)' }}
              tickLine={{ stroke: 'oklch(25% 0.01 240)' }}
            />
            <YAxis
              stroke="oklch(65% 0.01 240)"
              tick={{ fill: 'oklch(65% 0.01 240)' }}
              tickLine={{ stroke: 'oklch(25% 0.01 240)' }}
              domain={['auto', 'auto']}
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
              formatter={(value: number) => [`${value.toFixed(2)} ${currency}`, '']}
            />
            <Legend
              wrapperStyle={{ color: 'oklch(65% 0.01 240)' }}
              iconType="line"
            />
            <Line
              type="monotone"
              dataKey="balance"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              name="Balance"
            />
            <Line
              type="monotone"
              dataKey="equity"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              name="Equity"
              strokeDasharray="5 5"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
