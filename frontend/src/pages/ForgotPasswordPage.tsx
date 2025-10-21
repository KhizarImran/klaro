import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Mail } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        setError(error.message)
      } else {
        setSuccess(true)
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
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
                  <Mail className="h-10 w-10 text-emerald-500" />
                </div>
              </div>
              <CardTitle className="text-2xl text-white text-center">Check your email</CardTitle>
              <CardDescription className="text-center">
                Password reset link sent
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-[oklch(65%_0.01_240)]">
                We've sent a password reset link to <strong className="text-white">{email}</strong>
              </p>
              <p className="text-sm text-[oklch(65%_0.01_240)]">
                Click the link in the email to reset your password. If you don't see it, check your spam folder.
              </p>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Link to="/login" className="w-full">
                <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white">
                  Back to Login
                </Button>
              </Link>
              <Button
                onClick={() => {
                  setSuccess(false)
                  setEmail('')
                }}
                variant="ghost"
                className="w-full text-[oklch(65%_0.01_240)]"
              >
                Send to a different email
              </Button>
            </CardFooter>
          </Card>
        ) : (
          // Form State
          <Card className="border-[oklch(25%_0.01_240)] bg-[oklch(14%_0.01_240)]">
            <CardHeader>
              <CardTitle className="text-2xl text-white">Forgot password?</CardTitle>
              <CardDescription>
                Enter your email address and we'll send you a link to reset your password.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
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
                  {loading ? 'Sending...' : 'Send reset link'}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <div className="text-sm text-[oklch(65%_0.01_240)] text-center">
                Remember your password?{' '}
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
