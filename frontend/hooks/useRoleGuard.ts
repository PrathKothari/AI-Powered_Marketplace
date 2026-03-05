'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function useRoleGuard(requiredRole: 'buyer' | 'artisan') {
  const router = useRouter()

  useEffect(() => {
    const role = localStorage.getItem('role')

    if (!role) {
      router.push('/') // role selection page
      return
    }

    if (role !== requiredRole) {
      router.push('/') // wrong role
    }
  }, [requiredRole, router])
}