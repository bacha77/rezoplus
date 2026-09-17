import { NextResponse } from 'next/server';
import { getCarrierHistory } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const history = await getCarrierHistory(Number(id));
    return NextResponse.json(history);
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}
