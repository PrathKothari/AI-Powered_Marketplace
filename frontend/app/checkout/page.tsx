'use client'

import { useRouter } from 'next/navigation'

export default function CheckoutPage() {
  const router = useRouter()

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-4xl rounded-xl border border-border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Checkout</h1>
        <p className="mt-2 text-sm text-muted-foreground">Checkout flow not yet implemented. This is a placeholder.</p>
        <button onClick={() => router.push('/marketplace')} className="mt-6 rounded-lg bg-primary px-4 py-2 text-white">
          Return to Marketplace
        </button>
      </div>
    </main>
  )
}
