'use client'

import { useEffect, useRef, useState } from 'react'
import { Radio } from 'lucide-react'

interface LivePlayerProps {
  hlsUrl: string | null | undefined
  isLive: boolean
}

export default function LivePlayer({ hlsUrl, isLive }: LivePlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!hlsUrl || !videoRef.current) return

    const video = videoRef.current

    // If the URL is a direct MP4 (recording), just set src
    if (hlsUrl.endsWith('.mp4')) {
      video.src = hlsUrl
      video.play().catch(() => {})
      return
    }

    // For HLS, try native support first (Safari), then use hls.js
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = hlsUrl
      video.play().catch(() => {})
    } else {
      // Dynamic import of hls.js
      import('hls.js').then(({ default: Hls }) => {
        if (!Hls.isSupported()) {
          setError(true)
          return
        }
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          liveSyncDurationCount: 1,
          liveMaxLatencyDurationCount: 3,
          liveDurationInfinity: true,
          highBufferWatchdogPeriod: 1,
        })
        hls.loadSource(hlsUrl)
        hls.attachMedia(video)
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => {})
        })
        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            setError(true)
          }
        })

        return () => {
          hls.destroy()
        }
      }).catch(() => {
        setError(true)
      })
    }
  }, [hlsUrl])

  if (!hlsUrl || error) {
    return (
      <div className="w-full aspect-video bg-slate-900 rounded-xl flex flex-col items-center justify-center text-slate-400 gap-3">
        <Radio className="w-12 h-12" />
        <p className="text-sm">
          {error ? 'Unable to load stream' : isLive ? 'Stream starting...' : 'No recording available'}
        </p>
      </div>
    )
  }

  return (
    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden">
      <video
        ref={videoRef}
        controls
        playsInline
        autoPlay
        muted={isLive}
        className="w-full h-full object-contain"
      />
      {isLive && (
        <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 animate-pulse">
          <span className="w-2 h-2 bg-white rounded-full" />
          LIVE
        </div>
      )}
    </div>
  )
}
