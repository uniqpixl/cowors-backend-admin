import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const cookieStore = await cookies()
    
    // Clear NextAuth session cookies
    cookieStore.delete('next-auth.session-token')
    cookieStore.delete('__Secure-next-auth.session-token')
    cookieStore.delete('next-auth.csrf-token')
    cookieStore.delete('__Host-next-auth.csrf-token')
    
    return NextResponse.json({ success: true, message: 'Session cleared' })
  } catch (error) {
    console.error('Error clearing session:', error)
    return NextResponse.json({ success: false, error: 'Failed to clear session' }, { status: 500 })
  }
}