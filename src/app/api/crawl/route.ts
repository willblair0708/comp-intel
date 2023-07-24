// route.ts

import seed from './seed'
import { NextResponse } from 'next/server';

export const runtime = 'edge'

export async function POST(req: Request) {
  const { url, limit, indexName, options } = await req.json()
  try {
    const documents = await seed(url, limit, indexName, options)
    return NextResponse.json({ success: true, documents })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed crawling" })
  }
}
