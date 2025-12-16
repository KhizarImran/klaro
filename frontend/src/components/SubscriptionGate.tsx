import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getSubscriptionStatus, type SubscriptionStatus } from '@/utils/subscription'

interface SubscriptionGateProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  onStatusChange?: (status: SubscriptionStatus) => void
}

export function SubscriptionGate({ children, fallback, onStatusChange }: SubscriptionGateProps) {
  const { user } = useAuth()
  const [status, setStatus] = useState<SubscriptionStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkSubscription() {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const subscriptionStatus = await getSubscriptionStatus(user.id)
        setStatus(subscriptionStatus)
        onStatusChange?.(subscriptionStatus)
      } catch (error) {
        console.error('Error checking subscription:', error)
      } finally {
        setLoading(false)
      }
    }

    checkSubscription()
  }, [user, onStatusChange])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[oklch(10%_0.01_240)]">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[oklch(65%_0.01_240)] border-t-white mx-auto"></div>
          <p className="mt-4 text-[oklch(65%_0.01_240)]">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return fallback || null
  }

  return <>{children}</>
}

export function useSubscriptionStatus() {
  const { user } = useAuth()
  const [status, setStatus] = useState<SubscriptionStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkSubscription() {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const subscriptionStatus = await getSubscriptionStatus(user.id)
        setStatus(subscriptionStatus)
      } catch (error) {
        console.error('Error checking subscription:', error)
      } finally {
        setLoading(false)
      }
    }

    checkSubscription()
  }, [user])

  const refetch = async () => {
    if (!user) return
    setLoading(true)
    try {
      const subscriptionStatus = await getSubscriptionStatus(user.id)
      setStatus(subscriptionStatus)
    } finally {
      setLoading(false)
    }
  }

  return { status, loading, refetch }
}
