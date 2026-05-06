'use client'

import { useEffect, useRef, useState } from 'react'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/context/AuthContext'
import type { ChatMessage } from '@/lib/api'

const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8001/api/v1/live'

interface LiveChatProps {
  sessionId: string
  isLive: boolean
  initialMessages?: ChatMessage[]
}

export default function LiveChat({ sessionId, isLive, initialMessages = [] }: LiveChatProps) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [input, setInput] = useState('')
  const [connected, setConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // WebSocket connection for live sessions
  useEffect(() => {
    if (!isLive) return

    const ws = new WebSocket(`${WS_BASE}/ws/${sessionId}/chat`)

    ws.onopen = () => {
      setConnected(true)
    }

    ws.onmessage = (event) => {
      const msg: ChatMessage = JSON.parse(event.data)
      setMessages(prev => [...prev, msg])
    }

    ws.onclose = () => {
      setConnected(false)
    }

    ws.onerror = () => {
      setConnected(false)
    }

    wsRef.current = ws

    return () => {
      ws.close()
    }
  }, [sessionId, isLive])

  const sendMessage = () => {
    if (!input.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return

    wsRef.current.send(JSON.stringify({
      userId: user?.uid || 'anonymous',
      userName: user?.name || 'Anonymous',
      message: input.trim(),
    }))
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full border border-border rounded-xl bg-white overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold text-sm">Live Chat</h3>
        {isLive && (
          <span className={`text-xs px-2 py-0.5 rounded-full ${connected ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
            {connected ? 'Connected' : 'Connecting...'}
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {messages.length === 0 && (
          <p className="text-center text-xs text-muted-foreground py-8">
            {isLive ? 'No messages yet. Say hello!' : 'No chat messages.'}
          </p>
        )}
        {messages.map((msg) => (
          <div key={msg.messageId} className="flex gap-2 items-start">
            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold uppercase flex-shrink-0 mt-0.5">
              {msg.userName.charAt(0)}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-semibold text-foreground">{msg.userName}</span>
              <p className="text-sm text-muted-foreground break-words">{msg.message}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {isLive && (
        <div className="p-3 border-t border-border flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={user ? 'Type a message...' : 'Sign in to chat'}
            disabled={!user || !connected}
            className="flex-1 text-sm"
          />
          <Button
            size="icon"
            onClick={sendMessage}
            disabled={!input.trim() || !user || !connected}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
