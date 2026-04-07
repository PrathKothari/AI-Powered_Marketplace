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
    const file = event.dataTransfer.files?.[0] ?? null
    handleFileChange(file)
  }

  const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
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
    <main className="min-h-screen bg-slate-50 px-4 py-10 md:px-8">
      <div className="mx-auto w-full max-w-3xl space-y-8">
        <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-bold">Detect Craft Origin</h1>
          <p className="mt-2 text-sm text-muted-foreground">Upload a craft image to identify its origin and technique</p>

          <div
            className="mt-6 rounded-xl border-dashed border border-border p-4 text-center transition hover:border-primary/70 hover:bg-slate-100"
            onDrop={onDrop}
            onDragOver={onDragOver}
          >
            <input
              type="file"
              accept="image/*"
              onChange={onInputChange}
              className="w-full cursor-pointer rounded-lg border border-border p-3"
            />
            <p className="mt-2 text-sm text-muted-foreground">Or drag and drop a file here</p>

            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="mt-4 mx-auto max-h-64 w-full rounded-lg object-contain"
              />
            ) : (
              <div className="mt-4 h-64 rounded-lg border border-dashed border-border bg-slate-100 flex items-center justify-center text-sm text-muted-foreground">
                Preview will appear here
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-col items-start gap-3">
            <button
              onClick={analyzeCraft}
              disabled={!selectedImage || loading}
              className="rounded-xl bg-primary px-4 py-2 font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-slate-100"
            >
              Find Similar Products
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold">Origin Detection Result</h2>

          {!result && !loading ? (
            <div className="mt-6 rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
              {selectedImage ? 'Click analyze to detect craft origin' : 'Upload an image to start'}
            </div>
          ) : null}

          {result ? (
            <div className="mt-6 rounded-xl border border-border bg-slate-50 p-5 shadow-sm">
              <div className="mb-3 text-sm text-muted-foreground">Region</div>
              <div className="mb-4 text-lg font-semibold">{result.region}</div>

              <div className="mb-3 text-sm text-muted-foreground">Craft Type</div>
              <div className="mb-4 text-lg font-semibold">{result.craftType}</div>

              <div className="mb-3 text-sm text-muted-foreground">Confidence</div>
              <div className="flex items-center gap-3">
                <div className="text-lg font-semibold">{result.confidence}%</div>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
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
