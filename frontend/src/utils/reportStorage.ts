import type { MT5Report } from '@/types/mt5'
import type { SavedReport } from '@/components/dashboard/ReportsSidebar'

const STORAGE_KEY = 'klaro_saved_reports'
const ACTIVE_REPORT_KEY = 'klaro_active_report_id'

export function saveReport(report: MT5Report): SavedReport {
  const reports = loadReports()

  // Generate unique ID
  const id = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // Create saved report
  const savedReport: SavedReport = {
    id,
    report,
    savedAt: new Date(),
    name: `${report.accountInfo.name} - ${new Date(report.uploadedAt || new Date()).toLocaleDateString()}`,
  }

  // Add to reports array
  reports.push(savedReport)

  // Save to localStorage
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports))
    localStorage.setItem(ACTIVE_REPORT_KEY, id)
  } catch (error) {
    console.error('Failed to save report to localStorage:', error)
  }

  return savedReport
}

export function loadReports(): SavedReport[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []

    const reports = JSON.parse(stored)

    // Restore Date objects
    return reports.map((report: any) => ({
      ...report,
      savedAt: new Date(report.savedAt),
      report: {
        ...report.report,
        uploadedAt: report.report.uploadedAt ? new Date(report.report.uploadedAt) : undefined,
        reportPeriodStart: report.report.reportPeriodStart ? new Date(report.report.reportPeriodStart) : undefined,
        reportPeriodEnd: report.report.reportPeriodEnd ? new Date(report.report.reportPeriodEnd) : undefined,
        accountInfo: {
          ...report.report.accountInfo,
          reportDate: new Date(report.report.accountInfo.reportDate),
        },
        trades: report.report.trades.map((trade: any) => ({
          ...trade,
          openTime: new Date(trade.openTime),
          closeTime: new Date(trade.closeTime),
        })),
      },
    }))
  } catch (error) {
    console.error('Failed to load reports from localStorage:', error)
    return []
  }
}

export function deleteReport(reportId: string): void {
  const reports = loadReports()
  const filtered = reports.filter(r => r.id !== reportId)

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))

    // If we deleted the active report, clear it
    const activeId = getActiveReportId()
    if (activeId === reportId) {
      localStorage.removeItem(ACTIVE_REPORT_KEY)
    }
  } catch (error) {
    console.error('Failed to delete report from localStorage:', error)
  }
}

export function getActiveReportId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_REPORT_KEY)
  } catch (error) {
    console.error('Failed to get active report ID:', error)
    return null
  }
}

export function setActiveReportId(reportId: string): void {
  try {
    localStorage.setItem(ACTIVE_REPORT_KEY, reportId)
  } catch (error) {
    console.error('Failed to set active report ID:', error)
  }
}

export function getReportById(reportId: string): SavedReport | null {
  const reports = loadReports()
  return reports.find(r => r.id === reportId) || null
}
