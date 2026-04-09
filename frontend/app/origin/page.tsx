'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UploadCloud, Loader2, ExternalLink, Sparkles, MapPin, Palette, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1'

interface MatchedProduct {
  productId: string
  title: string
  price: number
  craftType: string
  region: string
  images: string[]
  description: string
  designer?: string
  similarity: number
}

interface AnalysisResult {
  analysis: string
  matchedProducts: MatchedProduct[]
  hasMatch: boolean
}

export default function OriginDetectionPage() {
  const router = useRouter()
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)

  const handleFileChange = (file: File | null) => {
    setSelectedImage(file)
    setResult(null)
    if (file) {
      setPreviewUrl(URL.createObjectURL(file))
    } else {
      setPreviewUrl('')
    }
  }

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileChange(e.target.files?.[0] ?? null)
  }

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    handleFileChange(e.dataTransfer.files?.[0] ?? null)
  }

  const analyzeCraft = async () => {
    if (!selectedImage) return
    setLoading(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('image', selectedImage)

      const resp = await fetch(`${API}/discovery/analyze-craft`, {
        method: 'POST',
        body: formData,
      })

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}))
        throw new Error(err.detail || 'Analysis failed')
      }

      const data: AnalysisResult = await resp.json()
      setResult(data)

      if (data.hasMatch) {
        toast.success(`Found ${data.matchedProducts.length} matching product${data.matchedProducts.length > 1 ? 's' : ''}!`)
      } else {
        toast.info('No exact match found, but we analyzed the craft for you.')
      }
    } catch (err: any) {
      toast.error(err.message || 'Analysis failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 md:px-8">
      <div className="mx-auto w-full max-w-3xl space-y-8">

        {/* Upload Section */}
        <Card className="p-6 shadow-sm">
          <h1 className="text-3xl font-bold">Detect Craft Origin</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Upload a craft image to identify its origin, technique, and find similar products
          </p>

          <div className="mt-4 relative group">
            <div
              onDrop={onDrop}
              onDragOver={(e) => e.preventDefault()}
              className="flex flex-col items-center justify-center w-full min-h-[120px] px-4 py-4 border-2 border-dashed border-border rounded-xl bg-muted/20 hover:bg-muted/40 hover:border-primary/50 transition-all duration-300 cursor-pointer text-center"
            >
              <div className="w-10 h-10 bg-primary/5 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300">
                <UploadCloud className="w-5 h-5 text-primary/60 group-hover:text-primary transition-colors" />
              </div>
              <p className="text-lg font-semibold text-foreground">
                {selectedImage ? selectedImage.name : 'Click to upload your craft'}
              </p>
              <p className="text-sm text-muted-foreground">Or simply drag and drop your image here</p>
              <p className="text-xs text-muted-foreground/60">Supports JPG, PNG, WEBP (Max 10MB)</p>
              <input
                type="file"
                accept="image/*"
                onChange={onInputChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
            </div>

            {previewUrl ? (
              <div className="mt-6 rounded-2xl overflow-hidden border border-border bg-slate-100 shadow-inner">
                <img src={previewUrl} alt="Preview" className="w-full max-h-80 object-contain mx-auto" />
              </div>
            ) : (
              <div className="mt-6 h-40 rounded-xl border border-dashed border-border/50 bg-slate-50/50 flex flex-col items-center justify-center text-sm text-muted-foreground italic">
                <p>Preview will appear here after upload</p>
              </div>
            )}
          </div>

          <div className="mt-6">
            <Button
              onClick={analyzeCraft}
              disabled={!selectedImage || loading}
              className="h-12 px-8 text-base font-bold gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Analyze Craft
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Loading State */}
        {loading && (
          <Card className="p-10 text-center shadow-sm">
            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
            <p className="font-semibold text-slate-700">Analyzing your craft image...</p>
            <p className="text-sm text-muted-foreground mt-1">Searching through the catalog and consulting AI</p>
          </Card>
        )}

        {/* Results */}
        {result && !loading && (
          <>
            {/* AI Analysis */}
            <Card className="p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">Craft Analysis</h2>
              </div>
              <div className="prose prose-slate max-w-none prose-headings:text-lg prose-p:text-sm prose-p:leading-relaxed prose-strong:text-slate-800 prose-li:text-sm">
                <ReactMarkdown>{result.analysis}</ReactMarkdown>
              </div>
            </Card>

            {/* Matched Products */}
            {result.hasMatch && (
              <Card className="p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-emerald-50 rounded-lg">
                    <Palette className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Matching Products</h2>
                    <p className="text-sm text-muted-foreground">Found in our marketplace catalog</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {result.matchedProducts.map((product) => (
                    <Link key={product.productId} href={`/product/${product.productId}`} className="block">
                      <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-border bg-slate-50/50 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer">
                        <div className="w-full sm:w-32 h-32 rounded-lg overflow-hidden bg-slate-200 flex-shrink-0">
                          {product.images?.[0] ? (
                            <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">No image</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-bold text-slate-800 text-lg">{product.title}</h3>
                            <Badge className="bg-emerald-100 text-emerald-700 border-none flex-shrink-0">
                              {Math.round(product.similarity * 100)}% match
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-muted-foreground">
                            {product.craftType && (
                              <span className="flex items-center gap-1"><Palette className="w-3.5 h-3.5" />{product.craftType}</span>
                            )}
                            {product.region && (
                              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{product.region}</span>
                            )}
                            {product.designer && (
                              <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{product.designer}</span>
                            )}
                          </div>
                          {product.description && (
                            <p className="text-sm text-slate-500 mt-2 line-clamp-2">{product.description}</p>
                          )}
                          <div className="flex items-center justify-between mt-3">
                            {product.price > 0 ? (
                              <span className="text-xl font-bold text-primary">₹{product.price}</span>
                            ) : (
                              <span className="text-sm text-muted-foreground italic">Catalog reference</span>
                            )}
                            <Button size="sm" variant="outline" className="gap-1.5">
                              View Product <ExternalLink className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </Card>
            )}

            {/* No Match */}
            {!result.hasMatch && (
              <Card className="p-6 shadow-sm text-center">
                <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Palette className="w-7 h-7 text-amber-500" />
                </div>
                <h3 className="font-bold text-lg text-slate-800">No Exact Match Found</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                  We could not find this exact craft in our catalog, but you can explore similar Indian artworks in our marketplace.
                </p>
                <Button onClick={() => router.push('/marketplace')} className="mt-4 gap-2">
                  Explore Marketplace <ExternalLink className="w-4 h-4" />
                </Button>
              </Card>
            )}
          </>
        )}

        {/* Empty state */}
        {!result && !loading && (
          <Card className="p-6 shadow-sm">
            <h2 className="text-2xl font-bold">Origin Detection Result</h2>
            <div className="mt-6 rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
              {selectedImage ? 'Click Analyze Craft to detect origin' : 'Upload an image to start'}
            </div>
          </Card>
        )}
      </div>
    </main>
  )
}
