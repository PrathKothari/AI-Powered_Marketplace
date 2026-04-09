'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { updateProfile } from '@/lib/api'
import { storeSession } from '@/lib/auth'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, User, Mail, KeyRound, Loader2, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function ProfilePage() {
  const { user, loading, forgotPassword } = useAuth()
  const router = useRouter()

  const [name, setName] = useState(user?.name ?? '')
  const [savingName, setSavingName] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [sendingReset, setSendingReset] = useState(false)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!user) {
    router.push('/login')
    return null
  }

  const handleSaveName = async () => {
    if (!name.trim() || name.trim() === user.name) return
    setSavingName(true)
    try {
      const res = await updateProfile(name.trim())
      // Persist updated token + user info
      storeSession(res.access_token, res.user)
      toast.success('Name updated! Please refresh the page to see changes in the navbar.')
    } catch (err: any) {
      toast.error(err.message || 'Failed to update name')
    } finally {
      setSavingName(false)
    }
  }

  const handlePasswordReset = async () => {
    setSendingReset(true)
    try {
      await forgotPassword(user.email)
      setResetSent(true)
      toast.success('Password reset email sent!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to send reset email')
    } finally {
      setSendingReset(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        <div>
          <Link href="/dashboard" className="inline-flex items-center text-sm text-slate-500 hover:text-primary mb-2">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
          <p className="text-muted-foreground mt-1">Manage your account details</p>
        </div>

        {/* Avatar card */}
        <Card className="p-6 flex items-center gap-4 bg-white">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold uppercase ring-4 ring-primary/5">
            {user.name.charAt(0)}
          </div>
          <div>
            <p className="font-bold text-lg">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </Card>

        {/* Name update */}
        <Card className="p-6 bg-white space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <User className="w-4 h-4 text-primary" />
            <h2 className="font-semibold">Display Name</h2>
          </div>
          <div className="flex gap-2">
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
              className="flex-1"
            />
            <Button
              onClick={handleSaveName}
              disabled={savingName || !name.trim() || name.trim() === user.name}
            >
              {savingName ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
            </Button>
          </div>
        </Card>

        {/* Email (read-only) */}
        <Card className="p-6 bg-white space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Mail className="w-4 h-4 text-primary" />
            <h2 className="font-semibold">Email Address</h2>
          </div>
          <Input value={user.email} disabled className="bg-slate-50 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
        </Card>

        {/* Password reset */}
        <Card className="p-6 bg-white space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <KeyRound className="w-4 h-4 text-primary" />
            <h2 className="font-semibold">Password</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            We'll send a password reset link to <strong>{user.email}</strong>.
          </p>
          {resetSent ? (
            <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
              <CheckCircle2 className="w-4 h-4" />
              Reset email sent — check your inbox.
            </div>
          ) : (
            <Button variant="outline" onClick={handlePasswordReset} disabled={sendingReset}>
              {sendingReset ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Send Password Reset Email
            </Button>
          )}
        </Card>
      </div>
    </main>
  )
}
