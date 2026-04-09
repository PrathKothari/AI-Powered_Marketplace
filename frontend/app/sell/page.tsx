'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { createListing } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

export default function SellPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successData, setSuccessData] = useState<any>(null)

  const [formData, setFormData] = useState({
    title: '',
    price: '',
    description: '',
    craftType: '',
    region: '',
    materials: '',
    images: '',
    storyVideo: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast.error('Please sign in to list a product')
      router.push('/login')
      return
    }
    setIsSubmitting(true)
    try {
      const images = formData.images.split(',').map(s => s.trim()).filter(Boolean)
      const product = await createListing({
        title: formData.title,
        price: parseFloat(formData.price),
        description: formData.description,
        craftType: formData.craftType,
        region: formData.region,
        materials: formData.materials,
        images,
        storyVideo: formData.storyVideo,
      })
      setSuccessData(product)
      toast.success('Product listed successfully!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to list product')
    } finally {
      setIsSubmitting(false)
    }
  }

  const downloadQR = () => {
    const svg = document.getElementById('qr-code-svg') as any
    if (!svg) return
    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      if (ctx) {
        ctx.fillStyle = 'white'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0)
      }
      const link = document.createElement('a')
      link.download = `product-qr-${successData.productId}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }

  if (successData) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10 flex flex-col items-center justify-center">
        <Card className="max-w-md w-full rounded-2xl shadow-xl p-8 space-y-8 text-center border-t-8 border-t-primary">
          <div className="space-y-2">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-foreground">Product Listed!</h2>
            <p className="text-muted-foreground">Your painting is now live on KalaSetu.</p>
          </div>

          <div className="p-6 border-2 border-primary/20 bg-primary/5 rounded-xl shadow-inner">
            <h3 className="font-bold text-lg mb-4 text-foreground">Digital Authenticity Card</h3>
            <div className="flex justify-center bg-white p-4 rounded-xl shadow-md mx-auto">
              <QRCodeSVG id="qr-code-svg" value={`http://localhost:3001/product/${successData.productId}`} size={180} level="H" />
            </div>
            <p className="mt-4 text-sm text-primary font-semibold uppercase tracking-wider">Scan to verify authenticity</p>
            <div className="mt-4 text-left space-y-2 text-sm bg-white/60 p-4 rounded-lg">
              <div className="flex justify-between border-b border-black/5 pb-2">
                <span className="text-muted-foreground">Product ID</span>
                <span className="font-mono font-medium text-xs">{successData.productId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Listed by</span>
                <span className="font-medium">{user?.name}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button onClick={downloadQR} variant="outline" className="w-full py-6 border-primary text-primary hover:bg-primary/5">
              Download QR Code
            </Button>
            <Button onClick={() => router.push(`/product/${successData.productId}`)} className="w-full py-6">
              View Product Page
            </Button>
            <Button onClick={() => router.push('/dashboard')} variant="ghost" className="w-full">
              Go to Dashboard
            </Button>
          </div>
        </Card>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">List a Painting</h1>
          <p className="text-muted-foreground mt-2">Share your handcrafted artwork with buyers on KalaSetu.</p>
        </div>

        <Card className="rounded-xl shadow-sm border-border overflow-hidden">
          <form className="p-6 sm:p-8 space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-foreground">Painting Name</label>
                <Input required name="title" placeholder="E.g., Madhubani Village Scene" value={formData.title} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Price (₹)</label>
                <Input required type="number" min="1" step="1" name="price" placeholder="1200" value={formData.price} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Craft Type</label>
                <Input required name="craftType" placeholder="E.g., Madhubani, Warli, Pattachitra" value={formData.craftType} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Region / Origin</label>
                <Input required name="region" placeholder="E.g., Bihar, Maharashtra" value={formData.region} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Materials Used</label>
                <Input name="materials" placeholder="E.g., Natural dyes, handmade paper" value={formData.materials} onChange={handleChange} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-foreground">Description</label>
                <textarea
                  required
                  name="description"
                  placeholder="Describe the artwork, its significance, and the process..."
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border rounded-md resize-y min-h-[100px]"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-foreground">Image URLs</label>
                <Input name="images" placeholder="Comma-separated image URLs" value={formData.images} onChange={handleChange} />
                <p className="text-xs text-muted-foreground">Paste direct links to your painting images, separated by commas</p>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-foreground">Craft Story Video URL (Optional)</label>
                <Input name="storyVideo" placeholder="Link to a video showing how it's made" value={formData.storyVideo} onChange={handleChange} />
              </div>
            </div>
            <div className="pt-6 border-t">
              <Button disabled={isSubmitting} type="submit" className="w-full py-6 text-lg shadow-lg font-bold">
                {isSubmitting ? 'Publishing...' : 'Publish Painting'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </main>
  )
}
