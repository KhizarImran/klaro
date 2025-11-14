import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TrendingUp, Wallet, Target, TrendingDown, Award, AlertTriangle, BarChart3, List, Menu, Upload, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ReportUpload } from '@/components/dashboard/ReportUpload'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { TradesTable } from '@/components/dashboard/TradesTable'
import { ReportsSidebar, type SavedReport } from '@/components/dashboard/ReportsSidebar'
import { EquityBalanceCurve } from '@/components/charts/EquityBalanceCurve'
import { MonthlyReturnsHeatmap } from '@/components/charts/MonthlyReturnsHeatmap'
import { MagicNumberBreakdown } from '@/components/charts/MagicNumberBreakdown'
import type { AnyMT5Report, MT5Trade } from '@/types/mt5'

export interface SelectedMonth {
  year: number
  month: number
}
import { calculateDerivedMetrics } from '@/utils/mt5Parser'
import { loadReports, saveReport, deleteReport, getActiveReportId, setActiveReportId, getReportById } from '@/utils/reportStorage'

export function DashboardPage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [savedReports, setSavedReports] = useState<SavedReport[]>([])
  const [activeReportId, setActiveReportIdState] = useState<string | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedMonths, setSelectedMonths] = useState<SelectedMonth[]>([])

  // Load saved reports on mount
  useEffect(() => {
    if (!user?.id) return // Wait for user to be loaded

    const reports = loadReports(user.id)
    setSavedReports(reports)

    const activeId = getActiveReportId(user.id)
    if (activeId && reports.find(r => r.id === activeId)) {
      setActiveReportIdState(activeId)
      setShowUpload(false) // Ensure upload is hidden when loading saved report
    } else if (reports.length > 0) {
      // If no active report but reports exist, select the most recent
      setActiveReportIdState(reports[reports.length - 1].id)
      setShowUpload(false) // Ensure upload is hidden when auto-selecting report
    } else {
      // No reports, show upload
      setShowUpload(true)
    }
  }, [user?.id])

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const handleReportParsed = (parsedReport: AnyMT5Report) => {
    if (!user?.id) return

    const savedReport = saveReport(parsedReport, user.id)
    setSavedReports(loadReports(user.id))
    setActiveReportIdState(savedReport.id)
    setShowUpload(false)
    setSidebarOpen(false)
  }

  const handleSelectReport = (reportId: string) => {
    if (!user?.id) return

    setActiveReportIdState(reportId)
    setActiveReportId(reportId, user.id)
    setShowUpload(false) // Hide upload screen when selecting a report
    setSidebarOpen(false)
  }

  const handleDeleteReport = (reportId: string) => {
    if (!user?.id) return

    if (confirm('Are you sure you want to delete this report?')) {
      deleteReport(reportId, user.id)
      const updatedReports = loadReports(user.id)
      setSavedReports(updatedReports)

      // If we deleted the active report, select another or show upload
      if (reportId === activeReportId) {
        if (updatedReports.length > 0) {
          setActiveReportIdState(updatedReports[updatedReports.length - 1].id)
          setActiveReportId(updatedReports[updatedReports.length - 1].id, user.id)
        } else {
          setActiveReportIdState(null)
          setShowUpload(true)
        }
      }
    }
  }

  const handleUploadNew = () => {
    setShowUpload(true)
    setSidebarOpen(false)
  }

  const activeReport = activeReportId && user?.id ? getReportById(activeReportId, user.id)?.report : null

  // Handle month selection from heatmap
  const handleMonthSelect = (year: number, month: number) => {
    setSelectedMonths(prev => {
      const exists = prev.some(m => m.year === year && m.month === month)
      if (exists) {
        // Remove if already selected
        return prev.filter(m => !(m.year === year && m.month === month))
      } else {
        // Add to selection
        return [...prev, { year, month }]
      }
    })
  }

  const handleClearSelection = () => {
    setSelectedMonths([])
  }

  // Filter trades by selected months
  const filteredTrades = useMemo(() => {
    if (!activeReport || selectedMonths.length === 0) {
      return activeReport?.trades as MT5Trade[] || []
    }

    const trades = activeReport.trades as MT5Trade[]
    return trades.filter(trade => {
      const year = trade.closeTime.getFullYear()
      const month = trade.closeTime.getMonth()
      return selectedMonths.some(sm => sm.year === year && sm.month === month)
    })
  }, [activeReport, selectedMonths])

  // Recalculate metrics based on filtered trades
  const filteredMetrics = useMemo(() => {
    if (!activeReport || selectedMonths.length === 0 || filteredTrades.length === 0) {
      return activeReport?.metrics
    }

    // Calculate metrics from filtered trades
    const winningTrades = filteredTrades.filter(t => t.profit > 0)
    const losingTrades = filteredTrades.filter(t => t.profit < 0)

    const totalProfit = winningTrades.reduce((sum, t) => sum + t.profit + t.commission + t.swap, 0)
    const totalLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.profit + t.commission + t.swap, 0))
    const totalNetProfit = filteredTrades.reduce((sum, t) => sum + t.profit + t.commission + t.swap, 0)

    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0
    const expectedPayoff = filteredTrades.length > 0 ? totalNetProfit / filteredTrades.length : 0

    const longTrades = filteredTrades.filter(t => t.type === 'buy')
    const shortTrades = filteredTrades.filter(t => t.type === 'sell')
    const longWins = longTrades.filter(t => t.profit > 0)
    const shortWins = shortTrades.filter(t => t.profit > 0)

    return {
      ...activeReport.metrics,
      totalTrades: filteredTrades.length,
      totalNetProfit,
      grossProfit: totalProfit,
      grossLoss: totalLoss,
      profitFactor,
      expectedPayoff,
      profitTrades: winningTrades.length,
      profitTradesPercent: filteredTrades.length > 0 ? (winningTrades.length / filteredTrades.length) * 100 : 0,
      lossTrades: losingTrades.length,
      lossTradesPercent: filteredTrades.length > 0 ? (losingTrades.length / filteredTrades.length) * 100 : 0,
      longTrades: longTrades.length,
      longTradesWon: longWins.length,
      longTradesWonPercent: longTrades.length > 0 ? (longWins.length / longTrades.length) * 100 : 0,
      shortTrades: shortTrades.length,
      shortTradesWon: shortWins.length,
      shortTradesWonPercent: shortTrades.length > 0 ? (shortWins.length / shortTrades.length) * 100 : 0,
      largestProfitTrade: winningTrades.length > 0 ? Math.max(...winningTrades.map(t => t.profit + t.commission + t.swap)) : 0,
      largestLossTrade: losingTrades.length > 0 ? Math.min(...losingTrades.map(t => t.profit + t.commission + t.swap)) : 0,
      averageProfitTrade: winningTrades.length > 0 ? totalProfit / winningTrades.length : 0,
      averageLossTrade: losingTrades.length > 0 ? totalLoss / losingTrades.length : 0,
    }
  }, [activeReport, filteredTrades, selectedMonths])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  const formatPercent = (value: number | undefined) => {
    if (value === undefined || value === null) return 'N/A'
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
  }

  const derived = activeReport && activeReport.type === 'trade-history' ? calculateDerivedMetrics(activeReport) : null

  return (
    <div className="min-h-screen bg-[oklch(10%_0.01_240)] text-white">
      {/* Sidebar */}
      {sidebarOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Sidebar */}
          <ReportsSidebar
            reports={savedReports}
            activeReportId={activeReportId}
            onSelectReport={handleSelectReport}
            onDeleteReport={handleDeleteReport}
            onClose={() => setSidebarOpen(false)}
            onUploadNew={handleUploadNew}
          />
        </>
      )}

      {/* Navigation */}
      <nav className="border-b border-[oklch(25%_0.01_240)] bg-[oklch(10%_0.01_240)]">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo & Menu */}
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="text-[oklch(65%_0.01_240)] hover:text-white hover:bg-[oklch(20%_0.01_240)]"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-8 w-8 text-emerald-500" />
                <span className="text-2xl font-bold">Klaro</span>
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              {activeReport && !showUpload && (
                <Button
                  onClick={handleUploadNew}
                  variant="outline"
                  className="border-emerald-500 text-emerald-500 hover:bg-emerald-500/10"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload New
                </Button>
              )}
              <span className="text-sm text-[oklch(65%_0.01_240)]">
                {user?.email}
              </span>
              <Button
                onClick={handleSignOut}
                variant="outline"
                className="border-emerald-500 text-emerald-500 hover:bg-emerald-500/10"
              >
                Sign out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">
            Welcome to your <span className="text-emerald-500">Dashboard</span>
          </h1>
          <p className="text-lg text-[oklch(65%_0.01_240)]">
            {activeReport && !showUpload
              ? activeReport.type === 'trade-history'
                ? `Analyzing account ${activeReport.accountInfo.accountNumber} from ${activeReport.accountInfo.company}`
                : activeReport.type === 'backtest'
                  ? `Backtest: ${activeReport.settings.expert} on ${activeReport.settings.symbol}`
                  : 'MT5 Report Loaded'
              : 'Upload your MT5 report to get started with advanced analytics'
            }
          </p>
        </div>

        {showUpload || !activeReport ? (
          <ReportUpload onReportParsed={handleReportParsed} />
        ) : (
          <div className="space-y-8">
            {/* Report Info Banner */}
            <div className="bg-[oklch(14%_0.01_240)] border border-[oklch(25%_0.01_240)] rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  {activeReport.type === 'trade-history' ? (
                    <>
                      <h2 className="text-2xl font-bold text-white mb-1">
                        {activeReport.accountInfo.name}
                      </h2>
                      <p className="text-[oklch(65%_0.01_240)]">
                        Account: {activeReport.accountInfo.accountNumber} • {activeReport.accountInfo.company} • {activeReport.accountInfo.server}
                      </p>
                    </>
                  ) : activeReport.type === 'backtest' ? (
                    <>
                      <h2 className="text-2xl font-bold text-white mb-1">
                        {activeReport.settings.expert}
                      </h2>
                      <p className="text-[oklch(65%_0.01_240)]">
                        Symbol: {activeReport.settings.symbol} • Period: {activeReport.settings.period} • Broker: {activeReport.settings.broker}
                      </p>
                    </>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setSidebarOpen(true)}
                    variant="outline"
                    className="border-[oklch(35%_0.01_240)] text-[oklch(65%_0.01_240)] hover:bg-[oklch(20%_0.01_240)]"
                  >
                    <Menu className="h-4 w-4 mr-2" />
                    Reports ({savedReports.length})
                  </Button>
                </div>
              </div>
            </div>

            {/* Month Selection Indicator */}
            {selectedMonths.length > 0 && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-sm font-semibold text-white">
                        Filtering by {selectedMonths.length} selected month{selectedMonths.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <span className="text-xs text-[oklch(65%_0.01_240)]">
                      Showing {filteredTrades.length} of {activeReport.trades.length} trades
                    </span>
                  </div>
                  <Button
                    onClick={handleClearSelection}
                    variant="ghost"
                    size="sm"
                    className="text-emerald-500 hover:text-white hover:bg-emerald-500/20"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear Filter
                  </Button>
                </div>
              </div>
            )}

            {/* Tabs Navigation */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-[oklch(14%_0.01_240)] border border-[oklch(25%_0.01_240)]">
                <TabsTrigger value="overview" className="data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-500">
                  <Target className="h-4 w-4 mr-2" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="charts" className="data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-500">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Charts
                </TabsTrigger>
                <TabsTrigger value="trades" className="data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-500">
                  <List className="h-4 w-4 mr-2" />
                  Trades
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-8 mt-6">
                {/* Key Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                  <MetricCard
                    title="Balance"
                    value={formatCurrency(filteredMetrics?.balance)}
                    subtitle={`Deposit: ${formatCurrency(activeReport.metrics.initialDeposit)}`}
                    icon={Wallet}
                    trend="neutral"
                  />

                  <MetricCard
                    title="Equity"
                    value={formatCurrency(filteredMetrics?.equity)}
                    subtitle={`Margin: ${formatCurrency(filteredMetrics?.margin)}`}
                    icon={TrendingUp}
                    trend="neutral"
                  />

                  <MetricCard
                    title="Net P/L"
                    value={formatCurrency(filteredMetrics?.totalNetProfit)}
                    subtitle={derived ? `ROI: ${formatPercent(derived.roi)}` : undefined}
                    icon={TrendingDown}
                    trend={filteredMetrics?.totalNetProfit >= 0 ? 'positive' : 'negative'}
                  />

                  <MetricCard
                    title="Win Rate"
                    value={formatPercent(filteredMetrics?.profitTradesPercent)}
                    subtitle={`${filteredMetrics?.profitTrades}W / ${filteredMetrics?.lossTrades}L`}
                    icon={Target}
                    trend={filteredMetrics?.profitTradesPercent >= 50 ? 'positive' : 'negative'}
                  />

                  <MetricCard
                    title="Max Drawdown"
                    value={formatPercent(filteredMetrics?.balanceDrawdownMaximalPercent)}
                    subtitle={`${formatCurrency(filteredMetrics?.balanceDrawdownMaximal)} max`}
                    icon={AlertTriangle}
                    trend={filteredMetrics?.balanceDrawdownMaximalPercent < 10 ? 'positive' : 'negative'}
                  />
                </div>

                {/* Statistics Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Trading Statistics */}
                  <div className="bg-[oklch(14%_0.01_240)] border border-[oklch(25%_0.01_240)] rounded-lg p-6">
                    <div className="flex items-center mb-6">
                      <Award className="h-6 w-6 text-emerald-500 mr-3" />
                      <h2 className="text-xl font-bold text-white">Trading Statistics</h2>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center pb-3 border-b border-[oklch(20%_0.01_240)]">
                        <span className="text-[oklch(65%_0.01_240)]">Total Trades</span>
                        <span className="text-white font-semibold">{filteredMetrics?.totalTrades}</span>
                      </div>

                      <div className="flex justify-between items-center pb-3 border-b border-[oklch(20%_0.01_240)]">
                        <span className="text-[oklch(65%_0.01_240)]">Long Trades (won %)</span>
                        <span className="text-white font-semibold">
                          {filteredMetrics?.longTrades || 0} ({(filteredMetrics?.longTradesWonPercent || 0).toFixed(1)}%)
                        </span>
                      </div>

                      <div className="flex justify-between items-center pb-3 border-b border-[oklch(20%_0.01_240)]">
                        <span className="text-[oklch(65%_0.01_240)]">Short Trades (won %)</span>
                        <span className="text-white font-semibold">
                          {filteredMetrics?.shortTrades || 0} ({(filteredMetrics?.shortTradesWonPercent || 0).toFixed(1)}%)
                        </span>
                      </div>

                      <div className="flex justify-between items-center pb-3 border-b border-[oklch(20%_0.01_240)]">
                        <span className="text-[oklch(65%_0.01_240)]">Largest Win</span>
                        <span className="text-emerald-500 font-semibold">
                          {formatCurrency(filteredMetrics?.largestProfitTrade)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center pb-3 border-b border-[oklch(20%_0.01_240)]">
                        <span className="text-[oklch(65%_0.01_240)]">Largest Loss</span>
                        <span className="text-red-500 font-semibold">
                          {formatCurrency(filteredMetrics?.largestLossTrade)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center pb-3 border-b border-[oklch(20%_0.01_240)]">
                        <span className="text-[oklch(65%_0.01_240)]">Average Win</span>
                        <span className="text-emerald-500 font-semibold">
                          {formatCurrency(filteredMetrics?.averageProfitTrade)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-[oklch(65%_0.01_240)]">Average Loss</span>
                        <span className="text-red-500 font-semibold">
                          {formatCurrency(filteredMetrics?.averageLossTrade)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Risk Metrics */}
                  <div className="bg-[oklch(14%_0.01_240)] border border-[oklch(25%_0.01_240)] rounded-lg p-6">
                    <div className="flex items-center mb-6">
                      <AlertTriangle className="h-6 w-6 text-amber-500 mr-3" />
                      <h2 className="text-xl font-bold text-white">Risk & Performance Metrics</h2>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center pb-3 border-b border-[oklch(20%_0.01_240)]">
                        <span className="text-[oklch(65%_0.01_240)]">Profit Factor</span>
                        <span className={`font-semibold ${(filteredMetrics?.profitFactor || 0) >= 1.5 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {(filteredMetrics?.profitFactor || 0).toFixed(2)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center pb-3 border-b border-[oklch(20%_0.01_240)]">
                        <span className="text-[oklch(65%_0.01_240)]">Sharpe Ratio</span>
                        <span className={`font-semibold ${(filteredMetrics?.sharpeRatio || 0) >= 1 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {(filteredMetrics?.sharpeRatio || 0).toFixed(2)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center pb-3 border-b border-[oklch(20%_0.01_240)]">
                        <span className="text-[oklch(65%_0.01_240)]">Recovery Factor</span>
                        <span className={`font-semibold ${(filteredMetrics?.recoveryFactor || 0) >= 2 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {(filteredMetrics?.recoveryFactor || 0).toFixed(2)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center pb-3 border-b border-[oklch(20%_0.01_240)]">
                        <span className="text-[oklch(65%_0.01_240)]">Expected Payoff</span>
                        <span className={`font-semibold ${filteredMetrics?.expectedPayoff >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {formatCurrency(filteredMetrics?.expectedPayoff)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center pb-3 border-b border-[oklch(20%_0.01_240)]">
                        <span className="text-[oklch(65%_0.01_240)]">Gross Profit</span>
                        <span className="text-emerald-500 font-semibold">
                          {formatCurrency(filteredMetrics?.grossProfit)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center pb-3 border-b border-[oklch(20%_0.01_240)]">
                        <span className="text-[oklch(65%_0.01_240)]">Gross Loss</span>
                        <span className="text-red-500 font-semibold">
                          {formatCurrency(filteredMetrics?.grossLoss)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-[oklch(65%_0.01_240)]">Max Consecutive Losses</span>
                        <span className="text-red-500 font-semibold">
                          {filteredMetrics?.maxConsecutiveLosses} ({formatCurrency(filteredMetrics?.maxConsecutiveLossesMoney)})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Charts Tab */}
              <TabsContent value="charts" className="space-y-8 mt-6">
                {/* Equity & Balance Curve */}
                <EquityBalanceCurve
                  trades={filteredTrades}
                  initialDeposit={activeReport.metrics.initialDeposit}
                  currency={activeReport.type === 'trade-history' ? activeReport.accountInfo.currency : 'USD'}
                />

                {/* Monthly Returns Heatmap */}
                <MonthlyReturnsHeatmap
                  trades={activeReport.trades as MT5Trade[]}
                  initialDeposit={activeReport.metrics.initialDeposit}
                  currency={activeReport.type === 'trade-history' ? activeReport.accountInfo.currency : 'USD'}
                  selectedMonths={selectedMonths}
                  onMonthSelect={handleMonthSelect}
                />

                {/* Magic Number Breakdown */}
                <MagicNumberBreakdown
                  trades={filteredTrades}
                  currency={activeReport.type === 'trade-history' ? activeReport.accountInfo.currency : 'USD'}
                />
              </TabsContent>

              {/* Trades Tab */}
              <TabsContent value="trades" className="mt-6">
                <TradesTable
                  trades={filteredTrades}
                  currency={activeReport.type === 'trade-history' ? activeReport.accountInfo.currency : 'USD'}
                />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  )
}
