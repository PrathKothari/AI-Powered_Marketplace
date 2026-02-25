'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { MessageSquare, Users, Mail } from 'lucide-react'

interface QuickHelpActionsProps {
  onOpenAIMentor: () => void
}

export default function QuickHelpActions({ onOpenAIMentor }: QuickHelpActionsProps) {
  return (
    <section>
      <h2 className="text-3xl font-bold text-foreground mb-8">Quick Help Actions</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-8 text-center border-primary/20 hover:border-primary/40 hover:shadow-lg transition-all">
          <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-3">Chat with AI Mentor</h3>
          <p className="text-muted-foreground text-sm mb-6">
            Get instant personalized advice about pricing, visibility, and growing your shop.
          </p>
          <Button
            onClick={onOpenAIMentor}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Start Conversation
          </Button>
        </Card>

        <Card className="p-8 text-center border-primary/20 hover:border-primary/40 hover:shadow-lg transition-all">
          <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-4">
            <Users className="w-6 h-6 text-secondary" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-3">Ask Community</h3>
          <p className="text-muted-foreground text-sm mb-6">
            Connect with other artisans, share experiences, and learn from each other.
          </p>
          <Button variant="outline" className="w-full border-secondary/30 text-secondary hover:bg-secondary/5 bg-transparent">
            Join Forum
          </Button>
        </Card>

        <Card className="p-8 text-center border-primary/20 hover:border-primary/40 hover:shadow-lg transition-all">
          <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
            <Mail className="w-6 h-6 text-accent" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-3">Contact Support</h3>
          <p className="text-muted-foreground text-sm mb-6">
            Have a question? Our support team is here to help.
          </p>
          <Button variant="outline" className="w-full border-accent/30 text-accent hover:bg-accent/5 bg-transparent">
            Send Message
          </Button>
        </Card>
      </div>
    </section>
  )
}
