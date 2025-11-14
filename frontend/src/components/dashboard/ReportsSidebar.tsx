import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Trash2, X, Upload, TrendingUp, Zap } from 'lucide-react'
import type { AnyMT5Report } from '@/types/mt5'

export interface SavedReport {
  id: string
  report: AnyMT5Report
  savedAt: Date
  name: string
}

interface ReportsSidebarProps {
  reports: SavedReport[]
  activeReportId: string | null
  onSelectReport: (reportId: string) => void
  onDeleteReport: (reportId: string) => void
  onToggle: () => void
  onUploadNew: () => void
  isOpen: boolean
}

export function ReportsSidebar({
  reports,
  activeReportId,
  onSelectReport,
  onDeleteReport,
  onToggle,
  onUploadNew,
  isOpen,
}: ReportsSidebarProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className={`fixed inset-y-0 left-0 z-40 w-80 bg-[oklch(10%_0.01_240)] border-r border-[oklch(25%_0.01_240)] shadow-xl overflow-hidden flex flex-col transition-transform duration-300 ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[oklch(25%_0.01_240)]">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <FileText className="h-5 w-5 text-emerald-500" />
          Saved Reports
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="text-[oklch(65%_0.01_240)] hover:text-white hover:bg-[oklch(20%_0.01_240)]"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Upload New Button */}
      <div className="p-4 border-b border-[oklch(25%_0.01_240)]">
        <Button
          onClick={onUploadNew}
          className="w-full bg-emerald-500 text-white hover:bg-emerald-600"
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload New Report
        </Button>
      </div>

      {/* Reports List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {reports.length === 0 ? (
          <div className="text-center py-12 text-[oklch(65%_0.01_240)]">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No reports saved yet</p>
            <p className="text-xs mt-1">Upload your first MT5 report to get started</p>
          </div>
        ) : (
          reports.map((savedReport) => {
            const isActive = savedReport.id === activeReportId
            const netProfit = savedReport.report.metrics.totalNetProfit
            const tradeCount = savedReport.report.trades.length

            return (
              <Card
                key={savedReport.id}
                className={`p-4 cursor-pointer transition-all ${
                  isActive
                    ? 'bg-emerald-500/10 border-emerald-500'
                    : 'bg-[oklch(14%_0.01_240)] border-[oklch(25%_0.01_240)] hover:border-[oklch(35%_0.01_240)]'
                }`}
                onClick={() => onSelectReport(savedReport.id)}
              >
                <div className="space-y-2">
                  {/* Report Name */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      {savedReport.report.type === 'trade-history' ? (
                        <TrendingUp className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      ) : savedReport.report.type === 'backtest' ? (
                        <Zap className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <FileText className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold text-sm truncate">
                          {savedReport.name}
                        </h3>
                        <p className="text-[oklch(65%_0.01_240)] text-xs truncate">
                          {savedReport.report.type === 'trade-history'
                            ? savedReport.report.accountInfo.accountNumber
                            : savedReport.report.type === 'backtest'
                              ? `${savedReport.report.settings.symbol} • ${savedReport.report.settings.period}`
                              : 'MT5 Report'
                          }
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteReport(savedReport.id)
                      }}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-6 w-6 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Stats */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[oklch(65%_0.01_240)]">Trades</span>
                      <span className="text-white font-medium">{tradeCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[oklch(65%_0.01_240)]">Net P/L</span>
                      <span className={`font-semibold ${
                        netProfit >= 0 ? 'text-emerald-500' : 'text-red-500'
                      }`}>
                        {formatCurrency(netProfit)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[oklch(65%_0.01_240)]">Balance</span>
                      <span className="text-white">
                        {formatCurrency(savedReport.report.metrics.balance)}
                      </span>
                    </div>
                  </div>

                  {/* Saved Date */}
                  <div className="text-[oklch(55%_0.01_240)] text-xs pt-2 border-t border-[oklch(25%_0.01_240)]">
                    Saved {formatDate(savedReport.savedAt)}
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-[oklch(25%_0.01_240)] bg-[oklch(12%_0.01_240)]">
        <p className="text-xs text-[oklch(65%_0.01_240)]">
          {reports.length} {reports.length === 1 ? 'report' : 'reports'} saved locally
        </p>
      </div>
    </div>
  )
}
