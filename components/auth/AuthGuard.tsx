// components/auth/AuthGuard.tsx
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [attempts, setAttempts] = useState(0)

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/epp')
      const data = await response.json()
      setIsAuthenticated(data.authenticated)
    } catch {
      setIsAuthenticated(false)
    }
  }

  const handleAuth = async () => {
    if (attempts >= 5) {
      setError('Too many failed attempts. Please wait 15 minutes.')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/epp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (response.ok) {
        setIsAuthenticated(true)
        setPassword('')
        setAttempts(0)
      } else {
        const data = await response.json()
        setError(data.error || 'Invalid password')
        setAttempts(prev => prev + 1)
      }
    } catch {
      setError('Authentication failed. Please try again.')
      setAttempts(prev => prev + 1)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-portfolio-dark">
        <div className="max-w-md w-full space-y-6 p-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-portfolio-text mb-2">
              Access Required
            </h2>
            <p className="text-portfolio-muted">
              Please enter the access code to continue
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <Input
              type="password"
              placeholder="Enter access code"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
              disabled={isLoading || attempts >= 5}
            />
            
            <Button 
              onClick={handleAuth} 
              className="w-full"
              disabled={isLoading || !password || attempts >= 5}
            >
              {isLoading ? 'Verifying...' : 'Access Portal'}
            </Button>
          </div>

          {attempts > 0 && attempts < 5 && (
            <p className="text-sm text-portfolio-muted text-center">
              {5 - attempts} attempts remaining
            </p>
          )}
        </div>
      </div>
    )
  }

  return <>{children}</>
}
