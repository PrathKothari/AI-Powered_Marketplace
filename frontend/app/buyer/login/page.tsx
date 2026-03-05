'use client'

import { useRouter } from 'next/navigation'

export default function BuyerLoginPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md bg-card rounded-xl shadow-md p-6 text-center space-y-4">
        <h1 className="text-2xl font-semibold">Welcome, Explorer</h1>

        {/* Continue with Email */}
        <button
          onClick={() => router.push('/buyer/login/email')}
          className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium"
        >
          Continue with Email
        </button>

        {/* Continue with Google (placeholder) */}
        <button
          onClick={() => alert('Google auth coming soon')}
          className="w-full border py-3 rounded-lg font-medium"
        >
          Continue with Google
        </button>

        {/* Register link */}
        <p className="text-sm text-muted-foreground">
          New here?{' '}
          <button
            onClick={() => router.push('/buyer/register')}
            className="text-primary underline font-medium"
          >
            Create a Buyer Account
          </button>
        </p>
      </div>
    </div>
  )
}
