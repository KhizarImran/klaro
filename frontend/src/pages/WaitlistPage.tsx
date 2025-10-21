import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export function WaitlistPage() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [tradingExperience, setTradingExperience] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    try {
      const { error: insertError } = await supabase
        .from('waitlist')
        .insert([
          {
            email: email.trim().toLowerCase(),
            name: name.trim() || null,
            trading_experience: tradingExperience.trim() || null,
          }
        ])

      if (insertError) {
        // Check if it's a duplicate email error
        if (insertError.code === '23505') {
          setError('This email is already on the waitlist!')
        } else {
          setError(insertError.message || 'Failed to join waitlist. Please try again.')
        }
        setLoading(false)
      } else {
        setSuccess(true)
        setLoading(false)
        // Reset form
        setEmail('')
        setName('')
        setTradingExperience('')
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[oklch(10%_0.01_240)] px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center space-x-2 mb-8">
          <TrendingUp className="h-10 w-10 text-emerald-500" />
          <span className="text-3xl font-bold text-white">Klaro</span>
        </div>

        {success ? (
          // Success State
          <Card className="border-emerald-500/50 bg-[oklch(14%_0.01_240)]">
            <CardHeader>
              <div className="flex items-center justify-center mb-4">
                <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                </div>
              </div>
              <CardTitle className="text-2xl text-white text-center">You're on the list!</CardTitle>
              <CardDescription className="text-center">
                Thank you for your interest in Klaro
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-[oklch(65%_0.01_240)]">
                We've received your application and will review it shortly. You'll receive an email with your account credentials once approved.
              </p>
              <p className="text-sm text-[oklch(65%_0.01_240)]">
                Check your inbox (and spam folder) for updates from us.
              </p>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Button
                onClick={() => setSuccess(false)}
                variant="outline"
                className="w-full"
              >
                Submit another application
              </Button>
              <div className="text-sm text-center">
                <Link to="/" className="text-emerald-500 hover:text-emerald-400">
                  ← Back to home
                </Link>
              </div>
            </CardFooter>
          </Card>
        ) : (
          // Form State
          <Card className="border-[oklch(25%_0.01_240)] bg-[oklch(14%_0.01_240)]">
            <CardHeader>
              <CardTitle className="text-2xl text-white">Join the Waitlist</CardTitle>
              <CardDescription>
                Klaro is currently in private beta. Apply for early access and we'll get you set up.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-[oklch(10%_0.01_240)] border-[oklch(25%_0.01_240)]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Name (optional)</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-[oklch(10%_0.01_240)] border-[oklch(25%_0.01_240)]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="trading-experience">What are you looking to analyze? (optional)</Label>
                  <Textarea
                    id="trading-experience"
                    placeholder="e.g., I'm using MT5 for forex trading and want to track my strategy performance..."
                    value={tradingExperience}
                    onChange={(e) => setTradingExperience(e.target.value)}
                    rows={4}
                    className="bg-[oklch(10%_0.01_240)] border-[oklch(25%_0.01_240)] resize-none"
                  />
                </div>
                {error && (
                  <div className="text-sm text-red-500 bg-red-500/10 p-3 rounded">
                    {error}
                  </div>
                )}
                <Button
                  type="submit"
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
                  disabled={loading}
                >
                  {loading ? 'Submitting...' : 'Join Waitlist'}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <div className="text-sm text-[oklch(65%_0.01_240)] text-center">
                Already have an account?{' '}
                <Link to="/login" className="text-emerald-500 hover:text-emerald-400">
                  Sign in
                </Link>
              </div>
              <div className="text-sm text-center">
                <Link to="/" className="text-emerald-500 hover:text-emerald-400">
                  ← Back to home
                </Link>
              </div>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  )
}
