"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronLeft } from "lucide-react"

interface LoginFormProps {
  method: "email" | "google"
  onBack: () => void
}

export default function LoginForm({ method, onBack }: LoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsLoading(false)
  }

  if (method === "google") {
    return (
      <div className="space-y-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
        <div className="py-8 text-center space-y-3">
          <p className="text-sm text-muted-foreground">Redirecting to Google...</p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        Back
      </button>

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-bold text-foreground">
          Email
        </label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-input border-border/60 text-foreground placeholder:text-muted-foreground"
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-bold text-foreground">
          Password
        </label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="bg-input border-border/60 text-foreground placeholder:text-muted-foreground"
          required
        />
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-bold transition-colors"
      >
        {isLoading ? "Signing in..." : "Sign In"}
      </Button>

      <p className="text-center text-sm text-muted-foreground leading-relaxed">
        Your account helps us personalize your discovery experience
      </p>
    </form>
  )
}
