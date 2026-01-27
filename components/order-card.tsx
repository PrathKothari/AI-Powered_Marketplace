'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { PaymentModal } from './modals/payment-modal'
import { TrackingModal } from './modals/tracking-modal'
import { ReplyModal } from './modals/reply-modal'
import { Star, Truck } from 'lucide-react'

interface OrderCardProps {
  order: {
    id: string
    productName: string
    productImage: string
    buyerName: string
    orderDate: string
    price: string
    status: 'pending' | 'paid' | 'shipped' | 'delivered'
    rating?: number
    review?: string
  }
  onStatusUpdate: (id: string, status: string, data?: Record<string, unknown>) => void
}

const statusConfig = {
  pending: {
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-800',
    bgLight: 'bg-yellow-50',
  },
  paid: {
    label: 'Paid',
    color: 'bg-blue-100 text-blue-800',
    bgLight: 'bg-blue-50',
  },
  shipped: {
    label: 'Shipped',
    color: 'bg-purple-100 text-purple-800',
    bgLight: 'bg-purple-50',
  },
  delivered: {
    label: 'Delivered',
    color: 'bg-emerald-100 text-emerald-800',
    bgLight: 'bg-emerald-50',
  },
}

export function OrderCard({ order, onStatusUpdate }: OrderCardProps) {
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showTrackingModal, setShowTrackingModal] = useState(false)
  const [showReplyModal, setShowReplyModal] = useState(false)

  const config = statusConfig[order.status]

  const renderActionButton = () => {
    switch (order.status) {
      case 'pending':
        return (
          <Button
            onClick={() => setShowPaymentModal(true)}
            className="bg-primary hover:bg-primary/90"
            size="sm"
          >
            Request Payment
          </Button>
        )
      case 'paid':
        return (
          <Button
            onClick={() => setShowTrackingModal(true)}
            className="bg-primary hover:bg-primary/90"
            size="sm"
          >
            Mark as Shipped
          </Button>
        )
      case 'shipped':
        return (
          <Button
            variant="outline"
            size="sm"
            disabled
          >
            <Truck className="mr-2 h-4 w-4" />
            In Transit
          </Button>
        )
      case 'delivered':
        return (
          <Button
            onClick={() => setShowReplyModal(true)}
            variant="outline"
            size="sm"
          >
            Reply to Customer
          </Button>
        )
      default:
        return null
    }
  }

  return (
    <>
      <Card className={`overflow-hidden transition-shadow hover:shadow-md ${config.bgLight}`}>
        <div className="p-6">
          <div className="flex flex-col gap-6 sm:flex-row">
            {/* Product Image */}
            <div className="flex-shrink-0">
              <Image
                src={order.productImage || "/placeholder.svg"}
                alt={order.productName}
                width={100}
                height={100}
                className="rounded-lg object-cover"
              />
            </div>

            {/* Order Details */}
            <div className="flex-1">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Order ID: {order.id}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-foreground">
                    {order.productName}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Buyer: {order.buyerName}
                  </p>
                  <div className="mt-3 flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">
                      {order.orderDate}
                    </span>
                    <span className="text-lg font-bold text-primary">
                      {order.price}
                    </span>
                  </div>
                </div>

                {/* Status and Action */}
                <div className="flex flex-col items-start gap-3 sm:items-end">
                  <Badge className={config.color}>
                    {config.label}
                  </Badge>
                  {renderActionButton()}
                </div>
              </div>

              {/* Customer Review Section */}
              {order.status === 'delivered' && order.review && (
                <div className="mt-6 border-t border-border pt-4">
                  <div className="flex gap-1">
                    {[...Array(order.rating || 0)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                  <p className="mt-2 text-sm italic text-muted-foreground">
                    &quot;{order.review}&quot;
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Modals */}
      <PaymentModal
        order={order}
        open={showPaymentModal}
        onOpenChange={setShowPaymentModal}
        onPaymentGenerated={() => {
          setShowPaymentModal(false)
          onStatusUpdate(order.id, 'paid')
        }}
      />
      <TrackingModal
        order={order}
        open={showTrackingModal}
        onOpenChange={setShowTrackingModal}
        onTrackingAdded={() => {
          setShowTrackingModal(false)
          onStatusUpdate(order.id, 'shipped')
        }}
      />
      <ReplyModal
        order={order}
        open={showReplyModal}
        onOpenChange={setShowReplyModal}
        onReplySent={() => setShowReplyModal(false)}
      />
    </>
  )
}
