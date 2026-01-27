'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Copy, Check } from 'lucide-react'
import { useState } from 'react'

interface PaymentModalProps {
  order: {
    id: string
    productName: string
    price: string
    buyerName: string
  }
  open: boolean
  onOpenChange: (open: boolean) => void
  onPaymentGenerated: () => void
}

export function PaymentModal({
  order,
  open,
  onOpenChange,
  onPaymentGenerated,
}: PaymentModalProps) {
  const [paymentLink, setPaymentLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleGeneratePaymentLink = () => {
    const link = `https://payment.example.com/${order.id}-${Date.now()}`
    setPaymentLink(link)
  }

  const handleCopyLink = () => {
    if (paymentLink) {
      navigator.clipboard.writeText(paymentLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handlePaymentCollected = () => {
    onPaymentGenerated()
    setPaymentLink(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Collect Payment</DialogTitle>
          <DialogDescription>
            Generate a payment link for {order.buyerName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Order Summary */}
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">Product</p>
            <p className="font-semibold text-foreground">{order.productName}</p>
            <div className="mt-3 flex justify-between border-t border-border pt-3">
              <span className="text-sm text-muted-foreground">Amount Due</span>
              <span className="font-bold text-primary">{order.price}</span>
            </div>
          </div>

          {!paymentLink ? (
            <Button
              onClick={handleGeneratePaymentLink}
              className="w-full bg-primary hover:bg-primary/90"
            >
              Generate Payment Link
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="rounded-lg border border-border bg-background p-3">
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  Payment Link
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 truncate text-sm text-foreground">
                    {paymentLink}
                  </code>
                  <button
                    onClick={handleCopyLink}
                    className="rounded-md p-2 hover:bg-muted"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Copy className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Share this link with the customer to collect payment
              </p>
              <Button
                onClick={handlePaymentCollected}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                Payment Collected
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
