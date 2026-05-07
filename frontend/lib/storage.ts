import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from './firebase'
import { getAuthToken } from './api'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1'

export async function uploadImage(file: File): Promise<string> {
  const token = getAuthToken()
  if (!token) throw new Error('You must be logged in to upload images')

  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch(`${API_BASE}/uploads/image`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Image upload failed')
  }
  const data = await res.json()
  return data.url
}

export async function uploadProfilePhoto(userId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg'
  const path = `profile_photos/${userId}.${ext}`
  const storageRef = ref(storage, path)
  const snapshot = await uploadBytes(storageRef, file)
  return getDownloadURL(snapshot.ref)
}
