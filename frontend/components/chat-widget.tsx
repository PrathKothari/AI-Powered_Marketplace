'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { MessageCircle, X, Send, Sparkles, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  products?: Product[]
  timestamp: Date
}

interface Product {
  productId: string
  title: string
  price: number
  craftType: string
  region: string
  description: string
  images: string[]
  similarity: number
}

const QUICK_PROMPTS = [
  '🎨 Show me Madhubani art',
  '🖼️ What crafts do you have?',
  '✨ Tell me about Indian art',
  '🏺 Recommend something unique',
]

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hey! 🙏 I'm Kala, your art buddy at KalaSetu. I can help you discover amazing Indian art, find specific crafts, or just chat about art and culture. What are you curious about?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPulse, setShowPulse] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Hide pulse after first open
  useEffect(() => {
    if (isOpen) setShowPulse(false)
  }, [isOpen])

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const history = messages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({ role: m.role, content: m.content }))

      const res = await fetch(`${API_URL}/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          conversation_history: history,
        }),
      })

      if (!res.ok) throw new Error('Failed to get response')

      const data = await res.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply,
        products: data.products?.length > 0 ? data.products : undefined,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error('Chat error:', error)
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: "Oops, I'm having trouble connecting right now. Please try again in a moment! 😅",
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleQuickPrompt = (prompt: string) => {
    // Strip the emoji prefix
    const text = prompt.replace(/^[^\w]+/, '').trim()
    sendMessage(text)
  }

  const formatMessage = (content: string) => {
    // Convert **bold** to <strong>
    let formatted = content.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Convert *italic* to <em>
    formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Convert newlines to <br>
    formatted = formatted.replace(/\n/g, '<br />')
    return formatted
  }

  return (
    <>
      {/* Floating Chat Button */}
      <button
        id="chat-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-300 hover:scale-110 active:scale-95"
        style={{
          background: 'linear-gradient(135deg, #c0392b 0%, #e67e22 100%)',
          color: 'white',
        }}
        aria-label="Open chat"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <>
            <MessageCircle className="h-6 w-6" />
            {showPulse && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex h-4 w-4 rounded-full bg-amber-500" />
              </span>
            )}
          </>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 z-50 flex flex-col overflow-hidden rounded-2xl shadow-2xl"
          style={{
            width: '400px',
            height: '560px',
            maxHeight: 'calc(100vh - 140px)',
            maxWidth: 'calc(100vw - 32px)',
            border: '1px solid rgba(192, 57, 43, 0.15)',
            background: '#fdfbf8',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-5 py-4"
            style={{
              background: 'linear-gradient(135deg, #c0392b 0%, #d35400 100%)',
              color: 'white',
            }}
          >
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold"
              style={{ background: 'rgba(255,255,255,0.2)' }}
            >
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold">Kala</h3>
              <p className="text-xs opacity-80">Your KalaSetu art assistant</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1.5 transition-colors hover:bg-white/20"
              aria-label="Close chat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div
            className="flex-1 space-y-4 overflow-y-auto px-4 py-4"
            style={{ scrollbarWidth: 'thin' }}
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className="max-w-[85%]">
                  <div
                    className="rounded-2xl px-4 py-3 text-sm leading-relaxed"
                    style={
                      msg.role === 'user'
                        ? {
                            background: 'linear-gradient(135deg, #c0392b, #d35400)',
                            color: 'white',
                            borderBottomRightRadius: '4px',
                          }
                        : {
                            background: '#fff',
                            color: '#3d2c1e',
                            border: '1px solid #ede4da',
                            borderBottomLeftRadius: '4px',
                          }
                    }
                    dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                  />

                  {/* Product Cards */}
                  {msg.products && msg.products.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {msg.products.map((product) => (
                        <Link
                          key={product.productId}
                          href={`/product/${product.productId}`}
                          className="group block overflow-hidden rounded-xl border border-amber-100 bg-white transition-all hover:border-amber-300 hover:shadow-md"
                        >
                          <div className="flex gap-3 p-3">
                            {product.images?.[0] && (
                              <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
                                <img
                                  src={product.images[0]}
                                  alt={product.title}
                                  className="h-full w-full object-cover transition-transform group-hover:scale-110"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {product.title}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {product.craftType}
                                {product.region ? ` · ${product.region}` : ''}
                              </p>
                              <div className="flex items-center justify-between mt-1.5">
                                <span
                                  className="text-sm font-semibold"
                                  style={{ color: '#c0392b' }}
                                >
                                  ₹{product.price}
                                </span>
                                <span className="flex items-center gap-1 text-xs text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                  View <ArrowRight className="h-3 w-3" />
                                </span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div
                  className="rounded-2xl px-4 py-3"
                  style={{
                    background: '#fff',
                    border: '1px solid #ede4da',
                    borderBottomLeftRadius: '4px',
                  }}
                >
                  <div className="flex gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full animate-bounce"
                      style={{ background: '#c0392b', animationDelay: '0ms' }}
                    />
                    <span
                      className="h-2 w-2 rounded-full animate-bounce"
                      style={{ background: '#d35400', animationDelay: '150ms' }}
                    />
                    <span
                      className="h-2 w-2 rounded-full animate-bounce"
                      style={{ background: '#e67e22', animationDelay: '300ms' }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Quick prompts — show only when just the welcome message */}
            {messages.length === 1 && !isLoading && (
              <div className="flex flex-wrap gap-2 pt-2">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleQuickPrompt(prompt)}
                    className="rounded-full border px-3.5 py-2 text-xs font-medium transition-all hover:shadow-sm active:scale-95"
                    style={{
                      background: 'white',
                      borderColor: '#ede4da',
                      color: '#6b4c3b',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#c0392b'
                      e.currentTarget.style.color = '#c0392b'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#ede4da'
                      e.currentTarget.style.color = '#6b4c3b'
                    }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 border-t px-4 py-3"
            style={{ borderColor: '#ede4da', background: '#fff' }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about crafts, art styles..."
              disabled={isLoading}
              className="flex-1 rounded-xl border-none bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-gray-400"
              style={{ color: '#3d2c1e' }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="flex h-9 w-9 items-center justify-center rounded-full transition-all disabled:opacity-30"
              style={{
                background: input.trim() ? 'linear-gradient(135deg, #c0392b, #d35400)' : '#e8e0d8',
                color: input.trim() ? 'white' : '#999',
              }}
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  )
}
