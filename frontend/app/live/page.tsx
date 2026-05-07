'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getLiveSessions, type LiveSession } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import LiveSessionCard from '@/components/live/LiveSessionCard'
import Navbar from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Radio, Video } from 'lucide-react'

export default function LivePage() {
  const router = useRouter()
  const { user } = useAuth()
  const [sessions, setSessions] = useState<LiveSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getLiveSessions()
      .then(setSessions)
      .finally(() => setLoading(false))
  }, [])

  const liveSessions = sessions.filter(s => s.status === 'live')
  const replaySessions = sessions.filter(s => s.status === 'ended')

  return (
    <>
    <Navbar />
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-outfit font-bold uppercase text-foreground flex items-center gap-3">
              <Radio className="w-7 h-7 text-red-500" />
              Live Sessions
            </h1>
            <p className="text-muted-foreground mt-1">Watch artisans create their craft live and buy directly</p>
          </div>
          {user && (
            <Button onClick={() => router.push('/live/start')} className="gap-2">
              <Video className="w-4 h-4" /> Go Live
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <div className="w-20 h-20 mx-auto bg-slate-100 rounded-full flex items-center justify-center">
              <Radio className="w-10 h-10 text-slate-300" />
            </div>
            <h2 className="text-xl font-semibold text-slate-600">No live sessions yet</h2>
            <p className="text-muted-foreground">Be the first to go live and showcase your art!</p>
            {user && (
              <Button onClick={() => router.push('/live/start')} className="gap-2 mt-4">
                <Video className="w-4 h-4" /> Start a Live Session
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Live Now */}
            {liveSessions.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                  Live Now
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {liveSessions.map(session => (
                    <LiveSessionCard key={session.sessionId} session={session} />
                  ))}
                </div>
              </section>
            )}

            {/* Replays */}
            {replaySessions.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-foreground mb-4">Recent Replays</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {replaySessions.map(session => (
                    <LiveSessionCard key={session.sessionId} session={session} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
    </>
  )
}
