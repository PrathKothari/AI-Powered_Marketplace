"use client"

import type React from "react"

interface CraftDetailsFormProps {
  formData: any
  setFormData: (data: any) => void
}

export default function CraftDetailsForm({ formData, setFormData }: CraftDetailsFormProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const craftTypes = ["Pottery", "Weaving", "Painting", "Woodwork", "Jewelry", "Textile", "Other"]

  return (
    <div className="space-y-6">
      <div className="bg-muted/40 rounded-lg p-4 border border-muted/50">
        <h2 className="text-lg font-semibold text-foreground mb-4">Your Craft</h2>

        <div className="space-y-4">
          {/* Craft Type */}
          <div>
            <label htmlFor="craftType" className="block text-sm font-medium text-foreground mb-2">
              What do you create?
            </label>
            <select
              id="craftType"
              name="craftType"
              value={formData.craftType}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg bg-card border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
            >
              <option value="">Select your craft type</option>
              {craftTypes.map((craft) => (
                <option key={craft} value={craft}>
                  {craft}
                </option>
              ))}
            </select>
          </div>

          {/* Years of Experience */}
          <div>
            <label htmlFor="yearsExperience" className="block text-sm font-medium text-foreground mb-2">
              Years of Experience
            </label>
            <input
              id="yearsExperience"
              name="yearsExperience"
              type="number"
              min="0"
              max="100"
              value={formData.yearsExperience}
              onChange={handleChange}
              placeholder="e.g., 5"
              className="w-full px-4 py-3 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
            />
          </div>

          {/* Craft Description */}
          <div>
            <label htmlFor="craftDescription" className="block text-sm font-medium text-foreground mb-2">
              Tell us about your craft
            </label>
            <textarea
              id="craftDescription"
              name="craftDescription"
              value={formData.craftDescription}
              onChange={handleChange}
              placeholder="Share your story, techniques, and what makes your work special..."
              rows={4}
              className="w-full px-4 py-3 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background resize-none"
            />
            <p className="text-xs text-muted-foreground mt-2">{formData.craftDescription.length}/500 characters</p>
          </div>
        </div>
      </div>
    </div>
  )
}
