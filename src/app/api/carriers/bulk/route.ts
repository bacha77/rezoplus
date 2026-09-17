import { NextResponse } from 'next/server';
import { db, addCarrier } from '@/lib/db';
import { fetchFMCSAStatus } from '@/lib/fmcsa';

export async function POST(request: Request) {
  try {
    const { carriers } = await request.json();
    if (!carriers || !Array.isArray(carriers)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const insertPromises = carriers.map(async (carrier: any) => {
      if (!carrier.dotNumber) return;
      try {
        const fmcsaData = await fetchFMCSAStatus(carrier.dotNumber.toString());
        const legalName = fmcsaData.legalName || carrier.name || 'Unknown Carrier';
        await addCarrier({
          dotNumber: carrier.dotNumber.toString(),
          name: legalName,
          insurance_amount: fmcsaData.insurance_amount,
          power_units: fmcsaData.power_units,
          oos_rate: fmcsaData.oos_rate,
          address: fmcsaData.address,
          phone: fmcsaData.phone,
          safety_rating: fmcsaData.safety_rating
        });
      } catch(e) {
        console.error("Failed bulk insert", e);
      }
    });
    await Promise.all(insertPromises);
    return NextResponse.json({ success: true, count: carriers.length });
  } catch (error) {
    console.error('Error in bulk upload:', error);
    return NextResponse.json({ error: 'Failed to bulk add carriers' }, { status: 500 });
  }
}
