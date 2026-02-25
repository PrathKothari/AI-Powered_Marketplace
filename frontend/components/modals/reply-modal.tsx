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
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface ReplyModalProps {
  order: {
    id: string
    productName: string
    buyerName: string
    review?: string
  }
  open: boolean
  onOpenChange: (open: boolean) => void
  onReplySent: () => void
}

export function ReplyModal({
  order,
  open,
  onOpenChange,
  onReplySent,
}: ReplyModalProps) {
  const [reply, setReply] = useState('')

  const handleSendReply = () => {
    if (reply.trim()) {
      onReplySent()
      setReply('')
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reply to Customer</DialogTitle>
          <DialogDescription>
            Send a message to {order.buyerName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Customer Review */}
          {order.review && (
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-sm font-medium text-muted-foreground">
                Customer Review
              </p>
              <p className="mt-2 italic text-foreground">
                &quot;{order.review}&quot;
              </p>
            </div>
          )}

          {/* Reply Textarea */}
          <div className="space-y-2">
            <Label htmlFor="reply">Your Message</Label>
            <Textarea
              id="reply"
              placeholder="Thank you for your review! Write your message here..."
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              className="min-h-32 border-border"
            />
          </div>

          {/* Send Button */}
          <Button
            onClick={handleSendReply}
            disabled={!reply.trim()}
            className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50"
          >
            Send Reply
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
