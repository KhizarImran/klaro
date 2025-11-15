import type { AnyMT5Report } from '@/types/mt5'
import type { SavedReport } from '@/components/dashboard/ReportsSidebar'
import { supabase } from '@/lib/supabase'

const STORAGE_BUCKET = 'reports'

/**
 * Saves a report to Supabase Storage and creates a metadata entry in the database
 */
export async function saveReport(report: AnyMT5Report, userId: string): Promise<SavedReport> {
  // Generate unique ID
  const id = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // Generate name based on report type
  let name: string
  if (report.type === 'trade-history') {
    name = `${report.accountInfo.name} - ${new Date(report.uploadedAt || new Date()).toLocaleDateString()}`
  } else {
    name = `${report.settings.expert} (${report.settings.symbol}) - ${new Date(report.uploadedAt || new Date()).toLocaleDateString()}`
  }

  // Create storage path
  const storagePath = `${userId}/${id}.json`

  // Convert report to JSON string
  const reportData = JSON.stringify(report)
  const fileSize = new Blob([reportData]).size

  try {
    // 1. Upload report JSON to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, reportData, {
        contentType: 'application/json',
        upsert: false,
      })

    if (uploadError) {
      console.error('Failed to upload report to storage:', uploadError)
      throw new Error(`Storage upload failed: ${uploadError.message}`)
    }

    // 2. Save metadata to database
    const { error: dbError } = await supabase
      .from('saved_reports')
      .insert({
        id,
        user_id: userId,
        name,
        report_type: report.type,
        storage_path: storagePath,
        file_size: fileSize,
        trade_count: report.trades.length,
        saved_at: new Date().toISOString(),
      })

    if (dbError) {
      // Rollback: delete uploaded file
      await supabase.storage.from(STORAGE_BUCKET).remove([storagePath])
      console.error('Failed to save report metadata:', dbError)
      throw new Error(`Database insert failed: ${dbError.message}`)
    }

    // 3. Set as active report
    await setActiveReportId(id, userId)

    // Return the saved report structure
    return {
      id,
      report,
      savedAt: new Date(),
      name,
    }
  } catch (error) {
    console.error('Failed to save report:', error)
    throw error
  }
}

/**
 * Loads all report metadata for a user (without downloading full report data)
 */
export async function loadReportsMetadata(userId: string): Promise<Array<Omit<SavedReport, 'report'> & { reportType: string; tradeCount: number }>> {
  try {
    const { data, error } = await supabase
      .from('saved_reports')
      .select('*')
      .eq('user_id', userId)
      .order('saved_at', { ascending: false })

    if (error) {
      console.error('Failed to load report metadata:', error)
      return []
    }

    return data.map(row => ({
      id: row.id,
      name: row.name,
      savedAt: new Date(row.saved_at),
      reportType: row.report_type,
      tradeCount: row.trade_count || 0,
    }))
  } catch (error) {
    console.error('Failed to load reports metadata:', error)
    return []
  }
}

/**
 * Loads full reports for a user by downloading from storage
 */
export async function loadReports(userId: string): Promise<SavedReport[]> {
  try {
    // Get metadata
    const { data: metadata, error: metadataError } = await supabase
      .from('saved_reports')
      .select('*')
      .eq('user_id', userId)
      .order('saved_at', { ascending: false })

    if (metadataError) {
      console.error('Failed to load report metadata:', metadataError)
      return []
    }

    // Download each report file
    const reports = await Promise.all(
      metadata.map(async (row) => {
        try {
          const { data: fileData, error: downloadError } = await supabase.storage
            .from(STORAGE_BUCKET)
            .download(row.storage_path)

          if (downloadError) {
            console.error(`Failed to download report ${row.id}:`, downloadError)
            return null
          }

          const reportJson = await fileData.text()
          const report = JSON.parse(reportJson)

          // Restore Date objects
          return {
            id: row.id,
            name: row.name,
            savedAt: new Date(row.saved_at),
            report: deserializeReport(report),
          }
        } catch (error) {
          console.error(`Error processing report ${row.id}:`, error)
          return null
        }
      })
    )

    return reports.filter((r): r is SavedReport => r !== null)
  } catch (error) {
    console.error('Failed to load reports:', error)
    return []
  }
}

/**
 * Loads a single report by ID
 */
