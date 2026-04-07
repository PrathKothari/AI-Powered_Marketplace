'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useDispatch } from 'react-redux'
import { setUser } from '@/store/slices/userSlice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const dispatch = useDispatch()
  const searchParams = useSearchParams()
  const initialRole = (searchParams.get('role') as 'buyer' | 'artisan') || 'buyer'

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: initialRole
  })

  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Mock API call
    setTimeout(() => {
      const userObj = {
        name: formData.name,
        email: formData.email,
        role: formData.role as 'buyer' | 'artisan'
      }

      // Save user to localStorage
      localStorage.setItem("user", JSON.stringify(userObj))

      // Save user to Redux
      dispatch(setUser(userObj))

      setIsLoading(false)
      router.push('/dashboard')
    }, 1000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md p-8 shadow-xl border-border space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">Create Account</h1>
          <p className="text-muted-foreground mt-2">Join CraftHub today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Full Name</label>
            <Input required name="name" placeholder="Sofia Artisan" value={formData.name} onChange={handleChange} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input required type="email" name="email" placeholder="hello@example.com" value={formData.email} onChange={handleChange} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <Input required type="password" name="password" placeholder="••••••••" value={formData.password} onChange={handleChange} />
          </div>

          <div className="space-y-3 pt-2">
            <label className="text-sm font-medium">I want to:</label>
            <div className="grid grid-cols-2 gap-4">
              <label className={`border rounded-lg p-4 cursor-pointer transition-all ${formData.role === 'buyer' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-muted'}`}>
                <input type="radio" name="role" value="buyer" className="hidden" checked={formData.role === 'buyer'} onChange={handleChange} />
                <div className="font-semibold text-center mt-1">Buy Products</div>
              </label>
              
              <label className={`border rounded-lg p-4 cursor-pointer transition-all ${formData.role === 'artisan' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-muted'}`}>
                <input type="radio" name="role" value="artisan" className="hidden" checked={formData.role === 'artisan'} onChange={handleChange} />
                <div className="font-semibold text-center mt-1">Sell Products</div>
              </label>
            </div>
          </div>

          <Button type="submit" className="w-full py-6 text-md font-semibold mt-6" disabled={isLoading}>
            {isLoading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>

        <p className="text-sm text-center text-muted-foreground">
          Already have an account? <Link href="/login" className="text-primary hover:underline font-medium">Sign in</Link>
        </p>
      </Card>
    </div>
  )
}
