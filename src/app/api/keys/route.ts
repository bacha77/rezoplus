import { NextResponse } from 'next/server';
import { generateApiKey, getApiKeys } from '@/lib/db';

export async function GET() {
  try {
    const keys = await getApiKeys();
    return NextResponse.json(keys);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch API keys' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.customerName) {
      return NextResponse.json({ error: 'customerName is required' }, { status: 400 });
    }
    const newKey = await generateApiKey(body.customerName);
    return NextResponse.json({ success: true, key: newKey });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate API key' }, { status: 500 });
  }
}
