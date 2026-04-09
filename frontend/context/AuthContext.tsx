'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useDispatch } from 'react-redux'
import { setUser, UserRole } from '@/store/slices/userSlice'
import {
  AuthUser,
  loginApi,
  registerApi,
  googleLoginApi,
  forgotPasswordApi,
  logoutApi,
  storeSession,
  clearSession,
  getStoredUser,
} from '@/lib/auth'

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  loginWithGoogle: (credential: string) => Promise<void>
  forgotPassword: (email: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const dispatch = useDispatch()
  const [user, setAuthUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  // Rehydrate from localStorage on mount
  useEffect(() => {
    const stored = getStoredUser()
    if (stored) {
      setAuthUser(stored)
      dispatch(setUser({ name: stored.name, email: stored.email, role: stored.role as UserRole }))
    }
    setLoading(false)
  }, [dispatch])

  const applySession = (user: AuthUser, token: string) => {
    storeSession(token, user)
    setAuthUser(user)
    dispatch(setUser({ name: user.name, email: user.email, role: user.role as UserRole }))
  }

  const login = async (email: string, password: string) => {
    const res = await loginApi(email, password)
    applySession(res.user, res.access_token)
  }

  const register = async (name: string, email: string, password: string) => {
    const res = await registerApi(name, email, password)
    applySession(res.user, res.access_token)
  }

  const loginWithGoogle = async (credential: string) => {
    const res = await googleLoginApi(credential)
    applySession(res.user, res.access_token)
  }

  const forgotPassword = async (email: string) => {
    await forgotPasswordApi(email)
  }

  const logout = async () => {
    await logoutApi()
    clearSession()
    setAuthUser(null)
    dispatch(setUser(null))
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, forgotPassword, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
