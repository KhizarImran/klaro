import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { TrendingUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function DashboardPage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-[oklch(10%_0.01_240)] text-white">
      {/* Navigation */}
      <nav className="border-b border-[oklch(25%_0.01_240)] bg-[oklch(10%_0.01_240)]">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-emerald-500" />
              <span className="text-2xl font-bold">Klaro</span>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <span className="text-sm text-[oklch(65%_0.01_240)]">
                {user?.email}
              </span>
              <Button
                onClick={handleSignOut}
                variant="outline"
                className="border-emerald-500 text-emerald-500 hover:bg-emerald-500/10"
              >
                Sign out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="container mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-6">
          Welcome to your <span className="text-emerald-500">Dashboard</span>
        </h1>
        <p className="text-xl text-[oklch(65%_0.01_240)] mb-8">
          Your algorithmic trading analytics platform is ready!
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Placeholder Cards */}
          <div className="border border-[oklch(25%_0.01_240)] bg-[oklch(14%_0.01_240)] p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Portfolio Value</h3>
            <p className="text-3xl font-bold text-emerald-500">$0.00</p>
            <p className="text-sm text-[oklch(65%_0.01_240)] mt-2">
              Connect your trading account to see your portfolio
            </p>
          </div>

          <div className="border border-[oklch(25%_0.01_240)] bg-[oklch(14%_0.01_240)] p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Active Strategies</h3>
            <p className="text-3xl font-bold text-emerald-500">0</p>
            <p className="text-sm text-[oklch(65%_0.01_240)] mt-2">
              Create your first strategy to get started
            </p>
          </div>

          <div className="border border-[oklch(25%_0.01_240)] bg-[oklch(14%_0.01_240)] p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Today's P&L</h3>
            <p className="text-3xl font-bold text-emerald-500">$0.00</p>
            <p className="text-sm text-[oklch(65%_0.01_240)] mt-2">
              No trades executed today
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
