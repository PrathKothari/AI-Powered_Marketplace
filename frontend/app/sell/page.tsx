'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

import { addProduct } from '@/lib/products'

export default function SellPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successData, setSuccessData] = useState<any>(null)

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    storyVideo: '',
    images: '',
    origin: '',
    materials: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    setTimeout(() => {
      const productId = Date.now().toString()
      const newProduct = { ...formData, id: productId }
      
      addProduct(newProduct)

      setSuccessData(newProduct)
      setIsSubmitting(false)
    }, 1000)
  }

  const downloadQR = () => {
    const svg = document.getElementById("qr-code-svg") as any;
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        if (ctx) {
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
        }
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `product-qr-${successData.id}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      };
      img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
    }
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
              <h2 className="text-3xl font-bold text-foreground">Product Published!</h2>
              <p className="text-muted-foreground">Your product is now listed on CraftHub.</p>
            </div>

            <div className="p-6 border-2 border-primary/20 bg-primary/5 rounded-xl shadow-inner relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full -mr-10 -mt-10 blur-xl"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-secondary/10 rounded-full -ml-10 -mb-10 blur-xl"></div>
                
                <h3 className="font-bold text-lg mb-6 text-foreground relative z-10 flex items-center justify-center gap-2">
                    <span className="text-primary">✨</span> Digital Authenticity Card
                </h3>
                
                <div className="flex justify-center bg-white p-4 rounded-xl shadow-md inline-block mx-auto relative z-10 hover:scale-105 transition-transform">
                    <QRCodeSVG id="qr-code-svg" value={`http://localhost:3000/product/${successData.id}`} size={180} level={"H"} />
                </div>
                
                <p className="mt-6 text-sm text-primary font-semibold relative z-10 uppercase tracking-wider">
                  This QR verifies product authenticity
                </p>
                
                <div className="mt-6 text-left space-y-3 text-sm bg-white/60 p-4 rounded-lg backdrop-blur-sm relative z-10">
                    <div className="flex justify-between border-b border-black/5 pb-2">
                      <span className="text-muted-foreground">Product ID</span>
                      <span className="font-mono font-medium">{successData.id}</span>
                    </div>
                    <div className="flex justify-between border-b border-black/5 pb-2">
                      <span className="text-muted-foreground">Artisan</span>
                      <span className="font-medium text-foreground">Sofia (Mock Data)</span>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-3 pt-4">
                <Button 
                  onClick={downloadQR}
                  variant="outline"
                  className="w-full py-6 text-md font-medium border-primary text-primary hover:bg-primary/5"
                >
                  Download QR Code
                </Button>
                <Button 
                  onClick={() => router.push(`/product/${successData.id}`)} 
                  className="w-full py-6 text-md font-medium text-white shadow-lg shadow-primary/30"
                >
                  View Product Page
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
            <h1 className="text-3xl font-bold text-foreground">Sell Product</h1>
            <p className="text-muted-foreground mt-2">List your handmade items to showcase their authenticity and story.</p>
          </div>
          
          <Card className="rounded-xl shadow-sm border-border overflow-hidden">
            <form className="p-6 sm:p-8 space-y-6" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-semibold text-foreground">Product Name</label>
                        <Input required name="name" placeholder="E.g., Handwoven Bamboo Basket" value={formData.name} onChange={handleChange} className="bg-white" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground">Price ($)</label>
                        <Input required type="number" min="0" step="0.01" name="price" placeholder="45.00" value={formData.price} onChange={handleChange} className="bg-white" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground">Materials</label>
                        <Input required name="materials" placeholder="E.g., Bamboo, Natural Dyes" value={formData.materials} onChange={handleChange} className="bg-white" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-semibold text-foreground">Description</label>
                        <textarea required name="description" placeholder="Describe the crafting process and the item's uniqueness..." value={formData.description} onChange={handleChange} className="w-full border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border rounded-md resize-y min-h-[100px]" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground">Origin</label>
                        <Input required name="origin" placeholder="E.g., Kerala, India" value={formData.origin} onChange={handleChange} className="bg-white" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground">Images (URLs)</label>
                        <Input required name="images" placeholder="Comma separated URLs" value={formData.images} onChange={handleChange} className="bg-white" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-semibold text-foreground">Story Video URL (Optional)</label>
                        <Input name="storyVideo" placeholder="Link to a video showing how it's made" value={formData.storyVideo} onChange={handleChange} className="bg-white" />
                    </div>
                </div>

                <div className="pt-6 border-t mt-6">
                  <Button disabled={isSubmitting} type="submit" className="w-full py-6 text-lg shadow-lg font-bold">
                      {isSubmitting ? 'Publishing...' : 'Publish Product'}
                  </Button>
                </div>
            </form>
          </Card>
      </div>
    </main>
  )
}
