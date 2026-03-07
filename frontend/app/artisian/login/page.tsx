"use client"

import type React from "react"
import { useState } from "react"
import { fetchApi, setAuthToken } from "@/lib/api"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import PhoneLoginForm from "@/components/phone-login-form"

export default function ArtisanLogin() {
  const [loginMode, setLoginMode] = useState<"phone" | "email">("phone")

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5 flex items-center justify-center p-4">
      <div className="fixed top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl -z-10" />
      <div className="fixed bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl -z-10" />

      <Card className="w-full max-w-md shadow-lg border-border/50">
        <div className="p-8 md:p-10">
          {/* Logo and Platform Name */}
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <span className="text-xl font-bold text-primary-foreground">✨</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-foreground">CraftHub</h1>
            <p className="text-sm text-muted-foreground mt-1">Artisan Marketplace</p>
          </div>

          {/* Main Heading */}
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-foreground mb-2 text-pretty">Welcome, Artisan</h2>
            <p className="text-foreground/60">Sign in to manage your craft, stories, and orders</p>
          </div>

          {/* Login Form */}
          {loginMode === "phone" ? <PhoneLoginForm /> : <EmailLoginForm />}

          {/* Helper Text */}
          <p className="text-xs text-muted-foreground text-center mt-6 leading-relaxed">
            We use your information to verify your identity and protect your account
          </p>

          {/* Toggle Login Mode */}
          <div className="mt-6 pt-6 border-t border-border">
            {loginMode === "phone" ? (
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-3">Prefer email?</p>
                <Button
                  variant="ghost"
                  className="w-full text-primary hover:bg-primary/5"
                  onClick={() => setLoginMode("email")}
                >
                  Sign in with Email
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-3">Use phone instead?</p>
                <Button
                  variant="ghost"
                  className="w-full text-primary hover:bg-primary/5"
                  onClick={() => setLoginMode("phone")}
                >
                  Sign in with Phone
                </Button>
              </div>
            )}
          </div>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              New here?{" "}
              <a href="/signup" className="font-semibold text-primary hover:text-primary/80 transition-colors">
                Create an Artisan Account
              </a>
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}


function EmailLoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetchApi<{ access_token: string }>("/auth/login", {
        data: { email, password },
      })

      setAuthToken(response.access_token)
      toast.success("Successfully logged in!")

      // Redirect to artisan dashboard
      router.push("/artisian")
    } catch (error: any) {
      toast.error(error.message || "Login failed. Please check your credentials.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
          Email Address
        </label>
        <Input
          id="email"
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-muted border-border/50 text-foreground placeholder:text-muted-foreground focus:ring-primary focus:border-primary"
          required
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
          Password
        </label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="bg-muted border-border/50 text-foreground placeholder:text-muted-foreground focus:ring-primary focus:border-primary"
          required
        />
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2 h-auto transition-all"
      >
        {loading ? "Signing in..." : "Sign In"}
      </Button>
    </form>
  )
}

