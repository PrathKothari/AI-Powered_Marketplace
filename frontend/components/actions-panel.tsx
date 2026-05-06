'use client'

import { Edit2, MapPin, Lock, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

const actionItems = [
  {
    icon: Edit2,
    label: 'Edit Profile',
    description: 'Update your artisan information',
    href: '#edit-profile',
  },
  {
    icon: MapPin,
    label: 'Update Address',
    description: 'Change your studio location',
    href: '/artisan/address',
  },
  {
    icon: Lock,
    label: 'Change Password',
    description: 'Secure your account',
    href: '/artisan/password',
  },
  {
    icon: LogOut,
    label: 'Logout',
    description: 'Sign out from your account',
    href: '#logout',
  },
]

export default function ActionsPanel() {
  return (
    <Card className="border-0 shadow-sm p-6 md:p-8">
      <h2 className="text-xl md:text-2xl font-bold text-foreground mb-6">Quick Actions</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {actionItems.map((item) => {
          const Icon = item.icon
          return (
            <Button
              key={item.label}
              variant="outline"
              className="h-auto p-5 flex items-center justify-start gap-4 text-left hover:shadow-md transition-all bg-transparent"
              style={{
                borderColor: 'var(--border)',
                backgroundColor: 'var(--background)',
              }}
            >
              <Icon
                size={24}
                className="flex-shrink-0"
                style={{ color: 'var(--primary)' }}
              />
              <div className="flex-1">
                <p className="font-semibold text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
            </Button>
          )
        })}
      </div>
    </Card>
  )
}
