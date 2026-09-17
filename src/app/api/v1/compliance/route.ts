import { NextResponse } from 'next/server';
import { validateApiKey, getCarrierByDot, addCarrier } from '@/lib/db';
import { fetchFMCSAStatus } from '@/lib/fmcsa';

export async function GET(request: Request) {
  const apiKey = request.headers.get('x-api-key');
  
  if (!apiKey) {
    return NextResponse.json({ error: 'Missing x-api-key header' }, { status: 401 });
  }

  const isValid = await validateApiKey(apiKey);
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid API Key' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const dotNumber = searchParams.get('dotNumber');

  if (!dotNumber) {
    return NextResponse.json({ error: 'Missing dotNumber parameter' }, { status: 400 });
  }

  try {
    // 1. Check if we already track this carrier in the DB
    let carrier = await getCarrierByDot(dotNumber);

    if (carrier) {
      // Return cached DB state
      return NextResponse.json({
        dot_number: carrier.dot_number,
        name: carrier.name,
        insurance_status: carrier.insurance_status,
        authority_status: carrier.authority_status,
        safety_score: carrier.safety_score,
        last_checked: carrier.last_checked,
        source: 'cached'
      });
    }

    // 2. If not in DB, query FMCSA live
    const fmcsaStatus = await fetchFMCSAStatus(dotNumber);

    // 3. (Optional Upsell Feature) Add them to our watchlist automatically
    // The FMCSA API might not return the full company name in this basic response, 
    // so we'll use a placeholder or pull from the response if available.
    await addCarrier({ dotNumber, name: `Carrier ${dotNumber}` });

    return NextResponse.json({
      dot_number: fmcsaStatus.dotNumber,
      insurance_status: fmcsaStatus.insurance_status,
      authority_status: fmcsaStatus.authority_status,
      safety_score: fmcsaStatus.safety_score,
      source: 'live'
    });

  } catch (e) {
    console.error('API Error:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
