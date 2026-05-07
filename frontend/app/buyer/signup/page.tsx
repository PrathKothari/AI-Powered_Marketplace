"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { fetchApi, setAuthToken } from "@/lib/api"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import Link from "next/link"

export default function BuyerSignupPage() {
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            // 1. Hit the signup API
            await fetchApi<{ uid: string }>("/auth/signup", {
                data: { email, password, name, role: "buyer" },
            })

            toast.success("Account created successfully! Logging you in...")

            // 2. Automatically log them in after signup gets the ID Token from Firebase
            const loginResponse = await fetchApi<{ access_token: string }>("/auth/login", {
                data: { email, password },
            })

            setAuthToken(loginResponse.access_token)

            // Redirect to buyer page
            router.push("/buyer")
        } catch (error: any) {
            toast.error(error.message || "Failed to create account")
        } finally {
            setIsLoading(false)
        }
    }

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
                        <h1 className="text-4xl font-serif text-foreground text-pretty font-bold">Create Account</h1>
                        <CardDescription className="text-base text-muted-foreground">
                            Sign up as a buyer to support authentic artisans
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label htmlFor="name" className="text-sm font-bold text-foreground">
                                    Full Name
                                </label>
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="Jane Doe"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="bg-input border-border/60 text-foreground placeholder:text-muted-foreground"
                                    required
                                />
                            </div>

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
                                    minLength={6}
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-bold transition-colors mt-2"
                            >
                                {isLoading ? "Creating Account..." : "Sign Up"}
                            </Button>

                            <div className="pt-4 border-t border-border/30 mt-6">
                                <p className="text-center text-sm text-muted-foreground">
                                    Already have an account?{" "}
                                    <Link href="/buyer/login" className="text-primary hover:underline font-bold">
                                        Log in here
                                    </Link>
                                </p>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </main>
    )
}
