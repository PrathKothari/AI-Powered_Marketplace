'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Paintbrush, ArrowLeft, Eye, EyeOff, CheckCircle2, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'

export default function ResetPasswordPage() {
  const { resetPassword } = useAuth()
  const searchParams = useSearchParams()

  const [oobCode, setOobCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // Extract the oobCode from the URL params (Firebase appends it)
  useEffect(() => {
    const code = searchParams.get('oobCode') || searchParams.get('code') || ''
    setOobCode(code)
  }, [searchParams])

  // Password validation rules
  const hasMinLength = newPassword.length >= 8
  const hasUppercase = /[A-Z]/.test(newPassword)
  const hasNumber = /\d/.test(newPassword)
  const hasSpecial = /[!@#$%^&*()\-_=+\[\]{};:'",.<>/?\\|`~]/.test(newPassword)
  const passwordsMatch = newPassword === confirmPassword && newPassword.length > 0
  const allValid = hasMinLength && hasUppercase && hasNumber && hasSpecial && passwordsMatch

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!allValid) return
    if (!oobCode) {
      toast.error('Missing reset code. Please use the link from your email.')
      return
    }

    setLoading(true)
    try {
      await resetPassword(oobCode, newPassword)
      setSuccess(true)
      toast.success('Password reset successfully!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  // No oobCode present
  if (!oobCode && !success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md p-8 shadow-xl border-border space-y-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center">
                <ShieldAlert className="w-8 h-8 text-amber-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Invalid Reset Link</h1>
            <p className="text-sm text-muted-foreground">
              This link appears to be invalid or expired. Please request a new password reset.
            </p>
            <Link href="/forgot-password">
              <Button className="w-full mt-2">Request New Reset Link</Button>
            </Link>
          </div>
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Sign In
          </Link>
        </Card>
      </div>
    )
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
          <h1 className="text-2xl font-bold text-foreground">Reset Your Password</h1>
          <p className="text-sm text-muted-foreground">
            Enter your new password below
          </p>
        </div>

        {success ? (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
            </div>
            <div>
              <p className="font-semibold text-foreground">Password Reset Successful!</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your password has been updated. You can now sign in with your new password.
              </p>
            </div>
            <Link href="/login">
              <Button className="w-full">Sign In</Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">New Password</label>
              <div className="relative">
                <Input
                  required
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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
              {/* Password strength indicators */}
              {newPassword.length > 0 && (
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                  <PasswordRule ok={hasMinLength} label="8+ characters" />
                  <PasswordRule ok={hasUppercase} label="1 uppercase" />
                  <PasswordRule ok={hasNumber} label="1 number" />
                  <PasswordRule ok={hasSpecial} label="1 special char" />
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Confirm Password</label>
              <div className="relative">
                <Input
                  required
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword.length > 0 && !passwordsMatch && (
                <p className="text-xs text-destructive mt-1">Passwords do not match</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading || !allValid}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>
        )}

        <Link
          href="/login"
          className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sign In
        </Link>
      </Card>
    </div>
  )
}

function PasswordRule({ ok, label }: { ok: boolean; label: string }) {
  return (
    <p className={`text-xs flex items-center gap-1.5 ${ok ? 'text-emerald-600' : 'text-muted-foreground'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-emerald-500' : 'bg-muted-foreground/40'}`} />
      {label}
    </p>
  )
}
