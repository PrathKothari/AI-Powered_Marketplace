"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { useDispatch } from "react-redux"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronRight } from "lucide-react"

import ProgressIndicator from "./progress-indicator"
import PersonalDetailsForm from "./personal-details-form"
import CraftDetailsForm from "./craft-details-form"
import VoiceIntroductionForm from "./voice-introduction-form"

// ✅ Redux actions
import {
  setOnboardingData,
  completeOnboarding,
} from "@/store/slices/onboardingSlice"

export default function OnboardingForm() {
  const router = useRouter()
  const dispatch = useDispatch()

  const [currentStep, setCurrentStep] = useState(1)

  const [formData, setFormData] = useState({
    fullName: "",
    village: "",
    state: "",
    language: "English",
    craftType: "",
    yearsExperience: "",
    craftDescription: "",
  })

  const totalSteps = 3

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const handleSkip = () => {
    router.push("/artisian/dashboard")
  }

  // ✅ REDUX-INTEGRATED COMPLETE HANDLER
  const handleComplete = () => {
    // Save onboarding data globally
    dispatch(setOnboardingData(formData))

    // Mark onboarding as completed
    dispatch(completeOnboarding())

    // Optional localStorage (can be removed later)
    localStorage.setItem("artisanName", formData.fullName)

    // Go to dashboard
    router.push("/artisian/dashboard")
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Indicator */}
        <ProgressIndicator currentStep={currentStep} totalSteps={totalSteps} />

        {/* Main Card */}
        <Card className="mt-8 border-muted/50 shadow-lg">
          <div className="p-8 md:p-10">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 text-balance">
                Let's Set Up Your Artisan Profile
              </h1>
              <p className="text-lg text-muted-foreground">
                This helps us tell your story and showcase your craft
              </p>
            </div>

            {/* Form Content */}
            <div className="mb-8">
              {currentStep === 1 && (
                <PersonalDetailsForm
                  formData={formData}
                  setFormData={setFormData}
                />
              )}

              {currentStep === 2 && (
                <CraftDetailsForm
                  formData={formData}
                  setFormData={setFormData}
                />
              )}

              {currentStep === 3 && <VoiceIntroductionForm />}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-between">
              <div>
                {currentStep > 1 && (
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    className="border-muted text-foreground hover:bg-muted/50 bg-transparent"
                  >
                    Back
                  </Button>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  className="text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                >
                  Skip for now
                </Button>

                <Button
                  onClick={currentStep === totalSteps ? handleComplete : handleNext}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                >
                  {currentStep === totalSteps
                    ? "Continue to Dashboard"
                    : "Continue"}
                  <ChevronRight size={18} />
                </Button>
              </div>
            </div>

            {/* Helper Text */}
            <p className="text-center text-sm text-muted-foreground mt-6">
              💡 You can edit this later
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
