interface ProgressIndicatorProps {
  currentStep: number
  totalSteps: number
}

export default function ProgressIndicator({ currentStep, totalSteps }: ProgressIndicatorProps) {
  return (
    <div className="flex items-center justify-between">
      {Array.from({ length: totalSteps }).map((_, index) => {
        const stepNumber = index + 1
        const isCompleted = stepNumber < currentStep
        const isActive = stepNumber === currentStep

        return (
          <div key={stepNumber} className="flex items-center flex-1">
            {/* Step Circle */}
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                isCompleted
                  ? "bg-primary text-primary-foreground"
                  : isActive
                    ? "bg-accent text-accent-foreground ring-2 ring-accent ring-offset-2 ring-offset-background"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {isCompleted ? "✓" : stepNumber}
            </div>

            {/* Connecting Line */}
            {stepNumber < totalSteps && (
              <div
                className={`flex-1 h-1 mx-2 rounded-full transition-all ${isCompleted ? "bg-primary" : "bg-muted"}`}
              />
            )}
          </div>
        )
      })}

      {/* Step Label */}
      <div className="text-right ml-4">
        <p className="text-sm font-medium text-foreground">
          Step {currentStep} <span className="text-muted-foreground">of {totalSteps}</span>
        </p>
      </div>
    </div>
  )
}
