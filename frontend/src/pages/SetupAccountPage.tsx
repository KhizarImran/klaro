import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export function SetupAccountPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [validToken, setValidToken] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // Check if there's an invite token in the URL hash
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const accessToken = hashParams.get('access_token')
    const type = hashParams.get('type')

    if (accessToken && type === 'invite') {
      setValidToken(true)
      // Set the session with the token
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: hashParams.get('refresh_token') || '',
      })
    } else {
      setError('Invalid or expired invitation link. Please request a new invitation.')
    }
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
      // Update the user's password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) {
        setError(updateError.message)
        setLoading(false)
      } else {
        setSuccess(true)
        setLoading(false)
        // Redirect to dashboard after 2 seconds
        setTimeout(() => navigate('/dashboard'), 2000)
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  if (!validToken && error) {
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
              <CardTitle className="text-2xl text-white text-center">Invalid Invitation</CardTitle>
              <CardDescription className="text-center">
                This invitation link is invalid or has expired
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-[oklch(65%_0.01_240)]">
                Please contact support to request a new invitation.
              </p>
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => navigate('/')}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                Go to Home
              </Button>
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
              <CardTitle className="text-2xl text-white text-center">Account activated!</CardTitle>
              <CardDescription className="text-center">
                Your password has been set successfully
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
              <CardTitle className="text-2xl text-white">Set up your account</CardTitle>
              <CardDescription>
                Welcome to Klaro! Please set a password for your account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
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
                  <Label htmlFor="confirm-password">Confirm Password</Label>
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
                  {loading ? 'Setting up account...' : 'Set password and continue'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
