import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

import Providers from '@/store/provider'
import { CartProvider } from '@/context/CartContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'KalaSetu',
  description: 'Discover authentic handmade crafts',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <CartProvider>
            {children}
          </CartProvider>
        </Providers>
      </body>
    </html>
  )
}
