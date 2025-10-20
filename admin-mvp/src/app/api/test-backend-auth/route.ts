import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    console.log('[TEST BACKEND AUTH] Testing backend authentication with:', { email })
    
    // Test backend authentication directly
    const response = await fetch('http://localhost:5001/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    })
    
    console.log('[TEST BACKEND AUTH] Backend response status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.log('[TEST BACKEND AUTH] Backend error:', errorText)
      return NextResponse.json({ 
        success: false, 
        error: 'Backend authentication failed',
        status: response.status,
        details: errorText
      }, { status: 400 })
    }
    
    const data = await response.json()
    console.log('[TEST BACKEND AUTH] Backend response data:', data)
    
    return NextResponse.json({ 
      success: true, 
      data,
      message: 'Backend authentication successful'
    })
    
  } catch (error) {
    console.error('[TEST BACKEND AUTH] Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}