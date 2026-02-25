"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Mic, StopCircle, Volume2 } from "lucide-react"

export default function VoiceIntroductionForm() {
  const [isRecording, setIsRecording] = useState(false)
  const [hasRecording, setHasRecording] = useState(false)

  const handleRecord = () => {
    setIsRecording(!isRecording)
  }

  const handlePlayback = () => {
    // Placeholder for playback logic
    console.log("Playing recording...")
  }

  return (
    <div className="space-y-6">
      <div className="bg-muted/40 rounded-lg p-6 border border-muted/50">
        <h2 className="text-lg font-semibold text-foreground mb-2">Voice Introduction</h2>
        <p className="text-sm text-muted-foreground mb-6">Optional • Your voice helps us create your story</p>

        {/* Recording State */}
        <div className="bg-card rounded-lg p-8 border-2 border-dashed border-muted/60 flex flex-col items-center justify-center min-h-48">
          {!hasRecording ? (
            <div className="text-center">
              <div className="mb-4">
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto transition-colors ${
                    isRecording ? "bg-primary/20" : "bg-muted"
                  }`}
                >
                  <Mic size={28} className={isRecording ? "text-primary" : "text-muted-foreground"} />
                </div>
              </div>
              <p className="text-foreground font-medium mb-1">{isRecording ? "Recording..." : "Ready to record"}</p>
              <p className="text-sm text-muted-foreground mb-6">
                {isRecording ? "Keep talking (up to 60 seconds)" : "Tell us about your craft in 30-60 seconds"}
              </p>
              <Button
                onClick={handleRecord}
                className={`gap-2 ${isRecording ? "bg-destructive hover:bg-destructive/90" : "bg-accent hover:bg-accent/90"}`}
              >
                {isRecording ? (
                  <>
                    <StopCircle size={18} />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <Mic size={18} />
                    Start Recording
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="text-center w-full">
              <div className="mb-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Volume2 size={28} className="text-primary" />
                </div>
              </div>
              <p className="text-foreground font-medium mb-1">Recording saved!</p>
              <p className="text-sm text-muted-foreground mb-6">0:45 seconds</p>
              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => setHasRecording(false)}
                  className="border-muted text-foreground hover:bg-muted/50"
                >
                  Re-record
                </Button>
                <Button
                  onClick={handlePlayback}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                >
                  <Volume2 size={18} />
                  Play
                </Button>
              </div>
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground mt-4 text-center">
          🎤 This is optional. You can also add this later
        </p>
      </div>
    </div>
  )
}
