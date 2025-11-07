import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { MT5Trade } from '@/types/mt5'
import { ArrowUpDown, TrendingUp, TrendingDown, ChevronLeft, ChevronRight } from 'lucide-react'

interface TradesTableProps {
  trades: MT5Trade[]
  currency?: string
}

type SortField = 'closeTime' | 'symbol' | 'profit' | 'volume'
type SortDirection = 'asc' | 'desc'

const TRADES_PER_PAGE = 30

export function TradesTable({ trades, currency = 'USD' }: TradesTableProps) {
  const [sortField, setSortField] = useState<SortField>('closeTime')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [currentPage, setCurrentPage] = useState(1)

  const sortedTrades = useMemo(() => {
    if (!trades || trades.length === 0) return []

    return [...trades].sort((a, b) => {
      let comparison = 0

      switch (sortField) {
        case 'closeTime':
          comparison = a.closeTime.getTime() - b.closeTime.getTime()
          break
        case 'symbol':
          comparison = a.symbol.localeCompare(b.symbol)
          break
        case 'profit':
          comparison = a.profit - b.profit
          break
        case 'volume':
          comparison = a.volume - b.volume
          break
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [trades, sortField, sortDirection])

  const totalPages = Math.ceil(sortedTrades.length / TRADES_PER_PAGE)

  const paginatedTrades = useMemo(() => {
    const startIndex = (currentPage - 1) * TRADES_PER_PAGE
    const endIndex = startIndex + TRADES_PER_PAGE
    return sortedTrades.slice(startIndex, endIndex)
  }, [sortedTrades, currentPage])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
    setCurrentPage(1) // Reset to first page when sorting
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handlePageClick = (page: number) => {
    setCurrentPage(page)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (!trades || trades.length === 0) {
    return (
      <Card className="border-[oklch(25%_0.01_240)] bg-[oklch(14%_0.01_240)]">
        <CardHeader>
          <CardTitle className="text-white">Trade History</CardTitle>
          <CardDescription>No trades available</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const totalProfit = trades.reduce((sum, t) => sum + t.profit + t.commission + t.swap, 0)
  const winningTrades = trades.filter(t => (t.profit + t.commission + t.swap) > 0).length
  const losingTrades = trades.filter(t => (t.profit + t.commission + t.swap) < 0).length

  const startIndex = (currentPage - 1) * TRADES_PER_PAGE + 1
  const endIndex = Math.min(currentPage * TRADES_PER_PAGE, sortedTrades.length)

  return (
    <Card className="border-[oklch(25%_0.01_240)] bg-[oklch(14%_0.01_240)]">
      <CardHeader>
        <CardTitle className="text-white">Trade History</CardTitle>
        <CardDescription>
          Showing {startIndex}-{endIndex} of {trades.length} total trades • {winningTrades} wins • {losingTrades} losses •
          <span className={totalProfit >= 0 ? 'text-emerald-500 ml-1' : 'text-red-500 ml-1'}>
            {formatCurrency(totalProfit)} net
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[oklch(25%_0.01_240)]">
                <th
                  className="text-left text-[oklch(65%_0.01_240)] font-medium p-3 cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('closeTime')}
                >
                  <div className="flex items-center gap-1">
                    Close Time
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="text-left text-[oklch(65%_0.01_240)] font-medium p-3">Position</th>
                <th
                  className="text-left text-[oklch(65%_0.01_240)] font-medium p-3 cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('symbol')}
                >
                  <div className="flex items-center gap-1">
                    Symbol
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="text-left text-[oklch(65%_0.01_240)] font-medium p-3">Type</th>
                <th
                  className="text-right text-[oklch(65%_0.01_240)] font-medium p-3 cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('volume')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Volume
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="text-right text-[oklch(65%_0.01_240)] font-medium p-3">Open</th>
                <th className="text-right text-[oklch(65%_0.01_240)] font-medium p-3">Close</th>
                <th className="text-right text-[oklch(65%_0.01_240)] font-medium p-3">SL</th>
                <th className="text-right text-[oklch(65%_0.01_240)] font-medium p-3">TP</th>
                <th className="text-right text-[oklch(65%_0.01_240)] font-medium p-3">Comm</th>
                <th className="text-right text-[oklch(65%_0.01_240)] font-medium p-3">Swap</th>
                <th
                  className="text-right text-[oklch(65%_0.01_240)] font-medium p-3 cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('profit')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Net P/L
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="text-left text-[oklch(65%_0.01_240)] font-medium p-3">Strategy</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTrades.map((trade, index) => {
                const netPL = trade.profit + trade.commission + trade.swap
                const isWin = netPL > 0

                return (
                  <tr
                    key={index}
                    className="border-b border-[oklch(20%_0.01_240)] hover:bg-[oklch(18%_0.01_240)] transition-colors"
                  >
                    <td className="text-[oklch(85%_0.01_240)] p-3 whitespace-nowrap">
                      {formatDate(trade.closeTime)}
                    </td>
                    <td className="text-[oklch(75%_0.01_240)] p-3 font-mono text-xs">
                      {trade.position}
                    </td>
                    <td className="text-white font-semibold p-3">
                      {trade.symbol}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        trade.type === 'buy'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-orange-500/20 text-orange-400'
                      }`}>
                        {trade.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="text-right text-[oklch(85%_0.01_240)] p-3">
                      {trade.volume.toFixed(2)}
                    </td>
                    <td className="text-right text-[oklch(85%_0.01_240)] p-3">
                      {trade.openPrice.toFixed(5)}
                    </td>
                    <td className="text-right text-[oklch(85%_0.01_240)] p-3">
                      {trade.closePrice.toFixed(5)}
                    </td>
                    <td className="text-right text-[oklch(65%_0.01_240)] p-3 text-xs">
                      {trade.stopLoss > 0 ? trade.stopLoss.toFixed(5) : '-'}
                    </td>
                    <td className="text-right text-[oklch(65%_0.01_240)] p-3 text-xs">
                      {trade.takeProfit > 0 ? trade.takeProfit.toFixed(5) : '-'}
                    </td>
                    <td className="text-right text-[oklch(65%_0.01_240)] p-3 text-xs">
                      {formatCurrency(trade.commission)}
                    </td>
                    <td className="text-right text-[oklch(65%_0.01_240)] p-3 text-xs">
                      {formatCurrency(trade.swap)}
                    </td>
                    <td className="text-right p-3">
                      <div className="flex items-center justify-end gap-1">
                        {isWin ? (
                          <TrendingUp className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                        <span className={`font-semibold ${
                          isWin ? 'text-emerald-500' : 'text-red-500'
                        }`}>
                          {netPL >= 0 ? '+' : ''}{formatCurrency(netPL)}
                        </span>
                      </div>
                    </td>
                    <td className="text-[oklch(75%_0.01_240)] p-3 text-xs max-w-[150px] truncate">
                      {trade.strategy || '-'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-[oklch(65%_0.01_240)]">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="border-[oklch(35%_0.01_240)] text-[oklch(65%_0.01_240)] hover:bg-[oklch(20%_0.01_240)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    // Show first page, last page, current page, and pages around current
                    if (page === 1 || page === totalPages) return true
                    if (Math.abs(page - currentPage) <= 1) return true
                    return false
                  })
                  .map((page, index, array) => {
                    // Add ellipsis between non-consecutive pages
                    const showEllipsis = index > 0 && page - array[index - 1] > 1

                    return (
                      <div key={page} className="flex items-center">
                        {showEllipsis && (
                          <span className="px-2 text-[oklch(65%_0.01_240)]">...</span>
                        )}
                        <Button
                          variant={currentPage === page ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handlePageClick(page)}
                          className={
                            currentPage === page
                              ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                              : 'border-[oklch(35%_0.01_240)] text-[oklch(65%_0.01_240)] hover:bg-[oklch(20%_0.01_240)]'
                          }
                        >
                          {page}
                        </Button>
                      </div>
                    )
                  })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="border-[oklch(35%_0.01_240)] text-[oklch(65%_0.01_240)] hover:bg-[oklch(20%_0.01_240)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
