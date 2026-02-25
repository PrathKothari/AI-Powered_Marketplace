"use client"

import type React from "react"

interface PersonalDetailsFormProps {
  formData: any
  setFormData: (data: any) => void
}

export default function PersonalDetailsForm({ formData, setFormData }: PersonalDetailsFormProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  return (
    <div className="space-y-6">
      <div className="bg-muted/40 rounded-lg p-4 border border-muted/50">
        <h2 className="text-lg font-semibold text-foreground mb-4">Personal Details</h2>

        <div className="space-y-4">
          {/* Full Name */}
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-foreground mb-2">
              Full Name
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Enter your full name"
              className="w-full px-4 py-3 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
            />
          </div>

          {/* Village / City */}
          <div>
            <label htmlFor="village" className="block text-sm font-medium text-foreground mb-2">
              Village / City
            </label>
            <input
              id="village"
              name="village"
              type="text"
              value={formData.village}
              onChange={handleChange}
              placeholder="Where are you based?"
              className="w-full px-4 py-3 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
            />
          </div>

          {/* State / Region */}
          <div>
            <label htmlFor="state" className="block text-sm font-medium text-foreground mb-2">
              State / Region
            </label>
            <input
              id="state"
              name="state"
              type="text"
              value={formData.state}
              onChange={handleChange}
              placeholder="Your state or region"
              className="w-full px-4 py-3 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
            />
          </div>

          {/* Preferred Language */}
          <div>
            <label htmlFor="language" className="block text-sm font-medium text-foreground mb-2">
              Preferred Language
            </label>
            <select
              id="language"
              name="language"
              value={formData.language}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg bg-card border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
            >
              <option>English</option>
              <option>Hindi</option>
              <option>Spanish</option>
              <option>French</option>
              <option>Portuguese</option>
              <option>Other</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}
