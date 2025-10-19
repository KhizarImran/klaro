import { useState, useCallback } from 'react'
import { Upload, FileText, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { parseMT5Report } from '@/utils/mt5Parser'
import type { MT5Report } from '@/types/mt5'

interface ReportUploadProps {
  onReportParsed: (report: MT5Report) => void
}

export function ReportUpload({ onReportParsed }: ReportUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleFile = useCallback(async (file: File) => {
    setError(null)
    setSuccess(false)
    setIsProcessing(true)

    try {
      // Validate file type
      if (!file.name.endsWith('.html') && !file.name.endsWith('.htm')) {
        throw new Error('Please upload an HTML file (.html or .htm)')
      }

      // Read file content
      const content = await file.text()

      // Parse the MT5 report
      const result = parseMT5Report(content)

      if (!result.success || !result.report) {
        throw new Error(result.error || 'Failed to parse MT5 report')
      }

      // Success
      setSuccess(true)
      setTimeout(() => {
        onReportParsed(result.report!)
      }, 500)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setIsProcessing(false)
    }
  }, [onReportParsed])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      handleFile(file)
    }
  }, [handleFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
    }
  }, [handleFile])

  return (
    <div className="w-full">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          border-2 border-dashed rounded-lg p-12 text-center transition-all
          ${isDragging
            ? 'border-emerald-500 bg-emerald-500/10'
            : 'border-[oklch(25%_0.01_240)] bg-[oklch(14%_0.01_240)]'
          }
          ${isProcessing ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
        `}
      >
        <input
          type="file"
          accept=".html,.htm"
          onChange={handleFileInput}
          className="hidden"
          id="file-upload"
          disabled={isProcessing}
        />

        <label htmlFor="file-upload" className="cursor-pointer">
          <div className="flex flex-col items-center space-y-4">
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-500"></div>
                <p className="text-lg font-medium text-white">Processing report...</p>
              </>
            ) : success ? (
              <>
                <CheckCircle2 className="h-16 w-16 text-emerald-500" />
                <p className="text-lg font-medium text-emerald-500">Report uploaded successfully!</p>
              </>
            ) : (
              <>
                <div className="bg-emerald-500/10 rounded-full p-4">
                  <Upload className="h-12 w-12 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xl font-semibold text-white mb-2">
                    Upload MT5 Trade History Report
                  </p>
                  <p className="text-[oklch(65%_0.01_240)] mb-4">
                    Drag and drop your HTML file here, or click to browse
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="border-emerald-500 text-emerald-500 hover:bg-emerald-500/10"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Choose File
                </Button>
                <p className="text-sm text-[oklch(55%_0.01_240)]">
                  Supports: .html, .htm files
                </p>
              </>
            )}
          </div>
        </label>

        {error && (
          <div className="mt-6 bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <div className="flex items-center text-red-400">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 bg-[oklch(14%_0.01_240)] border border-[oklch(25%_0.01_240)] rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-3">How to export from MT5:</h3>
        <ol className="space-y-2 text-[oklch(65%_0.01_240)] text-sm list-decimal list-inside">
          <li>Open MetaTrader 5 terminal</li>
          <li>Go to "Toolbox" tab at the bottom</li>
          <li>Select "History" tab</li>
          <li>Right-click and choose "Save as Detailed Report"</li>
          <li>Save the HTML file</li>
          <li>Upload it here</li>
        </ol>
      </div>
    </div>
  )
}
