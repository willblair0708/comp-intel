import seed from './seed';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: Request) {
  const { url, options } = await req.json();
  try {
    // Use the public Google Sheets URL directly here
    const documents = await seed(url, 1, process.env.PINECONE_INDEX!, options);
    return NextResponse.json({ success: true, documents });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed crawling" });
  }
}