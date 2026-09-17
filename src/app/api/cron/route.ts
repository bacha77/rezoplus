import { NextResponse } from 'next/server';
import { runPollingLogic } from '@/lib/poller';

// This endpoint is meant to be hit by Vercel Cron
// You can secure it by checking for the CRON_SECRET environment variable
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  
  // Basic security to ensure only Vercel Cron (or someone with the secret) can trigger it
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    await runPollingLogic();
    return NextResponse.json({ success: true, message: 'Polled FMCSA successfully' });
  } catch (e) {
    console.error('Cron job error:', e);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
