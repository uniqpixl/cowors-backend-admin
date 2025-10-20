import { NextResponse } from 'next/server'
import * as csc from '@countrystatecity/countries'

export async function GET() {
  try {
    const states = await csc.getStatesOfCountry('IN')
    return NextResponse.json(states || [])
  } catch (e) {
    return NextResponse.json([], { status: 200 })
  }
}