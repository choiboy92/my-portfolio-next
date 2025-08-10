// components/auth/AuthGuard.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')

  const handleAuth = async () => {
    const response = await fetch('/api/auth/discount-portal', {
      method: 'POST',
      body: JSON.stringify({ password }),
    })
    
    if (response.ok) {
      setIsAuthenticated(true)
    } else {
      alert('Invalid password')
    }
  }

  const mockAuth = async () => {
    if (password == 'apple123') {
      setIsAuthenticated(true)
    } else {
      alert('Invalid password')
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full space-y-4">
          <h2 className="text-2xl font-bold text-center">Access Required</h2>
          <Input
            type="password"
            placeholder="Enter access code"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button onClick={mockAuth} className="w-full">
            Access Portal
          </Button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}