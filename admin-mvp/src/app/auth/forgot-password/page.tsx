"use client"

import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm"

export default function ForgotPasswordPage() {
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
        <ForgotPasswordForm />
      </div>
    </div>
  )
}