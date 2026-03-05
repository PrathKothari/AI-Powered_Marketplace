'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function BuyerRegisterPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // ✅ TEMP mock register
    setTimeout(() => {
      setLoading(false)

      // redirect to marketplace after signup
      router.push('/buyer/marketplace')
    }, 800)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <form
        onSubmit={handleRegister}
        className="w-full max-w-md bg-card rounded-xl shadow-md p-6 space-y-4"
      >
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-muted-foreground"
        >
          ← Back
        </button>

        <h1 className="text-2xl font-semibold text-center">
          Create Buyer Account
        </h1>

        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-3 rounded-lg border"
        />

        <input
          type="password"
          placeholder="Create password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-4 py-3 rounded-lg border"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium"
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>
    </div>
  )
}
