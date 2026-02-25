'use client'

import { useState } from 'react'
import { OrderCard } from './order-card'

const orders = [
  {
    id: 'ORD-2024-001',
    productName: 'Handwoven Ceramic Vase',
    productImage: 'https://images.unsplash.com/photo-1578500494198-246f612d03b3?w=200&h=200&fit=crop',
    buyerName: 'Priya Sharma',
    orderDate: 'Jan 20, 2024',
    price: '₹2,400',
    status: 'pending',
  },
  {
    id: 'ORD-2024-002',
    productName: 'Macramé Wall Hanging',
    productImage: 'https://images.unsplash.com/photo-1578500494198-246f612d03b3?w=200&h=200&fit=crop',
    buyerName: 'Amit Patel',
    orderDate: 'Jan 18, 2024',
    price: '₹3,800',
    status: 'paid',
  },
  {
    id: 'ORD-2024-003',
    productName: 'Leather Craft Journal',
    productImage: 'https://images.unsplash.com/photo-1578500494198-246f612d03b3?w=200&h=200&fit=crop',
    buyerName: 'Neha Singh',
    orderDate: 'Jan 15, 2024',
    price: '₹1,200',
    status: 'shipped',
  },
  {
    id: 'ORD-2024-004',
    productName: 'Hand-Painted Wooden Box',
    productImage: 'https://images.unsplash.com/photo-1578500494198-246f612d03b3?w=200&h=200&fit=crop',
    buyerName: 'Rajesh Kumar',
    orderDate: 'Jan 10, 2024',
    price: '₹1,800',
    status: 'delivered',
    rating: 5,
    review: 'Beautiful craftsmanship! The details are amazing.',
  },
  {
    id: 'ORD-2024-005',
    productName: 'Terracotta Plant Pot Set',
    productImage: 'https://images.unsplash.com/photo-1578500494198-246f612d03b3?w=200&h=200&fit=crop',
    buyerName: 'Anjali Desai',
    orderDate: 'Jan 8, 2024',
    price: '₹2,100',
    status: 'delivered',
    rating: 4,
    review: 'Very nice. Perfect for my balcony garden.',
  },
]

export function OrdersList() {
  const [orders_, setOrders] = useState(orders)

  const updateOrderStatus = (id: string, newStatus: string, data?: Record<string, unknown>) => {
    setOrders(orders_.map(order =>
      order.id === id ? { ...order, status: newStatus, ...data } : order
    ))
  }

  return (
    <div className="space-y-4">
      {orders_.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          onStatusUpdate={updateOrderStatus}
        />
      ))}
    </div>
  )
}
