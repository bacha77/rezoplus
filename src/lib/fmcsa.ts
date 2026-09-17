export type FMCSAStatus = {
  dotNumber: string;
  legalName?: string;
  insurance_status: string;
  authority_status: string;
  safety_score: number;
  insurance_amount?: number;
  power_units?: number;
  oos_rate?: number;
  address?: string;
  phone?: string;
  safety_rating?: string;
};

export const fetchFMCSAStatus = async (dotNumber: string): Promise<FMCSAStatus> => {
  const apiKey = process.env.FMCSA_API_KEY;
  
  if (apiKey) {
    try {
      const res = await fetch(`https://mobile.fmcsa.dot.gov/qc/services/carriers/${dotNumber}?webKey=${apiKey}`);
      const data = await res.json();
      
      const carrierContent = data.content?.carrier || {};
      
      // Determine statuses based on API response fields
      const allowedToOperate = carrierContent.allowedToOperate === 'Y';
      const bipdInsuranceOnFile = carrierContent.bipdInsuranceOnFile !== '0';
      
      // Extended fields extraction
      const insuranceAmount = carrierContent.bipdInsuranceRequired ? parseInt(carrierContent.bipdInsuranceRequired.replace(/\\D/g, '')) || 1000000 : 1000000;
      const powerUnits = carrierContent.totalPowerUnits || 1;
      const oosRate = carrierContent.driverOosRate || 0.0;
      const address = `${carrierContent.phyStreet || ''}, ${carrierContent.phyCity || ''}, ${carrierContent.phyState || ''} ${carrierContent.phyZipcode || ''}`;
      const phone = carrierContent.telephone || '';
      const safetyRating = carrierContent.safetyRating || 'Satisfactory';
      
      return {
        dotNumber,
        legalName: carrierContent.legalName || 'Unknown Carrier',
        insurance_status: bipdInsuranceOnFile ? 'ACTIVE' : 'DROPPED',
        authority_status: allowedToOperate ? 'AUTHORIZED' : 'REVOKED',
        safety_score: 100, // SMS score would require a separate call to /carriers/:dotNumber/basics
        insurance_amount: insuranceAmount,
        power_units: powerUnits,
        oos_rate: oosRate,
        address: address.trim() === ',  ' ? 'Address Unknown' : address,
        phone: phone,
        safety_rating: safetyRating
      };
    } catch (e) {
      console.error('Error calling FMCSA API for DOT:', dotNumber, e);
    }
  }

  // FALLBACK TO MOCK if API fails or no key is present
  const shouldDropInsurance = Math.random() > 0.8;
  const shouldRevokeAuthority = Math.random() > 0.9;
  const newScore = Math.floor(Math.random() * 100);

  return {
    dotNumber,
    legalName: `Carrier ${dotNumber}`,
    insurance_status: shouldDropInsurance ? 'DROPPED' : 'ACTIVE',
    authority_status: shouldRevokeAuthority ? 'REVOKED' : 'AUTHORIZED',
    safety_score: newScore,
    insurance_amount: 1000000,
    power_units: Math.floor(Math.random() * 50) + 1,
    oos_rate: parseFloat((Math.random() * 10).toFixed(1)),
    address: '123 Fake St, Springfield, IL 62701',
    phone: '555-0199',
    safety_rating: 'Satisfactory'
  };
};
