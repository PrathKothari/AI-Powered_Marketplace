'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Paintbrush, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'

declare global {
  interface Window {
    google?: any
  }
}

export default function LoginPage() {
  const router = useRouter()
  const { login, loginWithGoogle, user } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleReady, setGoogleReady] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    if (user) router.replace('/marketplace')
  }, [user, router])

  // Load Google Identity Services
  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    if (!clientId) return

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.onload = () => {
      window.google?.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleCredential,
      })
      setGoogleReady(true)
    }
    document.body.appendChild(script)
    return () => { document.body.removeChild(script) }
  }, [])

  const handleGoogleCredential = async (response: { credential: string }) => {
    setLoading(true)
    try {
      await loginWithGoogle(response.credential)
      toast.success('Signed in with Google!')
      router.push('/marketplace')
    } catch (err: any) {
      toast.error(err.message || 'Google sign-in failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleClick = () => {
    if (!googleReady) return
    window.google?.accounts.id.prompt()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(email, password)
      toast.success('Welcome back!')
      router.push('/marketplace')
    } catch (err: any) {
      toast.error(err.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md p-8 shadow-xl border-border space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Paintbrush className="w-6 h-6 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Welcome Back</h1>
          <p className="text-sm text-muted-foreground">Sign in to KalaSetu</p>
        </div>

        {/* Google Sign-In */}
        {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
          <Button
            type="button"
            variant="outline"
            className="w-full flex items-center gap-3 font-outfit font-bold uppercase tracking-wider text-xs h-12 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:shadow-md hover:bg-secondary/80 border-border/60"
            onClick={handleGoogleClick}
            disabled={loading || !googleReady}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </Button>
        )}

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs text-muted-foreground">
            <span className="bg-card px-2">or sign in with email</span>
          </div>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Email</label>
            <Input
              required
              type="email"
              placeholder="hello@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium">Password</label>
              <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                required
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full font-outfit font-bold uppercase tracking-wider h-12 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg shadow-md" 
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <p className="text-sm text-center text-muted-foreground">
          New here?{' '}
          <Link href="/register" className="text-primary hover:underline font-medium">
            Create an account
          </Link>
        </p>
      </Card>
    </div>
  )
}
