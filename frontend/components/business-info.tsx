'use client'

import { useState } from 'react'
import { Phone, Mail, CreditCard, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function BusinessInfoCard() {
  const [showPayoutModal, setShowPayoutModal] = useState(false)
  const isPaymentActive = true

  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow p-6 md:p-8">
      <h2 className="text-xl md:text-2xl font-bold text-foreground mb-6">Business Information</h2>

      <div className="space-y-6">
        {/* Contact Info */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Phone size={18} style={{ color: 'var(--primary)' }} />
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-semibold text-foreground">+91 98765 43210</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Mail size={18} style={{ color: 'var(--primary)' }} />
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-semibold text-foreground">priya@terracotta.com</p>
            </div>
          </div>
        </div>

        <div className="h-px bg-border" />

        {/* Payout Method */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <CreditCard size={18} style={{ color: 'var(--primary)' }} />
            <div>
              <p className="text-sm text-muted-foreground">Payout Method</p>
              <p className="font-semibold text-foreground">Razorpay</p>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-green-50">
          <CheckCircle size={18} className="text-green-600" />
          <div>
            <p className="font-semibold text-green-700">Payments Active</p>
            <p className="text-sm text-green-600">All systems connected</p>
          </div>
        </div>

        {/* CTA Button */}
        <Button
          className="w-full"
          style={{
            backgroundColor: 'var(--primary)',
            color: 'var(--primary-foreground)',
          }}
          onClick={() => setShowPayoutModal(true)}
        >
          <CreditCard size={16} className="mr-2" />
          Manage Payouts
        </Button>
      </div>

      {/* Payout Modal (Mocked) */}
      {showPayoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md border-0 shadow-xl">
            <div className="p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">Manage Payout Settings</h3>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-sm text-muted-foreground">Razorpay Account ID</label>
                  <input
                    type="text"
                    value="acc_1234567890"
                    readOnly
                    className="w-full mt-2 p-2 border rounded bg-muted text-foreground"
                    style={{ borderColor: 'var(--border)' }}
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Linked Bank Account</label>
                  <p className="mt-2 text-foreground font-semibold">ICICI Bank - Ending in 4567</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={() => setShowPayoutModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: 'var(--primary-foreground)',
                  }}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </Card>
  )
}
