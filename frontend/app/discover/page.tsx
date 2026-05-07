'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PRODUCTS } from '@/lib/mock-data/products'
import { Product } from '@/lib/types/product'
import ProductCard from '@/components/product-card'

export default function DiscoverPage() {
  const router = useRouter()
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [results, setResults] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isWhatsappMode, setIsWhatsappMode] = useState(false)

  const handleFileChange = (file: File | null) => {
    setSelectedImage(file)

    if (file) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
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

  // Placeholder for future API integration
  async function fetchSimilarProducts(image: File) {
    // future: replace with AI API
    // const formData = new FormData();
    // formData.append('image', image);
    // return await fetch('/api/ai/discover', { method: 'POST', body: formData });
    
    // Default Mock implementation:
    const lowerName = image.name.toLowerCase()
    return PRODUCTS.filter(p => {
      const mockSearchMatches = (lowerName.includes('basket') && p.name.toLowerCase().includes('basket')) 
                                    || (lowerName.includes('mug') && p.name.toLowerCase().includes('mug'))
      return mockSearchMatches;
    })
  }

  const handleSearch = async () => {
    if (!selectedImage) return

    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 800)) // Artificial AI delay

    const lowerName = selectedImage.name.toLowerCase()
    let filtered: Product[] = []
    
    if (lowerName.includes('basket')) {
      filtered = PRODUCTS.filter((p) => p.name.toLowerCase().includes('basket'))
    } else if (lowerName.includes('mug')) {
      filtered = PRODUCTS.filter((p) => p.name.toLowerCase().includes('mug'))
    } else {
      // Random matching if no keyword applies
      filtered = [...PRODUCTS].sort(() => Math.random() - 0.5)
    }

    setResults(filtered.slice(0, Math.min(4, filtered.length)))
    setIsLoading(false)
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 md:px-8">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-bold">Discover Crafts Using AI</h1>
          <p className="mt-2 text-sm text-muted-foreground">Upload a photo to find similar handmade products</p>

          <div className="mt-4 flex gap-4">
            <button
              onClick={() => setIsWhatsappMode(!isWhatsappMode)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${isWhatsappMode ? 'bg-[#25D366] text-white hover:bg-[#1ebd5b]' : 'border border-border hover:bg-slate-50'}`}
            >
              Upload via WhatsApp
            </button>
          </div>

          {isWhatsappMode && (
            <div className="mt-4 p-3 bg-green-50 text-green-800 rounded-lg text-sm border border-green-200">
              <p>📱 Simulating WhatsApp input: Try uploading a photo directly from your gallery below.</p>
            </div>
          )}

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div
              className={`rounded-xl border border-dashed border-border p-4 text-center ${isWhatsappMode ? 'bg-green-50/50' : ''}`}
              onDrop={onDrop}
              onDragOver={onDragOver}
            >
              <input
                type="file"
                accept="image/*"
                onChange={onInputChange}
                className="w-full cursor-pointer rounded-lg border border-border p-3"
              />
              <p className="mt-2 text-sm text-muted-foreground">Or drag and drop an image here</p>

              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="mt-4 w-full max-h-56 rounded-lg object-contain"
                />
              ) : (
                <div className="mt-4 h-56 rounded-lg border border-dashed border-border bg-slate-100 flex items-center justify-center text-sm text-muted-foreground">
                  Preview will appear here
                </div>
              )}
            </div>

            <div className="flex flex-col justify-center gap-4">
              <button
                onClick={handleSearch}
                disabled={!selectedImage || isLoading}
                className="rounded-xl bg-primary px-4 py-3 font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Analyzing Image with AI...
                  </span>
                ) : (
                  'Find Similar Products'
                )}
              </button>

              <p className="text-sm text-muted-foreground">
                Tip: use a clear photo with product details for better matching.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold">Similar Products</h2>
              <span className="px-2 py-1 text-xs font-semibold bg-purple-100 text-purple-800 rounded-md border border-purple-200">
                ✨ AI Results
              </span>
            </div>
            
            <button
              onClick={() => router.push('/marketplace')}
              className="rounded-lg border border-border px-3 py-1 text-sm hover:bg-slate-100"
            >
              Go to Marketplace
            </button>
          </div>

          {isLoading ? (
            <div className="mt-6 rounded-lg border border-dashed border-border p-12 text-center text-muted-foreground">
              Processing your image into craft signatures... please wait
            </div>
          ) : results.length === 0 ? (
            <div className="mt-6 rounded-lg border border-dashed border-border p-12 text-center text-muted-foreground">
              {selectedImage ? 'No exact similar crafts found matching your exact snapshot.' : 'Upload an image above to trigger the AI search.'}
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((product) => (
                <div key={product.id} className="cursor-pointer hover:ring-2 hover:ring-primary hover:rounded-xl transition flex flex-col h-full" onClick={() => router.push(`/product/${product.id}`)}>
                  <div className="pointer-events-none flex-1">
                    <ProductCard product={product} onDeleteAction={() => undefined} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
