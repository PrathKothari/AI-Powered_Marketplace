'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { getLiveSession, type LiveSession } from '@/lib/api'
import LivePlayer from '@/components/live/LivePlayer'
import LiveChat from '@/components/live/LiveChat'
import FeaturedProduct from '@/components/live/FeaturedProduct'
import SellerBio from '@/components/SellerBio'
import { ArrowLeft, Eye } from 'lucide-react'
import Link from 'next/link'

export default function WatchLivePage() {
  const params = useParams()
  const sessionId = params.id as string

  const [session, setSession] = useState<LiveSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!sessionId) return
    getLiveSession(sessionId)
      .then(setSession)
      .catch((err) => setError(err.message || 'Session not found'))
      .finally(() => setLoading(false))
  }, [sessionId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-bold text-foreground">Session not found</h2>
          <p className="text-muted-foreground">{error || 'This live session does not exist.'}</p>
          <Link href="/live" className="text-primary hover:underline text-sm">
            Back to Live Sessions
          </Link>
        </div>
      </div>
    )
  }

  const isLive = session.status === 'live'
  // HLS is mounted at /hls/ on the server root, not under /api/v1
  const serverBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1').replace(/\/api\/v1$/, '')
  const hlsUrl = isLive
    ? `${serverBase}${session.hlsUrl}`
    : session.recordingUrl || session.hlsUrl

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Back link + title */}
        <div className="flex items-center gap-4">
          <Link href="/live" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-foreground truncate">{session.title}</h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>{session.userName}</span>
              {isLive && (
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" /> {session.viewerCount} watching
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Main layout: Video + Chat side by side on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video + Product */}
          <div className="lg:col-span-2 space-y-4">
            <LivePlayer hlsUrl={hlsUrl} isLive={isLive} />

            {session.description && (
              <p className="text-sm text-muted-foreground">{session.description}</p>
            )}

            {/* Featured Product */}
            <FeaturedProduct productId={session.productId} />

            {/* Seller Bio */}
            <SellerBio userId={session.userId} userName={session.userName} />
          </div>

          {/* Chat */}
          <div className="lg:col-span-1 h-[500px] lg:h-auto lg:min-h-[600px]">
            <LiveChat
              sessionId={session.sessionId}
              isLive={isLive}
              initialMessages={session.recentMessages || []}
            />
          </div>
        </div>
      </div>
    </main>
  )
}
