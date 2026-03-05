'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDispatch } from 'react-redux'
import { loginAsBuyer } from '@/store/authSlice'

export default function BuyerEmailLoginPage() {
  const router = useRouter()
  const dispatch = useDispatch()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // ✅ MOCK LOGIN
    setTimeout(() => {
      // 🔥 SET AUTH + ROLE (THIS WAS MISSING)
      dispatch(loginAsBuyer())

      setLoading(false)

      // ✅ redirect to marketplace
      // store role in localStorage
localStorage.setItem('role', 'buyer')

// OPTIONAL: if using Redux
// dispatch(setRole('buyer'))

router.push('/buyer/marketplace')
    }, 800)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <form
        onSubmit={handleLogin}
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
          Sign in with Email
        </h1>

        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-3 rounded-lg border"
        />

        <input
          type="password"
          placeholder="Password"
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
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  )
}