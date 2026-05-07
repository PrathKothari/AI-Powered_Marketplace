'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Check, X, Paintbrush, Eye, EyeOff, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'

declare global {
  interface Window { google?: any }
}

interface PasswordRule {
  label: string
  test: (p: string) => boolean
}

const PASSWORD_RULES: PasswordRule[] = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'One number', test: (p) => /\d/.test(p) },
  { label: 'One special character', test: (p) => /[!@#$%^&*()\-_=+\[\]{};:'",.<>/?\\|`~]/.test(p) },
]

export default function RegisterPage() {
  const router = useRouter()
  const { register, loginWithGoogle, user } = useAuth()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'buyer' as 'buyer' | 'artisan' | 'both',
  })
  const [loading, setLoading] = useState(false)
  const [googleReady, setGoogleReady] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  useEffect(() => {
    if (user) router.replace('/marketplace')
  }, [user, router])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const roleParam = params.get('role') as 'buyer' | 'artisan' | null
    if (roleParam) setFormData((prev) => ({ ...prev, role: roleParam }))
  }, [])

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
    return () => { try { document.body.removeChild(script) } catch (e) {} }
  }, [])

  const handleGoogleCredential = async (response: { credential: string }) => {
    setLoading(true)
    try {
      await loginWithGoogle(response.credential)
      toast.success('Account created with Google!')
      router.push('/marketplace')
    } catch (err: any) {
      toast.error(err.message || 'Google sign-in failed')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const passwordValid = PASSWORD_RULES.every((r) => r.test(formData.password))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!passwordValid) {
      toast.error('Please fix your password before continuing')
      return
    }
    setLoading(true)
    setApiError(null)
    try {
      await register(formData.name, formData.email, formData.password)
      setEmailSent(true)
    } catch (err: any) {
      if (err.message?.includes('already exists')) {
        setApiError('An account with this email already exists. Try signing in instead.')
        toast.error('Email already in use', {
          description: 'Try logging in or use a different email address.',
        })
      } else {
        toast.error(err.message || 'Registration failed')
      }
    } finally {
      setLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md p-8 shadow-xl border-border text-center space-y-5">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-primary" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Verify your email</h1>
            <p className="text-sm text-muted-foreground">
              We sent a confirmation link to <span className="font-semibold text-foreground">{formData.email}</span>.
              Click the link in the email to activate your account.
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Didn&apos;t receive it? Check your spam folder or{' '}
            <Link href="/login" className="text-primary hover:underline font-medium">
              sign in anyway
            </Link>
            .
          </p>
          <Button
            className="w-full font-outfit font-bold uppercase tracking-wider h-12"
            onClick={() => router.push('/marketplace')}
          >
            Continue to Marketplace
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-md p-8 shadow-xl border-border space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Paintbrush className="w-6 h-6 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Create Account</h1>
          <p className="text-sm text-muted-foreground">Join KalaSetu today</p>
        </div>

        {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
          <Button
            type="button"
            variant="outline"
            className="w-full flex items-center gap-3 font-outfit font-bold uppercase tracking-wider text-xs h-12 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:shadow-md hover:bg-secondary/80 border-border/60"
            onClick={() => window.google?.accounts.id.prompt()}
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
            <span className="bg-card px-2">or register with email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Full Name</label>
            <Input required name="name" placeholder="Priya Sharma" value={formData.name} onChange={handleChange} />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Email</label>
            <Input
              required
              type="email"
              name="email"
              placeholder="hello@example.com"
              value={formData.email}
              onChange={handleChange}
              className={apiError ? 'border-destructive focus-visible:ring-destructive' : ''}
            />
            {apiError && (
              <p className="text-[11px] font-medium text-destructive mt-1 animate-in fade-in slide-in-from-top-1">
                {apiError}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Password</label>
            <div className="relative">
              <Input
                required
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {formData.password.length > 0 && (
              <ul className="mt-2 space-y-1">
                {PASSWORD_RULES.map((rule) => {
                  const pass = rule.test(formData.password)
                  return (
                    <li key={rule.label} className={`flex items-center gap-2 text-xs ${pass ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                      {pass ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      {rule.label}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <div className="space-y-2 pt-1">
            <label className="text-sm font-medium">I want to:</label>
            <div className="grid grid-cols-3 gap-3">
              {(['buyer', 'artisan', 'both'] as const).map((r) => (
                <label
                  key={r}
                  className={`border rounded-lg p-3 cursor-pointer transition-all text-center ${formData.role === r ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-muted'}`}
                >
                  <input type="radio" name="role" value={r} className="hidden" checked={formData.role === r} onChange={handleChange} />
                  <div className="font-semibold text-sm">
                    {r === 'buyer' ? 'Buy Products' : r === 'artisan' ? 'Sell Products' : 'Buy & Sell'}
                  </div>
                </label>
              ))}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full font-outfit font-bold uppercase tracking-wider h-12 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg shadow-md"
            disabled={loading || !passwordValid}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>

        <p className="text-sm text-center text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  )
}
