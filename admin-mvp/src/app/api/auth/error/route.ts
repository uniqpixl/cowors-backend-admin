import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const error = searchParams.get('error')
  
  // Redirect to our signin page with error parameter
  const redirectUrl = `/auth/login${error ? `?error=${encodeURIComponent(error)}` : ''}`
  return NextResponse.redirect(new URL(redirectUrl, request.url))
}