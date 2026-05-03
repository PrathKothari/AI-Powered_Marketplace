'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type OriginResult = {
  region: string
  craftType: string
  confidence: number
}

export default function OriginDetectionPage() {
  const router = useRouter()
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [isDragging, setIsDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<OriginResult | null>(null)

  const handleFileChange = (file: File | null) => {
    setSelectedImage(file)
    setResult(null)

    if (file) {
      setPreviewUrl(URL.createObjectURL(file))
    } else {
      setPreviewUrl('')
    }
  }

  const onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    handleFileChange(file)
  }

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
    const file = event.dataTransfer.files?.[0] ?? null
    handleFileChange(file)
  }

  const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(true)
  }

  const onDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
  }

  const analyzeCraft = async () => {
    if (!selectedImage) return

    setLoading(true)
    setResult(null)

    await new Promise((resolve) => setTimeout(resolve, 2000))

    setResult({
      region: 'Rajasthan, India',
      craftType: 'Handwoven Textile',
      confidence: 92,
    })

    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-background px-4 py-10 md:px-8">
      <div className="mx-auto w-full max-w-3xl space-y-8 fade-in-up">
        <section className="surface-panel p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-4xl font-black text-foreground">Detect Craft Origin</h1>
              <p className="mt-2 text-base text-muted-foreground">Upload a craft image to identify its origin and technique</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/50 bg-accent/10 px-4 py-2 text-sm font-semibold text-accent">
              AI-powered insight for handmade goods
            </div>
          </div>

          <div
            className={`mt-6 upload-dropzone p-6 text-center ${isDragging ? 'upload-dropzone-active' : ''}`}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
          >
            <input
              type="file"
              accept="image/*"
              onChange={onInputChange}
              className="w-full cursor-pointer rounded-2xl border border-border bg-white p-4 shadow-sm"
            />
            <p className="mt-3 text-sm text-muted-foreground">Or drag and drop a file here</p>

            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="mt-6 mx-auto max-h-64 w-full rounded-3xl object-contain shadow-inner preview-appear"
              />
            ) : (
              <div className="mt-6 h-64 rounded-3xl border border-dashed border-border bg-card/80 flex items-center justify-center px-6 text-sm text-muted-foreground">
                Preview will appear here
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <button
              onClick={analyzeCraft}
              disabled={!selectedImage || loading}
              className="btn btn-primary-modern rounded-3xl px-6 py-3 font-semibold text-white transition hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Analyzing...
                </span>
              ) : (
                'Analyze Craft'
              )}
            </button>

            <button
              onClick={() => router.push('/discover')}
              className="btn-secondary-modern rounded-3xl px-5 py-3 text-sm font-semibold"
            >
              Find Similar Products
            </button>
          </div>
        </section>

        <section className="surface-panel p-8">
          <h2 className="text-3xl font-bold text-foreground">Origin Detection Result</h2>

          {!result && !loading ? (
            <div className="mt-6 rounded-3xl border border-dashed border-border p-8 text-center text-muted-foreground">
              {selectedImage ? 'Click analyze to detect craft origin' : 'Upload an image to start'}
            </div>
          ) : null}

          {result ? (
            <div className="mt-6 rounded-3xl border border-border bg-card/80 p-6 shadow-sm transition-transform duration-300 hover:-translate-y-1">
              <div className="mb-3 text-sm uppercase tracking-[0.15em] text-muted-foreground">Region</div>
              <div className="mb-4 text-2xl font-semibold text-foreground">{result.region}</div>

              <div className="mb-3 text-sm uppercase tracking-[0.15em] text-muted-foreground">Craft Type</div>
              <div className="mb-4 text-2xl font-semibold text-foreground">{result.craftType}</div>

              <div className="mb-3 text-sm uppercase tracking-[0.15em] text-muted-foreground">Confidence</div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="text-2xl font-semibold text-foreground">{result.confidence}%</div>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${result.confidence}%` }} />
                </div>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  )
}
