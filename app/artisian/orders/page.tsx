'use client'

import { useState } from 'react'
import { OrdersHeader } from '../../../components/orders-header'
import { StatisticsCards } from '../../../components/statistics-cards'
import { OrdersList } from '../../../components/orders-list'
import EmptyState from '../../../components/empty-state'

export default function Page() {
  const [hasOrders] = useState(true)

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <OrdersHeader />
        
        {hasOrders ? (
          <>
            <StatisticsCards />
            <OrdersList />
          </>
        ) : (
          <EmptyState />
        )}
      </div>
    </main>
  )
}
