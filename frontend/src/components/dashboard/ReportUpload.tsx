import { useState, useCallback } from 'react'
import { Upload, FileText, AlertCircle, CheckCircle2, TrendingUp, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { parseMT5Report } from '@/utils/mt5Parser'
import { parseMT5BacktestReportXLSX } from '@/utils/mt5BacktestParserXLSX'
import type { MT5Report, MT5BacktestReport, AnyMT5Report } from '@/types/mt5'

interface ReportUploadProps {
  onReportParsed: (report: AnyMT5Report) => void
}

type ReportType = 'trade-history' | 'backtest'

export function ReportUpload({ onReportParsed }: ReportUploadProps) {
  const [tradeHistoryDragging, setTradeHistoryDragging] = useState(false)
  const [backtestDragging, setBacktestDragging] = useState(false)
  const [processingType, setProcessingType] = useState<ReportType | null>(null)
  const [error, setError] = useState<{ type: ReportType; message: string } | null>(null)
  const [success, setSuccess] = useState<ReportType | null>(null)

  const handleFile = useCallback(async (file: File, reportType: ReportType) => {
    setError(null)
    setSuccess(null)
    setProcessingType(reportType)

    try {
      // Parse the appropriate report type
      if (reportType === 'trade-history') {
        // Validate file type for trade history (HTML)
        if (!file.name.endsWith('.html') && !file.name.endsWith('.htm')) {
          throw new Error('Please upload an HTML file (.html or .htm)')
        }

        // Read file content as text
        const content = await file.text()
        const result = parseMT5Report(content)

        if (!result.success || !result.report) {
          throw new Error(result.error || 'Failed to parse MT5 Trade History report')
        }
        setSuccess(reportType)
        setTimeout(() => {
          onReportParsed(result.report!)
        }, 500)
      } else {
        // Validate file type for backtest (XLSX)
        if (!file.name.endsWith('.xlsx')) {
          throw new Error('Please upload an Excel file (.xlsx)')
        }

        // Read file content as ArrayBuffer for XLSX
        const buffer = await file.arrayBuffer()
        const result = parseMT5BacktestReportXLSX(buffer)

        if (!result.success || !result.report) {
          throw new Error(result.error || 'Failed to parse MT5 Backtest report')
        }
        setSuccess(reportType)
        setTimeout(() => {
          onReportParsed(result.report!)
        }, 500)
      }

    } catch (err) {
      setError({
        type: reportType,
        message: err instanceof Error ? err.message : 'Unknown error occurred'
      })
    } finally {
      setProcessingType(null)
    }
  }, [onReportParsed])

  const createDropHandlers = (reportType: ReportType) => ({
    onDrop: useCallback((e: React.DragEvent) => {
      e.preventDefault()
      if (reportType === 'trade-history') {
        setTradeHistoryDragging(false)
      } else {
        setBacktestDragging(false)
      }

      const file = e.dataTransfer.files[0]
      if (file) {
        handleFile(file, reportType)
      }
    }, [reportType]),

    onDragOver: useCallback((e: React.DragEvent) => {
      e.preventDefault()
      if (reportType === 'trade-history') {
        setTradeHistoryDragging(true)
      } else {
        setBacktestDragging(true)
      }
    }, [reportType]),

    onDragLeave: useCallback((e: React.DragEvent) => {
      e.preventDefault()
      if (reportType === 'trade-history') {
        setTradeHistoryDragging(false)
      } else {
        setBacktestDragging(false)
      }
    }, [reportType]),
  })

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>, reportType: ReportType) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file, reportType)
    }
  }, [handleFile])

  const renderUploadBox = (
    reportType: ReportType,
    isDragging: boolean,
    icon: React.ElementType,
    title: string,
    description: string,
    instructions: { title: string; steps: string[] },
    acceptedFiles: string
  ) => {
    const isProcessing = processingType === reportType
    const isSuccess = success === reportType
    const boxError = error?.type === reportType ? error.message : null
    const handlers = createDropHandlers(reportType)
    const inputId = `file-upload-${reportType}`

    return (
      <div className="w-full">
        <div
          {...handlers}
          className={`
            border-2 border-dashed rounded-lg p-10 text-center transition-all
            ${isDragging
              ? 'border-emerald-500 bg-emerald-500/10'
              : 'border-[oklch(25%_0.01_240)] bg-[oklch(14%_0.01_240)]'
            }
            ${isProcessing ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
          `}
        >
          <input
            type="file"
            accept={acceptedFiles}
            onChange={(e) => handleFileInput(e, reportType)}
            className="hidden"
            id={inputId}
            disabled={isProcessing}
          />

          <label htmlFor={inputId} className="cursor-pointer">
            <div className="flex flex-col items-center space-y-4">
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-emerald-500"></div>
                  <p className="text-base font-medium text-white">Processing report...</p>
                </>
              ) : isSuccess ? (
                <>
                  <CheckCircle2 className="h-14 w-14 text-emerald-500" />
                  <p className="text-base font-medium text-emerald-500">Report uploaded successfully!</p>
                </>
              ) : (
                <>
                  <div className="bg-emerald-500/10 rounded-full p-3">
                    {icon === TrendingUp ? (
                      <TrendingUp className="h-10 w-10 text-emerald-500" />
                    ) : (
                      <Zap className="h-10 w-10 text-amber-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-white mb-1">
                      {title}
                    </p>
                    <p className="text-sm text-[oklch(65%_0.01_240)] mb-3">
                      {description}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-emerald-500 text-emerald-500 hover:bg-emerald-500/10"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Choose File
                  </Button>
                  <p className="text-xs text-[oklch(55%_0.01_240)]">
                    Supports: {acceptedFiles.replace(/\./g, '').replace(/,/g, ', ')} files
                  </p>
                </>
              )}
            </div>
          </label>

          {boxError && (
            <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <div className="flex items-center text-red-400">
                <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                <p className="text-xs">{boxError}</p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 bg-[oklch(14%_0.01_240)] border border-[oklch(25%_0.01_240)] rounded-lg p-4">
          <h3 className="text-sm font-semibold text-white mb-2">{instructions.title}</h3>
          <ol className="space-y-1 text-[oklch(65%_0.01_240)] text-xs list-decimal list-inside">
            {instructions.steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Trade History Report Upload */}
        {renderUploadBox(
          'trade-history',
          tradeHistoryDragging,
          TrendingUp,
          'MT5 Trade History Report',
          'Upload your live trading account history',
          {
            title: 'How to export from MT5:',
            steps: [
              'Open MetaTrader 5 terminal',
              'Go to "Toolbox" → "History" tab',
              'Right-click and choose "Save as Detailed Report"',
              'Save the HTML file and upload it here',
            ],
          },
          '.html,.htm'
        )}

        {/* Backtest Report Upload */}
        {renderUploadBox(
          'backtest',
          backtestDragging,
          Zap,
          'MT5 Backtest Report',
          'Upload your Strategy Tester results (Excel format)',
          {
            title: 'How to export from Strategy Tester:',
            steps: [
              'Open MetaTrader 5 terminal',
              'Go to "View" → "Strategy Tester"',
              'Run your backtest',
              'Right-click on test result → "Report"',
              'Save the HTML report, then open in Excel',
              'In Excel: File → Save As → Excel Workbook (.xlsx)',
              'Upload the XLSX file here',
            ],
          },
          '.xlsx'
        )}
      </div>
    </div>
  )
}
