import { createSlice, PayloadAction } from "@reduxjs/toolkit"


export type UserRole = "buyer" | "artisan" | null

export interface UserState {
  name: string | null
  email: string | null
  role: UserRole
  favorites: string[]   // ✅ ADD THIS
}

const initialState: UserState = {
  name: null,
  email: null,
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

    setUser(state, action: PayloadAction<{ name: string; email: string; role: UserRole } | null>) {
      if (action.payload) {
        state.name = action.payload.name;
        state.email = action.payload.email;
        state.role = action.payload.role;
      } else {
        state.name = null;
        state.email = null;
        state.role = null;
      }
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

export const { setRole, setUser, toggleFavorite } = userSlice.actions
export default userSlice.reducer
