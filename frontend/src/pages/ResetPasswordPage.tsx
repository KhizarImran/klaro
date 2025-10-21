import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [validSession, setValidSession] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // Check if user has a valid recovery session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setValidSession(true)
      } else {
        setError('Invalid or expired reset link. Please request a new one.')
      }
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    // Validate password length
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) {
        setError(error.message)
      } else {
        setSuccess(true)
        // Redirect to dashboard after 2 seconds
        setTimeout(() => navigate('/dashboard'), 2000)
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!validSession && error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[oklch(10%_0.01_240)] px-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center justify-center space-x-2 mb-8">
            <TrendingUp className="h-10 w-10 text-emerald-500" />
            <span className="text-3xl font-bold text-white">Klaro</span>
          </div>

          <Card className="border-red-500/50 bg-[oklch(14%_0.01_240)]">
            <CardHeader>
              <CardTitle className="text-2xl text-white text-center">Invalid Reset Link</CardTitle>
              <CardDescription className="text-center">
                This password reset link is invalid or has expired
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-[oklch(65%_0.01_240)]">
                Please request a new password reset link.
              </p>
            </CardContent>
            <CardFooter>
              <Link to="/forgot-password" className="w-full">
                <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white">
                  Request new link
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
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
              <CardTitle className="text-2xl text-white text-center">Password updated!</CardTitle>
              <CardDescription className="text-center">
                Your password has been changed successfully
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-[oklch(65%_0.01_240)]">
                Redirecting you to the dashboard...
              </p>
            </CardContent>
          </Card>
        ) : (
          // Form State
          <Card className="border-[oklch(25%_0.01_240)] bg-[oklch(14%_0.01_240)]">
            <CardHeader>
              <CardTitle className="text-2xl text-white">Reset your password</CardTitle>
              <CardDescription>
                Enter your new password below
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-[oklch(10%_0.01_240)] border-[oklch(25%_0.01_240)]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                  {loading ? 'Updating password...' : 'Update password'}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <div className="text-sm text-center">
                <Link to="/login" className="text-emerald-500 hover:text-emerald-400">
                  ← Back to login
                </Link>
              </div>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  )
}
