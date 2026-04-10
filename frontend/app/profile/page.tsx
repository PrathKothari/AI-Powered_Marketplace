'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { updateProfile, updateUserProfile, getUserProfile, getCategories } from '@/lib/api'
import { storeSession } from '@/lib/auth'
import { uploadProfilePhoto } from '@/lib/storage'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, User, Mail, KeyRound, Loader2, CheckCircle2, Palette, MapPin, Clock, Camera } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function ProfilePage() {
  const { user, loading, forgotPassword } = useAuth()
  const router = useRouter()

  const [name, setName] = useState(user?.name ?? '')
  const [savingName, setSavingName] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [sendingReset, setSendingReset] = useState(false)

  // Bio fields
  const [bio, setBio] = useState('')
  const [region, setRegion] = useState('')
  const [experienceYears, setExperienceYears] = useState('')
  const [savingBio, setSavingBio] = useState(false)
  const [bioLoaded, setBioLoaded] = useState(false)
  const [categories, setCategories] = useState<any[]>([])

  // Photo
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load profile data
  useEffect(() => {
    if (!user) return
    getUserProfile(user.uid)
      .then(profile => {
        setBio(profile.bio || '')
        setRegion(profile.region || '')
        setExperienceYears(profile.experienceYears ? String(profile.experienceYears) : '')
        setPhotoUrl(profile.photoUrl || null)
        setBioLoaded(true)
      })
      .catch(() => setBioLoaded(true))

    getCategories().then(setCategories).catch(() => {})
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!user) {
    router.push('/login')
    return null
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }
    setUploadingPhoto(true)
    try {
      const url = await uploadProfilePhoto(user.uid, file)
      await updateUserProfile({ photoUrl: url })
      setPhotoUrl(url)
      toast.success('Profile photo updated!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload photo')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleSaveName = async () => {
    if (!name.trim() || name.trim() === user.name) return
    setSavingName(true)
    try {
      const res = await updateProfile(name.trim())
      storeSession(res.access_token, res.user)
      toast.success('Name updated! Please refresh the page to see changes in the navbar.')
    } catch (err: any) {
      toast.error(err.message || 'Failed to update name')
    } finally {
      setSavingName(false)
    }
  }

  const handleSaveBio = async () => {
    setSavingBio(true)
    try {
      const payload: any = {
        bio: bio.trim() || '',
        region: region || '',
        experienceYears: experienceYears ? parseInt(experienceYears) : 0,
      }

      await updateUserProfile(payload)
      toast.success('Profile updated successfully!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile')
    } finally {
      setSavingBio(false)
    }
  }

  const handlePasswordReset = async () => {
    setSendingReset(true)
    try {
      await forgotPassword(user.email)
      setResetSent(true)
      toast.success('Password reset email sent!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to send reset email')
    } finally {
      setSendingReset(false)
    }
  }

  const states = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
    "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
    "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
  ].sort()

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        <div>
          <Link href="/dashboard" className="inline-flex items-center text-sm text-slate-500 hover:text-primary mb-2">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
          <p className="text-muted-foreground mt-1">Manage your account details</p>
        </div>

        {/* Avatar card with photo upload */}
        <Card className="p-6 flex items-center gap-4 bg-white">
          <div className="relative group">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={user.name}
                className="w-16 h-16 rounded-full object-cover ring-4 ring-primary/5"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold uppercase ring-4 ring-primary/5">
                {user.name.charAt(0)}
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="absolute inset-0 w-16 h-16 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              {uploadingPhoto ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Camera className="w-5 h-5" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>
          <div>
            <p className="font-bold text-lg">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-primary hover:underline mt-1"
            >
              {photoUrl ? 'Change photo' : 'Add profile photo'}
            </button>
          </div>
        </Card>

        {/* Name update */}
        <Card className="p-6 bg-white space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <User className="w-4 h-4 text-primary" />
            <h2 className="font-semibold">Display Name</h2>
          </div>
          <div className="flex gap-2">
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
              className="flex-1"
            />
            <Button
              onClick={handleSaveName}
              disabled={savingName || !name.trim() || name.trim() === user.name}
            >
              {savingName ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
            </Button>
          </div>
        </Card>

        {/* Bio & Craft Details */}
        <Card className="p-6 bg-white space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Palette className="w-4 h-4 text-primary" />
            <h2 className="font-semibold">Bio</h2>
          </div>
          <p className="text-xs text-muted-foreground">This info appears on your product pages and live streams.</p>

          <div className="space-y-4">
            <div className="space-y-2">
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Tell buyers about yourself, your craft, and your story..."
                className="w-full border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 border rounded-md resize-y min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Region
                </label>
                <select
                  value={region}
                  onChange={e => setRegion(e.target.value)}
                  className="flex h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                >
                  <option value="">Select...</option>
                  {states.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Experience (years)
                </label>
                <Input
                  type="number"
                  min="0"
                  value={experienceYears}
                  onChange={e => setExperienceYears(e.target.value)}
                  placeholder="E.g., 5"
                />
              </div>
            </div>
          </div>

          <Button onClick={handleSaveBio} disabled={savingBio} className="w-full">
            {savingBio ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Save Profile
          </Button>
        </Card>

        {/* Email (read-only) */}
        <Card className="p-6 bg-white space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Mail className="w-4 h-4 text-primary" />
            <h2 className="font-semibold">Email Address</h2>
          </div>
          <Input value={user.email} disabled className="bg-slate-50 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
        </Card>

        {/* Password reset */}
        <Card className="p-6 bg-white space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <KeyRound className="w-4 h-4 text-primary" />
            <h2 className="font-semibold">Password</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            We'll send a password reset link to <strong>{user.email}</strong>.
          </p>
          {resetSent ? (
            <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
              <CheckCircle2 className="w-4 h-4" />
              Reset email sent — check your inbox.
            </div>
          ) : (
            <Button variant="outline" onClick={handlePasswordReset} disabled={sendingReset}>
              {sendingReset ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Send Password Reset Email
            </Button>
          )}
        </Card>
      </div>
    </main>
  )
}
