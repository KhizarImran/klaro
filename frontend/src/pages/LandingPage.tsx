import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { TrendingUp, BarChart3, Shield, Check } from 'lucide-react'
import { useTickerData } from '@/hooks/useTickerData'
import { HeroChart } from '@/components/HeroChart'
import { Link } from 'react-router-dom'

export function LandingPage() {
  const { tickerData, isLoading } = useTickerData()
  return (
    <div className="min-h-screen bg-[oklch(10%_0.01_240)] text-[oklch(98%_0_0)]">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[oklch(25%_0.01_240)] bg-[oklch(10%_0.01_240)]/95 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-emerald-500" />
              <span className="text-2xl font-bold">Klaro</span>
            </div>

            {/* Center Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-sm font-medium hover:text-emerald-500 transition-colors">
                Features
              </a>
              <a href="#pricing" className="text-sm font-medium hover:text-emerald-500 transition-colors">
                Pricing
              </a>
              <a href="#docs" className="text-sm font-medium hover:text-emerald-500 transition-colors">
                Docs
              </a>
            </div>

            {/* Right CTAs */}
            <div className="flex items-center space-x-4">
              <Link to="/login">
                <Button variant="ghost" className="text-sm">
                  Login
                </Button>
              </Link>
              <Link to="/waitlist">
                <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
                  Join Waitlist
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Scrolling Ticker Banner */}
      <div className="fixed top-[73px] left-0 right-0 z-40 w-full bg-[oklch(14%_0.01_240)] border-b border-[oklch(25%_0.01_240)] py-2 overflow-hidden">
        <div className="ticker-wrapper">
          {isLoading && tickerData.length === 0 ? (
            <div className="flex items-center justify-center py-1">
              <span className="text-sm text-[oklch(65%_0.01_240)]">Loading market data...</span>
            </div>
          ) : (
            <div className="ticker-content gap-8 whitespace-nowrap">
              {/* Create multiple copies for seamless infinite loop */}
              {[...Array(10)].map((_, copyIndex) => (
                <div key={`copy-${copyIndex}`} className="flex items-center gap-8">
                  {tickerData.map((item, itemIndex) => (
                    <div key={`${copyIndex}-${itemIndex}`} className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[oklch(65%_0.01_240)]">{item.displaySymbol}</span>
                      <span className={`text-sm font-bold ${item.isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                        {item.price}
                      </span>
                      <span className={`text-xs ${item.isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                        {item.change}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center px-12 pt-[110px]">
        <div className="w-full max-w-[1600px] mx-auto">
          <div className="grid md:grid-cols-2 gap-24 items-center">
            {/* Left - Text Content */}
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 whitespace-nowrap">
                <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent block">
                  Advanced Analytics for
                </span>
                <span className="text-emerald-500 block">Algorithmic Traders</span>
              </h1>
              <p className="text-xl text-[oklch(65%_0.01_240)] max-w-xl">
                Unlock powerful insights, track your strategies in real-time, and optimize your trading performance with Klaro's comprehensive analytics platform.
              </p>
            </div>

            {/* Right - Professional Chart */}
            <div className="hidden md:flex items-center justify-center">
              <HeroChart />
            </div>
          </div>
        </div>
      </section>

      <Separator className="my-12 bg-[oklch(25%_0.01_240)]" />

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-16">
            Built for <span className="text-emerald-500">Performance</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="flex flex-col items-center text-center p-6 rounded-lg border border-[oklch(25%_0.01_240)] bg-[oklch(14%_0.01_240)] hover:border-emerald-500/50 transition-colors">
              <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                <TrendingUp className="h-8 w-8 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Real-Time Monitoring</h3>
              <p className="text-[oklch(65%_0.01_240)]">
                Track your strategies as they execute with live performance metrics and instant alerts.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-col items-center text-center p-6 rounded-lg border border-[oklch(25%_0.01_240)] bg-[oklch(14%_0.01_240)] hover:border-emerald-500/50 transition-colors">
              <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                <BarChart3 className="h-8 w-8 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Advanced Analytics</h3>
              <p className="text-[oklch(65%_0.01_240)]">
                Dive deep into your data with comprehensive backtesting and performance analysis tools.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="flex flex-col items-center text-center p-6 rounded-lg border border-[oklch(25%_0.01_240)] bg-[oklch(14%_0.01_240)] hover:border-emerald-500/50 transition-colors">
              <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                <Shield className="h-8 w-8 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Risk Management</h3>
              <p className="text-[oklch(65%_0.01_240)]">
                Monitor exposure, manage portfolio risk, and stay protected with intelligent risk controls.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Separator className="my-12 bg-[oklch(25%_0.01_240)]" />

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-4">
            Simple, Transparent <span className="text-emerald-500">Pricing</span>
          </h2>
          <p className="text-center text-[oklch(65%_0.01_240)] mb-16 text-lg">
            One plan with everything you need
          </p>

          <div className="flex justify-center">
            {/* Single Plan */}
            <Card className="border-emerald-500 bg-[oklch(14%_0.01_240)] max-w-md w-full">
              <CardHeader>
                <CardTitle className="text-3xl text-emerald-500">Pro</CardTitle>
                <CardDescription>Everything you need for algorithmic trading</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <span className="text-5xl font-bold text-emerald-500">$29</span>
                  <span className="text-[oklch(65%_0.01_240)] text-xl">/month</span>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-emerald-500 mr-2" />
                    <span>Unlimited strategies</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-emerald-500 mr-2" />
                    <span>Advanced analytics dashboard</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-emerald-500 mr-2" />
                    <span>Real-time monitoring</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-emerald-500 mr-2" />
                    <span>Risk management tools</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-emerald-500 mr-2" />
                    <span>Priority support</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-emerald-500 mr-2" />
                    <span>Full history & backtesting</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-emerald-500 mr-2" />
                    <span>API access</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Link to="/waitlist" className="w-full">
                  <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-lg py-6">
                    Join Waitlist
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[oklch(25%_0.01_240)] mt-20 py-12 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <TrendingUp className="h-6 w-6 text-emerald-500" />
              <span className="text-xl font-bold">Klaro</span>
            </div>
            <div className="flex space-x-6 mb-4 md:mb-0">
              <a href="#" className="text-sm text-[oklch(65%_0.01_240)] hover:text-emerald-500 transition-colors">
                About
              </a>
              <a href="#" className="text-sm text-[oklch(65%_0.01_240)] hover:text-emerald-500 transition-colors">
                Documentation
              </a>
              <a href="#" className="text-sm text-[oklch(65%_0.01_240)] hover:text-emerald-500 transition-colors">
                Privacy
              </a>
              <a href="#" className="text-sm text-[oklch(65%_0.01_240)] hover:text-emerald-500 transition-colors">
                Terms
              </a>
            </div>
            <div className="text-sm text-[oklch(65%_0.01_240)]">
              © 2025 Klaro. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}


