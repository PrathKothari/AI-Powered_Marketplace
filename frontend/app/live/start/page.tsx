'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { getMyListings, createLiveSession, endLiveSession, getUserProfile, type LiveSession } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { Video, ArrowLeft, Radio, Camera, CameraOff, AlertCircle, User } from 'lucide-react'
import Link from 'next/link'

const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8001/api/v1/live'

type Step = 'select-product' | 'details' | 'streaming'

export default function GoLivePageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    }>
      <GoLivePage />
    </Suspense>
  )
}

function GoLivePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()

  const [step, setStep] = useState<Step>('select-product')
  const [listings, setListings] = useState<any[]>([])
  const [loadingListings, setLoadingListings] = useState(true)
  const [hasBio, setHasBio] = useState(true)

  // Product selection
  const preselectedProductId = searchParams.get('productId') || ''
  const [selectedProductId, setSelectedProductId] = useState(preselectedProductId)

  // Session details
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  // Camera preview
  const videoPreviewRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState('')

  // Live session state
  const [session, setSession] = useState<LiveSession | null>(null)
  const [isStarting, setIsStarting] = useState(false)
  const [isEnding, setIsEnding] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)

  // Auth redirect
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  // Load user's listings
  useEffect(() => {
    if (!user) return
    getMyListings()
      .then(setListings)
      .finally(() => setLoadingListings(false))
  }, [user])

  // Check if user has bio
  useEffect(() => {
    if (!user) return
    getUserProfile(user.uid)
      .then(p => setHasBio(!!p.bio))
      .catch(() => {})
  }, [user])

  // Pre-select product if passed in URL
  useEffect(() => {
    if (preselectedProductId) {
      setSelectedProductId(preselectedProductId)
      setStep('details')
    }
  }, [preselectedProductId])

  // Attach stream to video element whenever it mounts/remounts
  useEffect(() => {
    if (streamRef.current && videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = streamRef.current
    }
  })

  // Start camera preview
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: true,
      })
      streamRef.current = mediaStream
      setCameraActive(true)
      setCameraError('')
    } catch (err: any) {
      setCameraError('Unable to access camera. Please allow camera permissions.')
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = null
    }
    setCameraActive(false)
  }

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopCamera()
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        recorderRef.current.stop()
      }
      wsRef.current?.close()
    }
  }, [])

  // Handle "Go Live"
  const handleGoLive = async () => {
    if (!selectedProductId || !title.trim()) {
      toast.error('Please select a product and enter a title')
      return
    }

    setIsStarting(true)
    try {
      // Create session via API
      const newSession = await createLiveSession({
        title: title.trim(),
        description: description.trim(),
        productId: selectedProductId,
      })
      setSession(newSession)

      // Open WebSocket for binary media chunks
      const ws = new WebSocket(`${WS_BASE}/ws/${newSession.sessionId}/stream`)
      ws.binaryType = 'arraybuffer'
      wsRef.current = ws

      ws.onopen = () => {
        // Start MediaRecorder to capture camera as webm chunks
        if (!streamRef.current) return

        const recorder = new MediaRecorder(streamRef.current, {
          mimeType: 'video/webm;codecs=vp8,opus',
          videoBitsPerSecond: 1_500_000,
        })
        recorderRef.current = recorder

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0 && ws.readyState === WebSocket.OPEN) {
            ws.send(event.data)
          }
        }

        // Send a chunk every 500ms for lower latency
        recorder.start(500)
      }

      ws.onerror = () => {
        toast.error('WebSocket connection failed')
      }

      setStep('streaming')
      toast.success('You are now live!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to start live session')
    } finally {
      setIsStarting(false)
    }
  }

  // Handle "End Stream"
  const handleEndStream = async () => {
    if (!session) return
    setIsEnding(true)
    try {
      // Stop recording first so FFmpeg gets the final chunks
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        recorderRef.current.stop()
      }
      // Small delay to let the last chunk flush to the WebSocket
      await new Promise(r => setTimeout(r, 500))
      wsRef.current?.close()
      await endLiveSession(session.sessionId)
      stopCamera()
      toast.success('Live session ended. Recording will be saved.')
      router.push(`/live/${session.sessionId}`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to end session')
    } finally {
      setIsEnding(false)
    }
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const selectedProduct = listings.find(l => l.productId === selectedProductId)

  // ── STREAMING VIEW ──
  if (step === 'streaming' && session) {
    return (
      <main className="min-h-screen bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-2 bg-red-500 text-white text-sm font-bold px-3 py-1.5 rounded-full animate-pulse">
                <span className="w-2 h-2 bg-white rounded-full" /> LIVE
              </span>
              <span className="text-sm text-slate-300">{session.title}</span>
            </div>
            <Button
              variant="destructive"
              onClick={handleEndStream}
              disabled={isEnding}
            >
              {isEnding ? 'Ending...' : 'End Stream'}
            </Button>
          </div>

          {/* Camera feed */}
          <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
            <video
              ref={videoPreviewRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          </div>

          {/* Selected product */}
          {selectedProduct && (
            <div className="bg-slate-800 rounded-xl p-4 flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-700 flex-shrink-0">
                {selectedProduct.images?.[0] && (
                  <img src={selectedProduct.images[0]} alt="" className="w-full h-full object-cover" />
                )}
              </div>
              <div>
                <p className="font-semibold">{selectedProduct.title}</p>
                <p className="text-primary font-bold">&#8377;{selectedProduct.price}</p>
              </div>
            </div>
          )}

          <p className="text-xs text-slate-400 text-center">
            Viewers can watch at <span className="text-slate-300">/live/{session.sessionId}</span>
          </p>
        </div>
      </main>
    )
  }

  // ── SETUP VIEWS ──
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <Link href="/live" className="inline-flex items-center text-sm text-slate-500 hover:text-primary mb-2">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Live
          </Link>
          <h1 className="text-3xl font-outfit font-bold uppercase text-foreground flex items-center gap-3">
            <Video className="w-7 h-7 text-primary" />
            Go Live
          </h1>
          <p className="text-muted-foreground mt-1">Showcase your craft and sell to your audience in real-time</p>
        </div>

        {/* Bio prompt */}
        {!hasBio && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <User className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">Add a bio to let viewers know about you</p>
              <Link href="/profile" className="text-xs text-amber-600 hover:underline">
                Complete your profile &rarr;
              </Link>
            </div>
          </div>
        )}

        {/* Step 1: Select Product */}
        {step === 'select-product' && (
          <Card className="p-6 bg-white space-y-4">
            <h2 className="font-bold text-foreground text-lg">Which product are you showcasing?</h2>

            {loadingListings ? (
              <div className="flex justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : listings.length === 0 ? (
              <div className="text-center py-8 space-y-3">
                <AlertCircle className="w-10 h-10 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground">You don't have any listed products yet.</p>
                <Button onClick={() => router.push('/sell?returnTo=live')}>
                  List a Product First
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {listings.map(product => (
                  <button
                    key={product.productId}
                    onClick={() => setSelectedProductId(product.productId)}
                    className={`w-full flex items-center gap-4 p-3 rounded-xl border-2 transition-colors text-left ${
                      selectedProductId === product.productId
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <div className="w-14 h-14 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                      {product.images?.[0] && (
                        <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{product.title}</p>
                      <p className="text-xs text-muted-foreground">{product.craftType} &middot; {product.region}</p>
                    </div>
                    <p className="text-primary font-bold flex-shrink-0">&#8377;{product.price}</p>
                  </button>
                ))}
              </div>
            )}

            {listings.length > 0 && (
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => router.push('/sell?returnTo=live')}
                  className="text-sm"
                >
                  List a New Product
                </Button>
                <Button
                  onClick={() => setStep('details')}
                  disabled={!selectedProductId}
                >
                  Next
                </Button>
              </div>
            )}
          </Card>
        )}

        {/* Step 2: Session Details + Camera */}
        {step === 'details' && (
          <Card className="p-6 bg-white space-y-6">
            <h2 className="font-bold text-foreground text-lg">Session Details</h2>

            {/* Selected product preview */}
            {selectedProduct && (
              <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                  {selectedProduct.images?.[0] && (
                    <img src={selectedProduct.images[0]} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{selectedProduct.title}</p>
                  <p className="text-xs text-muted-foreground">&#8377;{selectedProduct.price}</p>
                </div>
                <button
                  onClick={() => { setStep('select-product'); setSelectedProductId('') }}
                  className="text-xs text-primary hover:underline"
                >
                  Change
                </button>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Stream Title <span className="text-red-500">*</span></label>
                <Input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="E.g., Making a Madhubani painting live"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Tell viewers what you'll be creating..."
                  className="w-full border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 border rounded-md resize-y min-h-[80px]"
                />
              </div>
            </div>

            {/* Camera Preview */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-foreground">Camera Preview</label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={cameraActive ? stopCamera : startCamera}
                  className="gap-2"
                >
                  {cameraActive ? (
                    <><CameraOff className="w-4 h-4" /> Stop Camera</>
                  ) : (
                    <><Camera className="w-4 h-4" /> Start Camera</>
                  )}
                </Button>
              </div>

              <div className="aspect-video bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center">
                {cameraActive ? (
                  <video
                    ref={videoPreviewRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-slate-400 text-center space-y-2">
                    <Camera className="w-10 h-10 mx-auto" />
                    <p className="text-sm">{cameraError || 'Click "Start Camera" to preview'}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <Button variant="outline" onClick={() => setStep('select-product')}>
                Back
              </Button>
              <Button
                onClick={handleGoLive}
                disabled={isStarting || !title.trim() || !cameraActive}
                className="gap-2 bg-red-500 hover:bg-red-600"
              >
                {isStarting ? (
                  <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Starting...</>
                ) : (
                  <><Radio className="w-4 h-4" /> Go Live</>
                )}
              </Button>
            </div>
          </Card>
        )}
      </div>
    </main>
  )
}
