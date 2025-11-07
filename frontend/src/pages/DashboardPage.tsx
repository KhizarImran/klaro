import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TrendingUp, Wallet, Target, TrendingDown, Award, AlertTriangle, BarChart3, List, Menu, Upload } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ReportUpload } from '@/components/dashboard/ReportUpload'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { TradesTable } from '@/components/dashboard/TradesTable'
import { ReportsSidebar, type SavedReport } from '@/components/dashboard/ReportsSidebar'
import { EquityBalanceCurve } from '@/components/charts/EquityBalanceCurve'
import { MonthlyReturnsHeatmap } from '@/components/charts/MonthlyReturnsHeatmap'
import { MagicNumberBreakdown } from '@/components/charts/MagicNumberBreakdown'
import type { MT5Report } from '@/types/mt5'
import { calculateDerivedMetrics } from '@/utils/mt5Parser'
import { loadReports, saveReport, deleteReport, getActiveReportId, setActiveReportId, getReportById } from '@/utils/reportStorage'

export function DashboardPage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [savedReports, setSavedReports] = useState<SavedReport[]>([])
  const [activeReportId, setActiveReportIdState] = useState<string | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Load saved reports on mount
  useEffect(() => {
    const reports = loadReports()
    setSavedReports(reports)

    const activeId = getActiveReportId()
    if (activeId && reports.find(r => r.id === activeId)) {
      setActiveReportIdState(activeId)
    } else if (reports.length > 0) {
      // If no active report but reports exist, select the most recent
      setActiveReportIdState(reports[reports.length - 1].id)
    } else {
      // No reports, show upload
      setShowUpload(true)
    }
  }, [])

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const handleReportParsed = (parsedReport: MT5Report) => {
    const savedReport = saveReport(parsedReport)
    setSavedReports(loadReports())
    setActiveReportIdState(savedReport.id)
    setShowUpload(false)
    setSidebarOpen(false)
  }

  const handleSelectReport = (reportId: string) => {
    setActiveReportIdState(reportId)
    setActiveReportId(reportId)
    setSidebarOpen(false)
  }

  const handleDeleteReport = (reportId: string) => {
    if (confirm('Are you sure you want to delete this report?')) {
      deleteReport(reportId)
      const updatedReports = loadReports()
      setSavedReports(updatedReports)

      // If we deleted the active report, select another or show upload
      if (reportId === activeReportId) {
        if (updatedReports.length > 0) {
          setActiveReportIdState(updatedReports[updatedReports.length - 1].id)
          setActiveReportId(updatedReports[updatedReports.length - 1].id)
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

  const activeReport = activeReportId ? getReportById(activeReportId)?.report : null

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
  }

  const derived = activeReport ? calculateDerivedMetrics(activeReport) : null

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
              ? `Analyzing account ${activeReport.accountInfo.accountNumber} from ${activeReport.accountInfo.company}`
              : 'Upload your MT5 report to get started with advanced analytics'
            }
          </p>
        </div>

        {showUpload || !activeReport ? (
          <ReportUpload onReportParsed={handleReportParsed} />
        ) : (
          <div className="space-y-8">
            {/* Account Info Banner */}
            <div className="bg-[oklch(14%_0.01_240)] border border-[oklch(25%_0.01_240)] rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">
                    {activeReport.accountInfo.name}
                  </h2>
                  <p className="text-[oklch(65%_0.01_240)]">
                    Account: {activeReport.accountInfo.accountNumber} • {activeReport.accountInfo.company} • {activeReport.accountInfo.server}
                  </p>
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
                    value={formatCurrency(activeReport.metrics.balance)}
                    subtitle={`Deposit: ${formatCurrency(activeReport.metrics.initialDeposit)}`}
                    icon={Wallet}
                    trend="neutral"
                  />

                  <MetricCard
                    title="Equity"
                    value={formatCurrency(activeReport.metrics.equity)}
                    subtitle={`Margin: ${formatCurrency(activeReport.metrics.margin)}`}
                    icon={TrendingUp}
                    trend="neutral"
                  />

                  <MetricCard
                    title="Net P/L"
                    value={formatCurrency(activeReport.metrics.totalNetProfit)}
                    subtitle={derived ? `ROI: ${formatPercent(derived.roi)}` : undefined}
                    icon={TrendingDown}
                    trend={activeReport.metrics.totalNetProfit >= 0 ? 'positive' : 'negative'}
                  />

                  <MetricCard
                    title="Win Rate"
                    value={formatPercent(activeReport.metrics.profitTradesPercent)}
                    subtitle={`${activeReport.metrics.profitTrades}W / ${activeReport.metrics.lossTrades}L`}
                    icon={Target}
                    trend={activeReport.metrics.profitTradesPercent >= 50 ? 'positive' : 'negative'}
                  />

                  <MetricCard
                    title="Max Drawdown"
                    value={formatPercent(activeReport.metrics.balanceDrawdownMaximalPercent)}
                    subtitle={`${formatCurrency(activeReport.metrics.balanceDrawdownMaximal)} max`}
                    icon={AlertTriangle}
                    trend={activeReport.metrics.balanceDrawdownMaximalPercent < 10 ? 'positive' : 'negative'}
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
                        <span className="text-white font-semibold">{activeReport.metrics.totalTrades}</span>
                      </div>

                      <div className="flex justify-between items-center pb-3 border-b border-[oklch(20%_0.01_240)]">
                        <span className="text-[oklch(65%_0.01_240)]">Long Trades (won %)</span>
                        <span className="text-white font-semibold">
                          {activeReport.metrics.longTrades} ({activeReport.metrics.longTradesWonPercent.toFixed(1)}%)
                        </span>
                      </div>

                      <div className="flex justify-between items-center pb-3 border-b border-[oklch(20%_0.01_240)]">
                        <span className="text-[oklch(65%_0.01_240)]">Short Trades (won %)</span>
                        <span className="text-white font-semibold">
                          {activeReport.metrics.shortTrades} ({activeReport.metrics.shortTradesWonPercent.toFixed(1)}%)
                        </span>
                      </div>

                      <div className="flex justify-between items-center pb-3 border-b border-[oklch(20%_0.01_240)]">
                        <span className="text-[oklch(65%_0.01_240)]">Largest Win</span>
                        <span className="text-emerald-500 font-semibold">
                          {formatCurrency(activeReport.metrics.largestProfitTrade)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center pb-3 border-b border-[oklch(20%_0.01_240)]">
                        <span className="text-[oklch(65%_0.01_240)]">Largest Loss</span>
                        <span className="text-red-500 font-semibold">
                          {formatCurrency(activeReport.metrics.largestLossTrade)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center pb-3 border-b border-[oklch(20%_0.01_240)]">
                        <span className="text-[oklch(65%_0.01_240)]">Average Win</span>
                        <span className="text-emerald-500 font-semibold">
                          {formatCurrency(activeReport.metrics.averageProfitTrade)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-[oklch(65%_0.01_240)]">Average Loss</span>
                        <span className="text-red-500 font-semibold">
                          {formatCurrency(activeReport.metrics.averageLossTrade)}
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
                        <span className={`font-semibold ${activeReport.metrics.profitFactor >= 1.5 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {activeReport.metrics.profitFactor.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center pb-3 border-b border-[oklch(20%_0.01_240)]">
                        <span className="text-[oklch(65%_0.01_240)]">Sharpe Ratio</span>
                        <span className={`font-semibold ${activeReport.metrics.sharpeRatio >= 1 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {activeReport.metrics.sharpeRatio.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center pb-3 border-b border-[oklch(20%_0.01_240)]">
                        <span className="text-[oklch(65%_0.01_240)]">Recovery Factor</span>
                        <span className={`font-semibold ${activeReport.metrics.recoveryFactor >= 2 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {activeReport.metrics.recoveryFactor.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center pb-3 border-b border-[oklch(20%_0.01_240)]">
                        <span className="text-[oklch(65%_0.01_240)]">Expected Payoff</span>
                        <span className={`font-semibold ${activeReport.metrics.expectedPayoff >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {formatCurrency(activeReport.metrics.expectedPayoff)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center pb-3 border-b border-[oklch(20%_0.01_240)]">
                        <span className="text-[oklch(65%_0.01_240)]">Gross Profit</span>
                        <span className="text-emerald-500 font-semibold">
                          {formatCurrency(activeReport.metrics.grossProfit)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center pb-3 border-b border-[oklch(20%_0.01_240)]">
                        <span className="text-[oklch(65%_0.01_240)]">Gross Loss</span>
                        <span className="text-red-500 font-semibold">
                          {formatCurrency(activeReport.metrics.grossLoss)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-[oklch(65%_0.01_240)]">Max Consecutive Losses</span>
                        <span className="text-red-500 font-semibold">
                          {activeReport.metrics.maxConsecutiveLosses} ({formatCurrency(activeReport.metrics.maxConsecutiveLossesMoney)})
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
                  trades={activeReport.trades}
                  initialDeposit={activeReport.metrics.initialDeposit}
                  currency={activeReport.accountInfo.currency}
                />

                {/* Monthly Returns Heatmap */}
                <MonthlyReturnsHeatmap
                  trades={activeReport.trades}
                  initialDeposit={activeReport.metrics.initialDeposit}
                  currency={activeReport.accountInfo.currency}
                />

                {/* Magic Number Breakdown */}
                <MagicNumberBreakdown
                  trades={activeReport.trades}
                  currency={activeReport.accountInfo.currency}
                />
              </TabsContent>

              {/* Trades Tab */}
              <TabsContent value="trades" className="mt-6">
                <TradesTable
                  trades={activeReport.trades}
                  currency={activeReport.accountInfo.currency}
                />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  )
}
