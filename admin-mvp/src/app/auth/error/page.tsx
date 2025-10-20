"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { useSearchParams } from 'next/navigation'
import { AlertCircle } from "lucide-react"
import { handleAuthError } from '@cowors/shared-auth'
import { Suspense } from 'react'

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  
  const getErrorMessage = (error: string | null) => {
    // Log the error for monitoring
    if (process.env.NODE_ENV === 'development') {
      console.warn('Auth Error:', error);
    }
    
    // Return specific messages for known error codes
    switch (error) {
      case 'Configuration':
        return 'There is a problem with the server configuration.';
      case 'AccessDenied':
        return 'Access denied. You do not have permission to sign in.';
      case 'Verification':
        return 'The verification link is invalid or has expired.';
      case 'SessionExpired':
        return 'Your session has expired. Please sign in again.';
      case 'RefreshAccessTokenError':
        return 'Unable to refresh your session. Please sign in again.';
      default:
        return 'An authentication error occurred. Please try signing in again.';
    }
  }

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="/" className="flex items-center gap-2 self-center">
          <img 
            src="/images/logo/cowors-logo.png"
            alt="Cowors Logo"
            className="h-5 w-auto"
          />
        </a>
        
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
            <CardTitle className="text-xl text-destructive">Authentication Error</CardTitle>
            <CardDescription>
              {getErrorMessage(error)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
                  <p className="text-sm text-destructive">
                    <strong>Error Code:</strong> {error}
                  </p>
                </div>
              )}
              
              <Button asChild className="w-full bg-[#dc2626] hover:bg-[#b91c1c] text-white">
                <Link href="/auth/login">
                  Back to Sign In
                </Link>
              </Button>
              
              <Button variant="outline" asChild className="w-full">
                <Link href="/">
                  Go to Homepage
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <div className="text-muted-foreground text-center text-xs text-balance">
          Need help?{" "}
          <Link href="/contact" className="underline underline-offset-4 hover:text-blue-600">
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthErrorContent />
    </Suspense>
  )
}