import { createSlice, PayloadAction } from "@reduxjs/toolkit"

interface OnboardingState {
  fullName: string
  village: string
  state: string
  language: string
  craftType: string
  yearsExperience: string
  craftDescription: string
  onboardingCompleted: boolean
}

const initialState: OnboardingState = {
  fullName: "",
  village: "",
  state: "",
  language: "English",
  craftType: "",
  yearsExperience: "",
  craftDescription: "",
  onboardingCompleted: false,
}

const onboardingSlice = createSlice({
  name: "onboarding",
  initialState,
  reducers: {
    setOnboardingData(
      state,
      action: PayloadAction<Partial<OnboardingState>>
    ) {
      Object.assign(state, action.payload)

      if (typeof window !== "undefined") {
        localStorage.setItem("onboarding", JSON.stringify(state))
      }
    },

    completeOnboarding(state) {
      state.onboardingCompleted = true

      if (typeof window !== "undefined") {
        localStorage.setItem("onboarding", JSON.stringify(state))
      }
    },

    hydrateOnboarding(_, action: PayloadAction<OnboardingState>) {
      return action.payload
    },

    resetOnboarding() {
      return initialState
    },
  },
})

export const {
  setOnboardingData,
  completeOnboarding,
  hydrateOnboarding,
  resetOnboarding,
} = onboardingSlice.actions

export default onboardingSlice.reducer
