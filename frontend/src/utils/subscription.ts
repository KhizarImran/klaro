import { supabase } from '@/lib/supabase'

export interface Subscription {
  id: string
  user_id: string
  stripe_subscription_id: string | null
  stripe_customer_id: string | null
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'inactive'
  plan_name: string | null
  price_amount: number | null
  currency: string
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  created_at: string
  updated_at: string
}

export interface SubscriptionStatus {
  isActive: boolean
  subscription: Subscription | null
  reportCount: number
  canUploadMore: boolean
  limit: number
}

const FREE_TIER_LIMIT = 5

export async function getSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
  // Get subscription
  const { data: subscription, error: subError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (subError && subError.code !== 'PGRST116') {
    console.error('Error fetching subscription:', subError)
  }

  // Get report count
  const { count, error: countError } = await supabase
    .from('saved_reports')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (countError) {
    console.error('Error fetching report count:', countError)
  }

  const reportCount = count || 0
  const isActive = subscription?.status === 'active' &&
    (!subscription.current_period_end || new Date(subscription.current_period_end) > new Date())

  return {
    isActive,
    subscription: subscription || null,
    reportCount,
    canUploadMore: isActive || reportCount < FREE_TIER_LIMIT,
    limit: isActive ? Infinity : FREE_TIER_LIMIT,
  }
}

export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const status = await getSubscriptionStatus(userId)
  return status.isActive
}

export async function createCheckoutSession(userId: string, userEmail: string): Promise<string> {
  const priceId = import.meta.env.VITE_STRIPE_PRICE_ID
  const successUrl = `${window.location.origin}/dashboard?subscription=success`
  const cancelUrl = `${window.location.origin}/pricing?subscription=canceled`

  // Call Supabase Edge Function to create Stripe Checkout session
  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: {
      priceId,
      userId,
      userEmail,
      successUrl,
      cancelUrl,
    },
  })

  if (error) {
    console.error('Error creating checkout session:', error)
    throw new Error('Failed to create checkout session')
  }

  return data.url
}

export function getCustomerPortalUrl(): string {
  // Stripe Customer Portal URL
  // Users will be redirected to manage their subscription
  return import.meta.env.VITE_STRIPE_PORTAL_URL || `${window.location.origin}/dashboard`
}
