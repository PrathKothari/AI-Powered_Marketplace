'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Eye, Radio } from 'lucide-react'
import type { LiveSession } from '@/lib/api'

export default function LiveSessionCard({ session }: { session: LiveSession }) {
  const isLive = session.status === 'live'

  return (
    <Link href={`/live/${session.sessionId}`}>
      <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer group bg-white">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-slate-100">
          {session.thumbnailUrl ? (
            <img
              src={session.thumbnailUrl}
              alt={session.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300">
              <Radio className="w-10 h-10" />
            </div>
          )}

          {/* Status badge */}
          <div className="absolute top-2 left-2">
            {isLive ? (
              <Badge className="bg-red-500 text-white border-none gap-1.5 animate-pulse">
                <span className="w-2 h-2 bg-white rounded-full" />
                LIVE
              </Badge>
            ) : (
              <Badge className="bg-slate-700 text-white border-none">
                Replay
              </Badge>
            )}
          </div>

          {/* Viewer count */}
          {isLive && session.viewerCount > 0 && (
            <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {session.viewerCount}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4 space-y-1">
          <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
            {session.title}
          </h3>
          <p className="text-sm text-muted-foreground truncate">{session.userName}</p>
          {session.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">{session.description}</p>
          )}
        </div>
      </Card>
    </Link>
  )
}
