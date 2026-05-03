'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDispatch } from 'react-redux'
import { setUser } from '@/store/slices/userSlice'
import { getUser } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const dispatch = useDispatch()
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorDesc, setErrorDesc] = useState('')

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorDesc('')

    // Mock Login Logic
    setTimeout(() => {
      // For this mock demo, we just see if the user has an existing account in localStorage.
      const savedUser = getUser();

      let loginUser = savedUser;

      // If they haven't registered anything locally to test, provide a mock fallback:
      if (!savedUser) {
        loginUser = { name: "Mock User", email, role: "buyer" };
        localStorage.setItem("user", JSON.stringify(loginUser))
      }

      if (loginUser) {
        dispatch(setUser(loginUser))
        router.push('/dashboard')
      }

      setIsLoading(false)
    }, 1000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md p-8 shadow-xl border-border space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
             <span className="text-xl font-bold text-primary">✨</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground">Welcome Back</h1>
          <p className="text-muted-foreground mt-2">Sign in to continue to KalaSetu</p>
        </div>

        {errorDesc && <p className="text-red-500 text-sm text-center">{errorDesc}</p>}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input required type="email" name="email" placeholder="hello@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <Input required type="password" name="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <Button type="submit" className="w-full py-6 text-md font-semibold mt-6 shadow-md shadow-primary/20" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <p className="text-sm text-center text-muted-foreground">
          New here? <Link href="/register" className="text-primary hover:underline font-medium">Create an Account</Link>
        </p>
      </Card>
    </div>
  )
}
