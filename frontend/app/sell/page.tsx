'use client'

import { Suspense, useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { createListing, getCategories, createCategory, getUserProfile } from '@/lib/api'
import { uploadImage } from '@/lib/storage'
import { useAuth } from '@/context/AuthContext'
import { Mic, MicOff, UploadCloud, X, Loader, Video, User } from 'lucide-react'
import Link from 'next/link'

export default function SellPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    }>
      <SellPage />
    </Suspense>
  )
}

function SellPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const returnTo = searchParams.get('returnTo')
  const [hasBio, setHasBio] = useState(true)

  const [viewState, setViewState] = useState<'form' | 'generating' | 'preview' | 'success'>('form')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successData, setSuccessData] = useState<any>(null)
  
  // Voice recording state
  const [isRecording, setIsRecording] = useState(false)
  const recognitionRef = useRef<any>(null)

  const [uploadingImages, setUploadingImages] = useState(false)
  const [imageFiles, setImageFiles] = useState<File[]>([])

  const [formData, setFormData] = useState({
    title: '',
    price: '',
    description: '',
    craftType: '',
    region: '',
    materials: '',
    images: [] as string[],
  })

  const [categories, setCategories] = useState<any[]>([])
  const [customCraftType, setCustomCraftType] = useState('')

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const cats = await getCategories()
        setCategories(cats)
      } catch (e) {}
    }
    fetchCats()
  }, [])

  // Check if user has bio
  useEffect(() => {
    if (!user) return
    getUserProfile(user.uid)
      .then(p => setHasBio(!!p.bio))
      .catch(() => {})
  }, [user])

  // Init Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = true
        recognitionRef.current.interimResults = true

        recognitionRef.current.onresult = (event: any) => {
          let finalTranscript = ''
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript
            }
          }
          if (finalTranscript) {
            setFormData(prev => ({
              ...prev,
              description: prev.description ? prev.description + ' ' + finalTranscript : finalTranscript
            }))
          }
        }

        recognitionRef.current.onerror = (e: any) => {
          setIsRecording(false)
        }
        recognitionRef.current.onend = () => {
          setIsRecording(false)
        }
      }
    }
  }, [])

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      toast.error("Voice typing is not supported in this browser.")
      return
    }
    if (isRecording) {
      recognitionRef.current.stop()
      setIsRecording(false)
    } else {
      try {
        recognitionRef.current.start()
        setIsRecording(true)
        toast.info("Listening... Speak now.")
      } catch(e) {
        // Handle race conditions
        recognitionRef.current.stop()
      }
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      // Store files for later upload, and show previews using blob URLs
      setImageFiles(prev => [...prev, ...files])
      const newUrls = files.map(f => URL.createObjectURL(f))
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...newUrls]
      }))
    }
  }

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index))
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  const handleProceedToReel = (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast.error('Please sign in to list a product')
      router.push('/login')
      return
    }
    if (formData.craftType === 'Other' && !customCraftType.trim()) {
      toast.error('Please specify your custom craft type.')
      return
    }
    if (formData.images.length === 0) {
      toast.error('Please attach at least one image.')
      return
    }
    setViewState('generating')
  }

  // Handle AI Loading Delay
  useEffect(() => {
    if (viewState === 'generating') {
      const timer = setTimeout(() => {
        setViewState('preview')
        toast.success("AI Craft Reel Generated!")
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [viewState])

  const handleFinalPublish = async () => {
    setIsSubmitting(true)
    try {
      let finalCraftType = formData.craftType
      if (finalCraftType === 'Other') {
        finalCraftType = customCraftType.trim()
        try {
          await createCategory(finalCraftType, "User-submitted category")
        } catch(e) {
          console.warn("Could not create new category", e)
        }
      }

      // Upload images to Firebase Storage, get permanent URLs
      setUploadingImages(true)
      let imageUrls: string[] = []
      try {
        imageUrls = await Promise.all(imageFiles.map(f => uploadImage(f)))
      } catch (err) {
        toast.error('Image upload failed. Please try again.')
        setIsSubmitting(false)
        setUploadingImages(false)
        return
      }
      setUploadingImages(false)

      const product = await createListing({
        title: formData.title,
        price: parseFloat(formData.price),
        description: formData.description,
        craftType: finalCraftType,
        region: formData.region,
        materials: formData.materials,
        images: imageUrls,
      })
      setSuccessData(product)
      if (returnTo === 'live') {
        toast.success('Product listed! Redirecting to Go Live...')
        router.push(`/live/start?productId=${product.productId}`)
        return
      }
      setViewState('success')
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

  if (viewState === 'generating') {
    return (
      <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-24 h-24 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader className="w-8 h-8 text-primary animate-pulse" />
            </div>
          </div>
          <h2 className="text-2xl font-outfit font-bold uppercase tracking-wider text-primary">Generating AI Craft Reel...</h2>
          <p className="text-muted-foreground animate-pulse text-sm">Analyzing artwork and conceptualizing your story</p>
        </div>
      </main>
    )
  }

  if (viewState === 'preview') {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10 flex flex-col items-center justify-center">
        <Card className="max-w-2xl w-full rounded-2xl shadow-xl p-8 space-y-8 text-center border-t-8 border-t-primary bg-white">
          <div className="space-y-2">
             <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                 <Video className="w-6 h-6 text-primary" />
             </div>
             <h2 className="text-3xl font-outfit font-bold uppercase text-foreground">Your Craft Reel is Ready!</h2>
             <p className="text-muted-foreground text-sm">This AI-generated reel will be displayed on your product page to uniquely showcase your story to buyers.</p>
          </div>
          
          <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center shadow-md border border-border">
             <video 
                src="https://videos.pexels.com/video-files/4491295/4491295-sd_640_360_25fps.mp4" 
                controls 
                autoPlay 
                loop 
                className="w-full h-full object-cover"
             />
          </div>

          <div className="flex gap-4 pt-4">
             <Button variant="outline" onClick={() => setViewState('form')} className="flex-1 font-outfit font-bold uppercase tracking-wider h-12 transition-all hover:scale-[1.02] active:scale-[0.98]">
               Edit Details
             </Button>
             <Button onClick={handleFinalPublish} disabled={isSubmitting} className="flex-1 font-outfit font-bold uppercase tracking-wider h-12 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg">
               {uploadingImages ? 'Uploading Images...' : isSubmitting ? 'Publishing...' : 'Finalize & Publish'}
             </Button>
          </div>
        </Card>
      </main>
    )
  }

  if (viewState === 'success' && successData) {
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
            <p className="text-muted-foreground">Your painting and story reel are now live.</p>
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
            <Button 
              onClick={downloadQR} 
              variant="outline" 
              className="w-full py-6 border-2 border-primary text-primary font-bold font-outfit uppercase tracking-wider transition-all duration-200 hover:bg-primary hover:text-white hover:scale-[1.02] active:scale-[0.98]"
            >
              Download QR Code
            </Button>
            <Button onClick={() => router.push(`/product/${successData.productId}`)} className="w-full py-6 font-outfit uppercase tracking-wider font-bold">
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

  // DEFAULT FORM VIEW
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-outfit font-bold uppercase text-foreground">List a Painting</h1>
          <p className="text-muted-foreground mt-2">Share your handcrafted artwork and let our AI generate a magical reel for it.</p>
        </div>

        {/* Bio prompt */}
        {!hasBio && user && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <User className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">Complete your profile to build trust with buyers</p>
              <Link href="/profile" className="text-xs text-amber-600 hover:underline">
                Add a bio &rarr;
              </Link>
            </div>
          </div>
        )}

        <Card className="rounded-xl shadow-sm border-border overflow-hidden">
          <form className="p-6 sm:p-8 space-y-6" onSubmit={handleProceedToReel}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-foreground">Painting Name <span className="text-red-500">*</span></label>
                <Input required name="title" placeholder="E.g., Madhubani Village Scene" value={formData.title} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Price (₹) <span className="text-red-500">*</span></label>
                <Input required type="number" min="1" step="1" name="price" placeholder="1200" value={formData.price} onChange={handleChange} />
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Craft Type <span className="text-red-500">*</span></label>
                  <select 
                    required 
                    name="craftType" 
                    value={formData.craftType} 
                    onChange={handleChange as any}
                    className="flex h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                  >
                    <option value="" disabled>Select a Craft Type</option>
                    {categories.map((cat, idx) => (
                      <option key={idx} value={cat.name}>{cat.name}</option>
                    ))}
                    <option value="Other">Other (Please specify)</option>
                  </select>
                </div>
                {formData.craftType === 'Other' && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                    <label className="text-sm font-semibold text-primary">Custom Craft Type</label>
                    <Input required placeholder="E.g., Bamboo Craft" value={customCraftType} onChange={(e) => setCustomCraftType(e.target.value)} />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Region / Origin <span className="text-red-500">*</span></label>
                <select 
                  required 
                  name="region" 
                  value={formData.region} 
                  onChange={handleChange as any}
                  className="flex h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                >
                  <option value="" disabled>Select State/Region</option>
                  {[
                    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", 
                    "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", 
                    "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", 
                    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
                    "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", 
                    "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
                  ].sort().map((state) => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Materials Used</label>
                <Input name="materials" placeholder="E.g., Natural dyes, handmade paper" value={formData.materials} onChange={handleChange} />
              </div>
              
              <div className="space-y-2 md:col-span-2 relative">
                <div className="flex justify-between items-end">
                  <label className="text-sm font-semibold text-foreground">Description & Story <span className="text-red-500">*</span></label>
                  <button 
                    type="button" 
                    onClick={toggleRecording}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${isRecording ? 'border-red-200 bg-red-100 text-red-600 animate-pulse' : 'border-border bg-white text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                  >
                    {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                    {isRecording ? "Stop dictating" : "Dictate"}
                  </button>
                </div>
                <textarea
                  required
                  name="description"
                  placeholder="Describe the artwork, its significance, and the process... (Or click dictation to speak it)"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 border rounded-md resize-y min-h-[120px]"
                />
              </div>

              {/* Image Upload Area */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold text-foreground">Painting Images <span className="text-red-500">*</span></label>
                
                <div className="mt-2 flex flex-col items-center justify-center w-full min-h-[120px] px-4 py-8 border-2 border-dashed border-border rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors relative cursor-pointer group">
                   <UploadCloud className="w-8 h-8 text-muted-foreground mb-3 group-hover:text-primary transition-colors" />
                   <div className="flex flex-col items-center text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground">Click to upload</span> or drag and drop
                      <span className="text-xs mt-1 text-center">SVG, PNG, JPG or GIF (MAX. 800x400px)</span>
                   </div>
                   <input 
                      type="file" 
                      multiple 
                      accept="image/*" 
                      onChange={handleImageUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                   />
                </div>

                {/* Image Previews */}
                {formData.images.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 pt-4">
                    {formData.images.map((url, idx) => (
                      <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-border shadow-sm group">
                        <img src={url} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 bg-black/60 hover:bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="pt-6 border-t mt-4 flex justify-end">
              <Button type="submit" className="h-10 px-6 text-sm shadow-sm font-outfit uppercase tracking-wider font-bold transition-all hover:scale-[1.02] active:scale-[0.98] group flex gap-2">
                <span>Next: Generate AI Reel</span>
                <Video className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </main>
  )
}
