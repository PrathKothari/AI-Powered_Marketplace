import './globals.css'
import type { Metadata } from 'next'
import { Inter, Outfit } from 'next/font/google'

import Providers from '@/store/provider'
import { CartProvider } from '@/context/CartContext'
import { AuthProvider } from '@/context/AuthContext'
import ChatWidget from '@/components/chat-widget'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' })

export const metadata: Metadata = {
  title: 'KalaSetu',
  description: 'Discover authentic handmade crafts',
  title: 'KalaSetu Marketplace',
  description: 'Discover authentic handmade Indian crafts',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${outfit.variable} font-sans`}>
        <Providers>
          <AuthProvider>
            <CartProvider>
              {children}
              <ChatWidget />
            </CartProvider>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  )
}
