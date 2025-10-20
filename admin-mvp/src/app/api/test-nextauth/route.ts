import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/nextauth'

export async function GET(request: NextRequest) {
  try {
    // Test if NextAuth configuration is working
    const session = await getServerSession(authOptions)
    
    return NextResponse.json({
      success: true,
      session,
      timestamp: new Date().toISOString(),
      authOptionsValid: !!authOptions,
      hasProviders: !!authOptions.providers && authOptions.providers.length > 0,
      hasSecret: !!authOptions.secret,
      sessionStrategy: authOptions.session?.strategy
    })
  } catch (error) {
    console.error('NextAuth test error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    )
  }
}