import { NextResponse } from 'next/server';
import { getAllCarriers, addCarrier, clearAllCarriers } from '@/lib/db';
import { fetchFMCSAStatus } from '@/lib/fmcsa';

export async function GET() {
  try {
    const carriers = await getAllCarriers();
    return NextResponse.json(carriers);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch carriers' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.dotNumber) {
      return NextResponse.json({ error: 'Missing dotNumber' }, { status: 400 });
    }
    
    // Auto-fetch the data from FMCSA API
    const fmcsaData = await fetchFMCSAStatus(body.dotNumber);
    const legalName = fmcsaData.legalName || 'Unknown Carrier';

    await addCarrier({
      dotNumber: body.dotNumber,
      name: legalName,
      insurance_amount: fmcsaData.insurance_amount,
      power_units: fmcsaData.power_units,
      oos_rate: fmcsaData.oos_rate,
      address: fmcsaData.address,
      phone: fmcsaData.phone,
      safety_rating: fmcsaData.safety_rating
    });
    return NextResponse.json({ success: true, legalName });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add carrier' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await clearAllCarriers();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to clear carriers' }, { status: 500 });
  }
}
