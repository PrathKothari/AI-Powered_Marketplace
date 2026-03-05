import { createSlice, PayloadAction } from "@reduxjs/toolkit"


export type UserRole = "buyer" | "artisan" | null

export interface UserState {
  role: UserRole
  favorites: string[]   // ✅ ADD THIS
}

const initialState: UserState = {
  role: null,
  favorites: [],         // ✅ ADD THIS
}

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setRole(state, action: PayloadAction<UserRole>) {
      state.role = action.payload
    },

    toggleFavorite(state, action: PayloadAction<string>) {
      const id = action.payload
      if (state.favorites.includes(id)) {
        state.favorites = state.favorites.filter((fav) => fav !== id)
      } else {
        state.favorites.push(id)
      }
    },
  },
})

export const { setRole, toggleFavorite } = userSlice.actions
export default userSlice.reducer
