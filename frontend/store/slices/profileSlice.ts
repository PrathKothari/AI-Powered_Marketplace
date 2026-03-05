import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface ProfileState {
  craftType: string
  yearsExperience: number
  craftDescription: string
  village: string
  state: string
  language: string
}

const initialState: ProfileState = {
  craftType: '',
  yearsExperience: 0,
  craftDescription: '',
  village: '',
  state: '',
  language: '',
}

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    setProfile: (_, action: PayloadAction<ProfileState>) => action.payload,
    clearProfile: () => initialState,
  },
})

export const { setProfile, clearProfile } = profileSlice.actions
export default profileSlice.reducer
