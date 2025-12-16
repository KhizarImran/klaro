import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useSubscriptionStatus } from '@/components/SubscriptionGate'
import { createCheckoutSession, getCustomerPortalUrl } from '@/utils/subscription'
import { Check, X, Crown, Zap } from 'lucide-react'

export function PricingPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { status, loading } = useSubscriptionStatus()
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false)

  const handleUpgrade = async () => {
    if (!user) {
      navigate('/login')
      return
    }

    setIsCreatingCheckout(true)
    try {
      const checkoutUrl = await createCheckoutSession(user.id, user.email || '')
      window.location.href = checkoutUrl
    } catch (error) {
      console.error('Failed to create checkout session:', error)
      alert('Failed to start checkout. Please try again.')
      setIsCreatingCheckout(false)
    }
  }

  const handleManageSubscription = () => {
    window.location.href = getCustomerPortalUrl()
  }

  const freeTierFeatures = [
    { text: '5 reports maximum', included: true },
    { text: 'Basic analytics', included: true },
    { text: '30-day history', included: true },
    { text: 'Community support', included: true },
    { text: 'Unlimited reports', included: false },
    { text: 'Priority support', included: false },
  ]

  const proTierFeatures = [
    { text: 'Unlimited reports', included: true },
    { text: 'Advanced analytics', included: true },
    { text: 'Full history access', included: true },
    { text: 'Priority support', included: true },
    { text: 'Export capabilities', included: true },
    { text: 'Early access to features', included: true },
  ]

  return (
    <div className="min-h-screen bg-[oklch(10%_0.01_240)] text-white">
      <div className="mx-auto max-w-5xl px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-[oklch(65%_0.01_240)] text-lg">
            Unlock the full power of MT5 analytics
          </p>
        </div>

        {status?.isActive && (
          <div className="mb-8 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-center">
            <p className="text-emerald-400 font-medium">
              You're currently on the Pro plan
            </p>
            <button
              onClick={handleManageSubscription}
              className="mt-2 text-sm text-emerald-300 hover:text-emerald-200 underline"
            >
              Manage subscription
            </button>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Free Tier */}
          <div className="bg-[oklch(14%_0.01_240)] border border-[oklch(25%_0.01_240)] rounded-xl p-6">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-5 w-5 text-[oklch(65%_0.01_240)]" />
                <h2 className="text-xl font-semibold">Free</h2>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">$0</span>
                <span className="text-[oklch(65%_0.01_240)]">/month</span>
              </div>
              <p className="text-sm text-[oklch(65%_0.01_240)] mt-2">
                Perfect for getting started
              </p>
            </div>

            <ul className="space-y-3 mb-6">
              {freeTierFeatures.map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                  {feature.included ? (
                    <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                  ) : (
                    <X className="h-4 w-4 text-[oklch(35%_0.01_240)] flex-shrink-0" />
                  )}
                  <span className={feature.included ? '' : 'text-[oklch(45%_0.01_240)]'}>
                    {feature.text}
                  </span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-2.5 px-4 bg-[oklch(20%_0.01_240)] border border-[oklch(30%_0.01_240)] rounded-lg font-medium hover:bg-[oklch(25%_0.01_240)] transition-colors"
            >
              {user ? 'Go to Dashboard' : 'Get Started'}
            </button>
          </div>

          {/* Pro Tier */}
          <div className="bg-[oklch(14%_0.01_240)] border-2 border-emerald-500/50 rounded-xl p-6 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-emerald-500 text-black text-xs font-bold px-3 py-1 rounded-full">
                POPULAR
              </span>
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="h-5 w-5 text-emerald-500" />
                <h2 className="text-xl font-semibold">Pro</h2>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">$4.99</span>
                <span className="text-[oklch(65%_0.01_240)]">/month</span>
              </div>
              <p className="text-sm text-[oklch(65%_0.01_240)] mt-2">
                For serious traders
              </p>
            </div>

            <ul className="space-y-3 mb-6">
              {proTierFeatures.map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                  <span>{feature.text}</span>
                </li>
              ))}
            </ul>

            {loading || isCreatingCheckout ? (
              <button
                disabled
                className="w-full py-2.5 px-4 bg-emerald-600 rounded-lg font-medium opacity-50"
              >
                {isCreatingCheckout ? 'Creating checkout...' : 'Loading...'}
              </button>
            ) : status?.isActive ? (
              <button
                onClick={handleManageSubscription}
                className="w-full py-2.5 px-4 bg-[oklch(20%_0.01_240)] border border-emerald-500/50 rounded-lg font-medium hover:bg-[oklch(25%_0.01_240)] transition-colors"
              >
                Manage Subscription
              </button>
            ) : (
              <button
                onClick={handleUpgrade}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-medium transition-colors"
              >
                Upgrade to Pro
              </button>
            )}
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-[oklch(50%_0.01_240)]">
            Secure payments powered by Stripe. Cancel anytime.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 text-sm text-[oklch(65%_0.01_240)] hover:text-white underline"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
