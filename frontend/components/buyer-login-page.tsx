"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import LoginForm from "./login-form"




export function BuyerLoginPage() {
  const [loginMethod, setLoginMethod] = useState<"email" | "google" | null>(null)

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo and Platform Name */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground text-lg font-semibold">A</span>
            </div>
            <span className="text-2xl font-serif text-foreground font-bold">Artisan</span>
          </div>
          <p className="text-sm text-muted-foreground">Discover Authentic Handmade Crafts</p>
        </div>

        {/* Main Card */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="space-y-2 pb-6">
            <h1 className="text-4xl font-serif text-foreground text-pretty font-bold">Welcome, Explorer</h1>
            <CardDescription className="text-base text-muted-foreground">
              Sign in to discover authentic handmade crafts
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {!loginMethod ? (
              <>
                {/* Login Method Selection */}
                <div className="space-y-3">
                  <Button
                    onClick={() => setLoginMethod("email")}
                    variant="outline"
                    className="w-full h-12 border-border/60 hover:bg-muted/50 text-foreground font-semibold"
                  >
                    Continue with Email
                  </Button>

                  <Button
                    onClick={() => setLoginMethod("google")}
                    variant="outline"
                    className="w-full h-12 border-border/60 hover:bg-muted/50 text-foreground flex items-center justify-center gap-2 font-semibold"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="1" />
                      <path d="M12 7v10" />
                      <path d="M7 12h10" />
                    </svg>
                    Continue with Google
                  </Button>
                </div>

                {/* Helper Text */}
                <p className="text-center text-sm text-muted-foreground leading-relaxed">
                  Your account helps us personalize your discovery experience
                </p>
              </>
            ) : (
              <LoginForm method={loginMethod} onBack={() => setLoginMethod(null)} />
            )}

            {/* Sign Up Link */}
            {!loginMethod && (
              <div className="pt-4 border-t border-border/30">
                <p className="text-center text-sm text-muted-foreground">
                  New here? <button className="text-primary hover:underline font-bold">Create a Buyer Account</button>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Decorative Elements */}
        <div className="mt-8 flex justify-center gap-2 opacity-30">
          <div className="w-1.5 h-1.5 rounded-full bg-accent" />
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          <div className="w-1.5 h-1.5 rounded-full bg-accent" />
        </div>
      </div>
    </main>
  )
}
