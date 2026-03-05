'use client'

import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { removeFromCart, updateQuantity } from '@/store/slices/cartSlice'
import Image from 'next/image'

export default function CartPage() {
  const items = useAppSelector((state) => state.cart.items)
  const dispatch = useAppDispatch()

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Your Cart</h1>

      {items.length === 0 ? (
        <p>Your cart is empty</p>
      ) : (
        <>
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 border-b py-4"
            >
              <Image
                src={item.image}
                alt={item.name}
                width={80}
                height={80}
                className="rounded-lg"
              />

              <div className="flex-1">
                <p className="font-medium">{item.name}</p>
                <p>${item.price}</p>

                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() =>
                      dispatch(
                        updateQuantity({
                          id: item.id,
                          quantity: Math.max(1, item.quantity - 1),
                        })
                      )
                    }
                  >
                    -
                  </button>

                  <span>{item.quantity}</span>

                  <button
                    onClick={() =>
                      dispatch(
                        updateQuantity({
                          id: item.id,
                          quantity: item.quantity + 1,
                        })
                      )
                    }
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                onClick={() => dispatch(removeFromCart(item.id))}
                className="text-red-500"
              >
                Remove
              </button>
            </div>
          ))}

          <div className="mt-6 text-right">
            <p className="text-xl font-bold">Total: ${total}</p>

            <button className="mt-4 bg-black text-white px-6 py-3 rounded-lg">
              Checkout
            </button>
          </div>
        </>
      )}
    </div>
  )
}