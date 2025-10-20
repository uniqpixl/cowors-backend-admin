import { NextRequest, NextResponse } from 'next/server';
import { signIn } from 'next-auth/react';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    console.log('Test auth endpoint called with:', { email, hasPassword: !!password });
    
    // Test direct backend call
    const backendResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    console.log('Backend response status:', backendResponse.status);
    const backendData = await backendResponse.json();
    console.log('Backend response data:', backendData);
    
    return NextResponse.json({
      success: true,
      backendResponse: backendData,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Test auth error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}