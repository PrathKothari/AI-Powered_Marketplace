"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function PhoneLoginForm() {
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState("")
  const [otpSent, setOtpSent] = useState(false)

  const router = useRouter()

  return (
    <div className="space-y-4">
      {!otpSent ? (
        <>
          <div>
            <label className="block text-sm font-medium mb-2">Phone Number</label>
            <Input
              placeholder="+91 9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <Button className="w-full" onClick={() => setOtpSent(true)}>
            Send OTP
          </Button>
        </>
      ) : (
        <>
          <div>
            <label className="block text-sm font-medium mb-2">Enter OTP</label>
            <Input
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
          </div>

          <Button
            className="w-full"
            onClick={() => router.push("/artisian/onboarding")}
          >
            Verify & Continue
          </Button>
        </>
      )}
    </div>
  )
}
