import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { MT5Trade } from '@/types/mt5'
import type { SelectedMonth } from '@/pages/DashboardPage'

interface MonthlyReturnsHeatmapProps {
  trades: MT5Trade[]
  initialDeposit: number
  currency?: string
  selectedMonths?: SelectedMonth[]
  onMonthSelect?: (year: number, month: number) => void
}

interface MonthlyReturn {
  year: number
  month: number
  monthName: string
  profit: number
  returnPercent: number
  startingBalance: number
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function MonthlyReturnsHeatmap({
  trades,
  initialDeposit,
  currency = 'USD',
  selectedMonths = [],
  onMonthSelect
}: MonthlyReturnsHeatmapProps) {
  const isMonthSelected = (year: number, month: number) => {
    return selectedMonths.some(sm => sm.year === year && sm.month === month)
  }
  const monthlyData = useMemo(() => {
    if (!trades || trades.length === 0) return { returns: [], years: [] }

    // Sort trades by close time
    const sortedTrades = [...trades].sort((a, b) => a.closeTime.getTime() - b.closeTime.getTime())

    // Group trades by month
    const monthlyReturns = new Map<string, MonthlyReturn>()
    let runningBalance = initialDeposit

    sortedTrades.forEach(trade => {
      const year = trade.closeTime.getFullYear()
      const month = trade.closeTime.getMonth()
      const key = `${year}-${month}`

      if (!monthlyReturns.has(key)) {
        monthlyReturns.set(key, {
          year,
          month,
          monthName: MONTHS[month],
          profit: 0,
          returnPercent: 0,
          startingBalance: runningBalance,
        })
      }

      const monthData = monthlyReturns.get(key)!
      monthData.profit += trade.profit + trade.commission + trade.swap
      runningBalance += trade.profit + trade.commission + trade.swap
    })

    // Calculate return percentages
    monthlyReturns.forEach(monthData => {
      monthData.returnPercent = (monthData.profit / monthData.startingBalance) * 100
    })

    // Get unique years
    const years = Array.from(new Set(Array.from(monthlyReturns.values()).map(r => r.year))).sort()

    return {
      returns: Array.from(monthlyReturns.values()),
      years,
    }
  }, [trades, initialDeposit])

  const getColorForReturn = (returnPercent: number): string => {
    if (returnPercent === 0) return 'bg-[oklch(20%_0.01_240)]'
    if (returnPercent > 0) {
      // Green shades for positive returns
      if (returnPercent > 10) return 'bg-emerald-600'
      if (returnPercent > 5) return 'bg-emerald-500'
      if (returnPercent > 2) return 'bg-emerald-400'
      return 'bg-emerald-300/50'
    } else {
      // Red shades for negative returns
      if (returnPercent < -10) return 'bg-red-600'
      if (returnPercent < -5) return 'bg-red-500'
      if (returnPercent < -2) return 'bg-red-400'
      return 'bg-red-300/50'
    }
  }

  const yearlyTotals = useMemo(() => {
    const totals = new Map<number, { profit: number; returnPercent: number }>()

    monthlyData.returns.forEach(monthReturn => {
      if (!totals.has(monthReturn.year)) {
        totals.set(monthReturn.year, { profit: 0, returnPercent: 0 })
      }
      const yearData = totals.get(monthReturn.year)!
      yearData.profit += monthReturn.profit
    })

    // Calculate yearly return percentages
    totals.forEach((yearData, year) => {
      const yearMonths = monthlyData.returns.filter(r => r.year === year)
      const startingBalance = yearMonths[0]?.startingBalance || initialDeposit
      yearData.returnPercent = (yearData.profit / startingBalance) * 100
    })

    return totals
  }, [monthlyData, initialDeposit])

  if (monthlyData.returns.length === 0) {
    return (
      <Card className="border-[oklch(25%_0.01_240)] bg-[oklch(14%_0.01_240)]">
        <CardHeader>
          <CardTitle className="text-white">Monthly Returns Heatmap</CardTitle>
          <CardDescription>No trade data available</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="border-[oklch(25%_0.01_240)] bg-[oklch(14%_0.01_240)]">
      <CardHeader>
        <CardTitle className="text-white">Monthly Returns Heatmap</CardTitle>
        <CardDescription>Monthly performance breakdown by year</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left text-xs text-[oklch(65%_0.01_240)] font-medium p-2">Year</th>
                {MONTHS.map(month => (
                  <th key={month} className="text-center text-xs text-[oklch(65%_0.01_240)] font-medium p-2">
                    {month}
                  </th>
                ))}
                <th className="text-center text-xs text-[oklch(65%_0.01_240)] font-medium p-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.years.map(year => (
                <tr key={year}>
                  <td className="text-white font-medium p-2">{year}</td>
                  {MONTHS.map((_, monthIndex) => {
                    const monthReturn = monthlyData.returns.find(
                      r => r.year === year && r.month === monthIndex
                    )

                    if (!monthReturn) {
                      return (
                        <td key={monthIndex} className="p-2">
                          <div className="h-12 rounded bg-[oklch(18%_0.01_240)]" />
                        </td>
                      )
                    }

                    const isSelected = isMonthSelected(year, monthIndex)

                    return (
                      <td key={monthIndex} className="p-2">
                        <div
                          onClick={() => onMonthSelect?.(year, monthIndex)}
                          className={`h-12 rounded flex flex-col items-center justify-center ${getColorForReturn(monthReturn.returnPercent)} ${
                            onMonthSelect ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''
                          } ${
                            isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-[oklch(14%_0.01_240)]' : ''
                          }`}
                          title={`${monthReturn.monthName} ${year}: ${monthReturn.returnPercent.toFixed(2)}% (${monthReturn.profit >= 0 ? '+' : ''}${monthReturn.profit.toFixed(2)} ${currency})${isSelected ? ' (Selected)' : ''}`}
                        >
                          <span className="text-xs font-semibold text-white">
                            {monthReturn.returnPercent >= 0 ? '+' : ''}{monthReturn.returnPercent.toFixed(1)}%
                          </span>
                          <span className="text-xs text-white/80">
                            {monthReturn.profit >= 0 ? '+' : ''}{monthReturn.profit.toFixed(0)}
                          </span>
                        </div>
                      </td>
                    )
                  })}
                  <td className="p-2">
                    {yearlyTotals.has(year) && (
                      <div
                        className={`h-12 rounded flex flex-col items-center justify-center ${getColorForReturn(yearlyTotals.get(year)!.returnPercent)}`}
                      >
                        <span className="text-xs font-semibold text-white">
                          {yearlyTotals.get(year)!.returnPercent >= 0 ? '+' : ''}
                          {yearlyTotals.get(year)!.returnPercent.toFixed(1)}%
                        </span>
                        <span className="text-xs text-white/80">
                          {yearlyTotals.get(year)!.profit >= 0 ? '+' : ''}
                          {yearlyTotals.get(year)!.profit.toFixed(0)}
                        </span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-600" />
            <span className="text-[oklch(65%_0.01_240)]">{'< -10%'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-400" />
            <span className="text-[oklch(65%_0.01_240)]">-2% to -10%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[oklch(20%_0.01_240)]" />
            <span className="text-[oklch(65%_0.01_240)]">~0%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-emerald-400" />
            <span className="text-[oklch(65%_0.01_240)]">2% to 10%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-emerald-600" />
            <span className="text-[oklch(65%_0.01_240)]">{'>10%'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