export async function getReportById(reportId: string, userId: string): Promise<SavedReport | null> {
  try {
    // Get metadata
    const { data: metadata, error: metadataError } = await supabase
      .from('saved_reports')
      .select('*')
      .eq('id', reportId)
      .eq('user_id', userId)
      .single()

    if (metadataError || !metadata) {
      console.error('Failed to load report metadata:', metadataError)
      return null
    }

    // Download report file
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .download(metadata.storage_path)

    if (downloadError) {
      console.error('Failed to download report:', downloadError)
      return null
    }

    const reportJson = await fileData.text()
    const report = JSON.parse(reportJson)

    return {
      id: metadata.id,
      name: metadata.name,
      savedAt: new Date(metadata.saved_at),
      report: deserializeReport(report),
    }
  } catch (error) {
    console.error('Failed to get report by ID:', error)
    return null
  }
}

/**
 * Deletes a report from both storage and database
 */
export async function deleteReport(reportId: string, userId: string): Promise<void> {
  try {
    // Get storage path
    const { data: metadata } = await supabase
      .from('saved_reports')
      .select('storage_path')
      .eq('id', reportId)
      .eq('user_id', userId)
      .single()

    if (!metadata) {
      throw new Error('Report not found')
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([metadata.storage_path])

    if (storageError) {
      console.error('Failed to delete report from storage:', storageError)
    }

    // Delete from database (cascade will handle active_report)
    const { error: dbError } = await supabase
      .from('saved_reports')
      .delete()
      .eq('id', reportId)
      .eq('user_id', userId)

    if (dbError) {
      console.error('Failed to delete report from database:', dbError)
      throw new Error(`Database delete failed: ${dbError.message}`)
    }
  } catch (error) {
    console.error('Failed to delete report:', error)
    throw error
  }
}

/**
 * Gets the active report ID for a user
 */
export async function getActiveReportId(userId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('user_active_report')
      .select('active_report_id')
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      return null
    }

    return data.active_report_id
  } catch (error) {
    console.error('Failed to get active report ID:', error)
    return null
  }
}

/**
 * Sets the active report ID for a user
 */
export async function setActiveReportId(reportId: string, userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_active_report')
      .upsert({
        user_id: userId,
        active_report_id: reportId,
        updated_at: new Date().toISOString(),
      })

    if (error) {
      console.error('Failed to set active report ID:', error)
      throw error
    }
  } catch (error) {
    console.error('Failed to set active report ID:', error)
    throw error
  }
}

/**
 * Deserializes a report by converting ISO date strings back to Date objects
 */
function deserializeReport(report: any): AnyMT5Report {
  const baseReport = {
    ...report,
    uploadedAt: report.uploadedAt ? new Date(report.uploadedAt) : undefined,
    reportPeriodStart: report.reportPeriodStart ? new Date(report.reportPeriodStart) : undefined,
    reportPeriodEnd: report.reportPeriodEnd ? new Date(report.reportPeriodEnd) : undefined,
    trades: report.trades.map((trade: any) => ({
      ...trade,
      openTime: new Date(trade.openTime),
      closeTime: new Date(trade.closeTime),
    })),
  }

  // For trade-history reports, restore accountInfo.reportDate
  if (report.type === 'trade-history') {
    baseReport.accountInfo = {
      ...report.accountInfo,
      reportDate: new Date(report.accountInfo.reportDate),
    }
  }

  return baseReport
}

/**
 * Migrates reports from localStorage to Supabase (one-time migration helper)
 */
export async function migrateFromLocalStorage(userId: string): Promise<{ success: number; failed: number }> {
  const STORAGE_KEY = `klaro_saved_reports_${userId}`

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return { success: 0, failed: 0 }
    }

    const localReports = JSON.parse(stored) as SavedReport[]
    let success = 0
    let failed = 0

    for (const localReport of localReports) {
      try {
        await saveReport(localReport.report, userId)
        success++
      } catch (error) {
        console.error('Failed to migrate report:', localReport.id, error)
        failed++
      }
    }

    // Clear localStorage after successful migration
    if (failed === 0) {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(`klaro_active_report_id_${userId}`)
    }

    return { success, failed }
  } catch (error) {
    console.error('Migration failed:', error)
    return { success: 0, failed: 0 }
  }
}
