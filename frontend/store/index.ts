import { configureStore } from "@reduxjs/toolkit"
import cartReducer from './slices/cartSlice'
import onboardingReducer from "./slices/onboardingSlice"
import authReducer from "./authSlice"
import profileReducer from "./slices/profileSlice"
import userReducer from "./slices/userSlice"
import { useAppDispatch } from '@/store/hooks'
import { addToCart } from '@/store/slices/cartSlice'
export const store = configureStore({
  reducer: {
    onboarding: onboardingReducer,
    auth: authReducer,
    profile: profileReducer,
    user: userReducer,
    cart: cartReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
