'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { X, Send, Sparkles } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface Message {
  id: string
  type: 'user' | 'mentor'
  content: string
  timestamp: Date
}

const sampleQuestions = [
  'How do I price this product?',
  'Why are my views low?',
  'How can I improve my story?',
  'What photos work best?',
]

const mentorResponses: Record<string, string> = {
  'how do i price this product?':
    'Great question! The key to pricing is balancing fair compensation for your effort with market competitiveness. Start by calculating your materials cost, then add your time (aim for at least $15-25/hour depending on skill), plus overhead. Research similar artisans\' prices, then position yourself based on quality and brand perception. Many successful makers price 50-100% above cost.',
  'why are my views low?':
    'Low views often come down to visibility factors. Make sure your product titles include search keywords, add high-quality photos (5+ per product), write detailed descriptions, and optimize your shop tags. Also, engage on social media—share behind-the-scenes content, tag relevant accounts, and use trending hashtags. It takes time, but consistency pays off!',
  'how can i improve my story?':
    'Your artisan story is your secret weapon! Share what inspired you to create, what makes your process unique, and what you hope customers feel when they use your work. Use conversational language like you\'re talking to a friend. Include personal details—your heritage, challenges you\'ve overcome, or your design philosophy. Authentic stories make people want to buy from YOU, not just your products.',
  'what photos work best?':
    'The best photos show your work in context and detail. Include: 1) Clean, well-lit product shots from multiple angles, 2) Lifestyle photos showing it in use, 3) Close-ups highlighting craftsmanship, 4) Lifestyle/brand photos that tell your story. Use natural light when possible, keep a consistent editing style, and take at least 5 photos per product. Quality photos can increase sales by 30%+!',
}

interface AIMentorPanelProps {
  onClose: () => void
}

export default function AIMentorPanel({ onClose }: AIMentorPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'mentor',
      content: 'Hey there! 👋 I\'m your AI Mentor. I\'m here to help you grow your craft business. What would you like to know?',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSendMessage = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // Simulate mentor response
    setTimeout(() => {
      const lowerInput = input.toLowerCase()
      let response = 'That\'s a great question! I\'d love to help. Could you tell me a bit more about what you\'re trying to achieve? That way I can give you more specific advice tailored to your situation.'

      // Simple keyword matching for demo
      for (const [key, value] of Object.entries(mentorResponses)) {
        if (lowerInput.includes(key.split(' ').slice(0, 3).join(' '))) {
          response = value
          break
        }
      }

      const mentorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'mentor',
        content: response,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, mentorMessage])
      setIsLoading(false)
    }, 800)
  }

  const handleQuestionClick = (question: string) => {
    setInput(question)
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-xl h-[600px] flex flex-col bg-card border-primary/20">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between sticky top-0 bg-card">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">AI Mentor</h3>
              <p className="text-xs text-muted-foreground">Always here to help</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                }`}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted text-foreground px-4 py-2 rounded-lg">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-foreground/50 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-foreground/50 animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 rounded-full bg-foreground/50 animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Suggested questions (show if no messages beyond initial) */}
        {messages.length === 1 && (
          <div className="px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2">Popular questions:</p>
            <div className="space-y-2">
              {sampleQuestions.map((question, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuestionClick(question)}
                  className="w-full text-left text-sm p-2 rounded border border-primary/20 text-foreground hover:bg-primary/10 transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-border bg-card sticky bottom-0">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !isLoading) {
                  handleSendMessage()
                }
              }}
              placeholder="Ask me anything..."
              className="flex-1 bg-muted border-0 focus-visible:ring-1 focus-visible:ring-primary"
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
