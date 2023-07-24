import seed from './seed'
import { NextResponse } from 'next/server';

export const runtime = 'edge'

export async function POST(req: Request) {
  const { url, options } = await req.json()
  try {
    const documents = await seed('https://drive.google.com/uc?export=download&id=1wpUjAkzzziGyct_WeNsqzwQb073Gjepr', 1, process.env.PINECONE_INDEX!, options)
    return NextResponse.json({ success: true, documents })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed crawling" })
  }
}