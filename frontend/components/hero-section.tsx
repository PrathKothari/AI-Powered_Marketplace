'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, ShoppingBag, Sparkles, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function HeroSection() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-[#fdfcf8] py-12 md:py-24">
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full opacity-30 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent/5 blur-[120px]" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left Content Column */}
          <div className={cn(
            "flex flex-col gap-8 transition-all duration-1000",
            isMounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}>
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-xs font-bold text-primary shadow-sm animate-bounce-subtle">
                <Sparkles className="w-3.5 h-3.5" />
                <span>The Home of Craftsmanship</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-7xl font-black text-slate-900 leading-[1.1] tracking-tight">
                Crafting <span className="text-primary italic">Stories</span>, <br />
                One Piece at a Time.
              </h1>

              <p className="text-lg md:text-xl text-slate-500 max-w-xl leading-relaxed font-medium">
                Explore a curated collection of handmade treasures from independent artisans worldwide. Authenticity in every stitch, fold, and fire.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                asChild
                size="lg"
                className="h-14 px-8 rounded-2xl bg-slate-900 hover:bg-primary text-white shadow-xl shadow-slate-900/10 transition-all duration-500 hover:scale-105 active:scale-95 group font-bold"
              >
                <Link href="/marketplace" className="flex items-center gap-2">
                  Shop Collection
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-14 px-8 rounded-2xl border-2 border-slate-200 hover:border-primary hover:text-primary transition-all duration-300 font-bold"
              >
                <Link href="/register?role=artisan">Join as Artisan</Link>
              </Button>
            </div>

            <div className="flex items-center gap-6 mt-4 pt-6 border-t border-slate-100">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 ring-2 ring-slate-50 flex items-center justify-center text-[10px] font-bold text-slate-400 overflow-hidden">
                    <img src={`https://i.pravatar.cc/100?u=${i}`} alt="user" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-1 text-amber-500">
                  {[1, 2, 3, 4, 5].map((i) => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
                </div>
                <p className="text-xs text-slate-500 font-bold">Trusted by 10k+ craft lovers</p>
              </div>
            </div>
          </div>

          {/* Right Visual Column */}
          <div className={cn(
            "relative transition-all duration-1000 delay-300",
            isMounted ? "opacity-100 translate-x-0" : "opacity-0 translate-x-12"
          )}>
            <div className="relative z-10 rounded-[3rem] overflow-hidden shadow-2xl shadow-slate-900/20 group border-8 border-white">
              <img
                src="/artisan_workshop_hero.png"
                alt="Artisan Workshop"
                className="w-full aspect-[4/5] object-cover transition-transform duration-1000 group-hover:scale-110"
              />

              {/* Floating Overlay Card */}
              <div className="absolute bottom-8 left-8 right-8 p-6 glass-card rounded-2xl border border-white/20 shadow-xl backdrop-blur-md bg-white/10 group-hover:-translate-y-2 transition-transform duration-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-white/70 uppercase tracking-widest mb-1">Featured Craft</p>
                    <h3 className="text-xl font-bold text-white tracking-tight">Hand-Thrown Ceramic Vase</h3>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md transition-colors group-hover:bg-primary">
                    <ShoppingBag className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative blur elements */}
            <div className="absolute -top-12 -right-12 w-64 h-64 bg-accent/10 rounded-full blur-[80px] -z-10 animate-pulse" />
            <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -z-10" />

            {/* Experience Badge */}
            <div className="absolute -top-6 -left-6 h-24 w-24 rounded-full bg-white shadow-xl flex flex-col items-center justify-center p-2 z-20 animate-spin-slow">
              <span className="text-lg font-black text-slate-900">100%</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase leading-none">Organic</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
