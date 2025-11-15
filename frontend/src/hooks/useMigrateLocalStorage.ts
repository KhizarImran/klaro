import { useEffect, useState } from 'react'
import { migrateFromLocalStorage } from '@/utils/reportStorage'

/**
 * Hook to automatically migrate reports from localStorage to Supabase
 * Only runs once per user session
 */
export function useMigrateLocalStorage(userId: string | undefined) {
  const [migrationStatus, setMigrationStatus] = useState<{
    inProgress: boolean
    completed: boolean
    success: number
    failed: number
  }>({
    inProgress: false,
    completed: false,
    success: 0,
    failed: 0,
  })

  useEffect(() => {
    if (!userId) return

    // Check if migration has already been attempted for this user
    const migrationKey = `klaro_migration_completed_${userId}`
    const alreadyMigrated = localStorage.getItem(migrationKey)

    if (alreadyMigrated) {
      setMigrationStatus({
        inProgress: false,
        completed: true,
        success: 0,
        failed: 0,
      })
      return
    }

    // Check if there's localStorage data to migrate
    const localStorageKey = `klaro_saved_reports_${userId}`
    const hasLocalData = localStorage.getItem(localStorageKey)

    if (!hasLocalData) {
      // No data to migrate, mark as completed
      localStorage.setItem(migrationKey, 'true')
      setMigrationStatus({
        inProgress: false,
        completed: true,
        success: 0,
        failed: 0,
      })
      return
    }

    // Run migration
    const runMigration = async () => {
      setMigrationStatus(prev => ({ ...prev, inProgress: true }))

      try {
        const result = await migrateFromLocalStorage(userId)

        setMigrationStatus({
          inProgress: false,
          completed: true,
          success: result.success,
          failed: result.failed,
        })

        // Mark migration as completed
        localStorage.setItem(migrationKey, 'true')
      } catch (error) {
        console.error('Migration failed:', error)
        setMigrationStatus({
          inProgress: false,
          completed: true,
          success: 0,
          failed: 0,
        })
      }
    }

    runMigration()
  }, [userId])

  return migrationStatus
}
