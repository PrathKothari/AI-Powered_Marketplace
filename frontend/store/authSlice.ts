import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type UserRole = 'buyer' | 'artisan' | null

export interface AuthState {
  isAuthenticated: boolean
  role: UserRole
}

const initialState: AuthState = {
  isAuthenticated: false,
  role: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginAsBuyer(state) {
      state.isAuthenticated = true
      state.role = 'buyer'
    },
    loginAsArtisan(state) {
      state.isAuthenticated = true
      state.role = 'artisan'
    },
    logout(state) {
      state.isAuthenticated = false
      state.role = null
    },
  },
})

export const {
  loginAsBuyer,
  loginAsArtisan,
  logout,
} = authSlice.actions

export default authSlice.reducer
