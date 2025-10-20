import { NextResponse } from 'next/server'
import * as csc from '@countrystatecity/countries'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const state = searchParams.get('state') || ''
    if (!state) {
      return NextResponse.json([])
    }
    const cities = await csc.getCitiesOfState('IN', state)
    return NextResponse.json(cities || [])
  } catch (e) {
    return NextResponse.json([])
  }
}