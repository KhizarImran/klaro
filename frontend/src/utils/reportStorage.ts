import type { MT5Report } from '@/types/mt5'
import type { SavedReport } from '@/components/dashboard/ReportsSidebar'

const STORAGE_KEY_PREFIX = 'klaro_saved_reports'
const ACTIVE_REPORT_KEY_PREFIX = 'klaro_active_report_id'

function getUserStorageKey(userId: string): string {
  return `${STORAGE_KEY_PREFIX}_${userId}`
}

function getUserActiveReportKey(userId: string): string {
  return `${ACTIVE_REPORT_KEY_PREFIX}_${userId}`
}

export function saveReport(report: MT5Report, userId: string): SavedReport {
  const reports = loadReports(userId)

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

  // Save to localStorage with user-specific key
  try {
    localStorage.setItem(getUserStorageKey(userId), JSON.stringify(reports))
    localStorage.setItem(getUserActiveReportKey(userId), id)
  } catch (error) {
    console.error('Failed to save report to localStorage:', error)
  }

  return savedReport
}

export function loadReports(userId: string): SavedReport[] {
  try {
    const stored = localStorage.getItem(getUserStorageKey(userId))
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

export function deleteReport(reportId: string, userId: string): void {
  const reports = loadReports(userId)
  const filtered = reports.filter(r => r.id !== reportId)

  try {
    localStorage.setItem(getUserStorageKey(userId), JSON.stringify(filtered))

    // If we deleted the active report, clear it
    const activeId = getActiveReportId(userId)
    if (activeId === reportId) {
      localStorage.removeItem(getUserActiveReportKey(userId))
    }
  } catch (error) {
    console.error('Failed to delete report from localStorage:', error)
  }
}

export function getActiveReportId(userId: string): string | null {
  try {
    return localStorage.getItem(getUserActiveReportKey(userId))
  } catch (error) {
    console.error('Failed to get active report ID:', error)
    return null
  }
}

export function setActiveReportId(reportId: string, userId: string): void {
  try {
    localStorage.setItem(getUserActiveReportKey(userId), reportId)
  } catch (error) {
    console.error('Failed to set active report ID:', error)
  }
}

export function getReportById(reportId: string, userId: string): SavedReport | null {
  const reports = loadReports(userId)
  return reports.find(r => r.id === reportId) || null
}
