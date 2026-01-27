'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface TrackingModalProps {
  order: {
    id: string
    productName: string
    buyerName: string
  }
  open: boolean
  onOpenChange: (open: boolean) => void
  onTrackingAdded: () => void
}

export function TrackingModal({
  order,
  open,
  onOpenChange,
  onTrackingAdded,
}: TrackingModalProps) {
  const [courier, setCourier] = useState('')
  const [trackingId, setTrackingId] = useState('')

  const handleSaveTracking = () => {
    if (courier.trim() && trackingId.trim()) {
      onTrackingAdded()
      setCourier('')
      setTrackingId('')
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Tracking Information</DialogTitle>
          <DialogDescription>
            Share shipping details with {order.buyerName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Product Info */}
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">Product</p>
            <p className="font-semibold text-foreground">{order.productName}</p>
          </div>

          {/* Courier Name */}
          <div className="space-y-2">
            <Label htmlFor="courier">Courier Name</Label>
            <Input
              id="courier"
              placeholder="e.g., DHL, Fedex, Local Courier"
              value={courier}
              onChange={(e) => setCourier(e.target.value)}
              className="border-border"
            />
          </div>

          {/* Tracking ID */}
          <div className="space-y-2">
            <Label htmlFor="tracking">Tracking ID</Label>
            <Input
              id="tracking"
              placeholder="e.g., TRK123456789"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              className="border-border"
            />
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSaveTracking}
            disabled={!courier.trim() || !trackingId.trim()}
            className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50"
          >
            Save Tracking
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
