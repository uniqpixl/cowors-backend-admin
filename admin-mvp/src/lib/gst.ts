export const GST_CODE_MAP: Record<string, string> = {
  'andaman and nicobar islands': '35',
  'andhra pradesh': '37',
  'arunachal pradesh': '12',
  assam: '18',
  bihar: '10',
  chandigarh: '04',
  chhattisgarh: '22',
  'dadra and nagar haveli and daman and diu': '26',
  delhi: '07',
  goa: '30',
  gujarat: '24',
  haryana: '06',
  'himachal pradesh': '02',
  'jammu and kashmir': '01',
  jharkhand: '20',
  karnataka: '29',
  kerala: '32',
  ladakh: '38',
  lakshadweep: '31',
  'madhya pradesh': '23',
  maharashtra: '27',
  manipur: '14',
  meghalaya: '17',
  mizoram: '15',
  nagaland: '13',
  odisha: '21',
  puducherry: '34',
  punjab: '03',
  rajasthan: '08',
  sikkim: '11',
  'tamil nadu': '33',
  telangana: '36',
  tripura: '16',
  'uttar pradesh': '09',
  uttarakhand: '05',
  'west bengal': '19',
  // Synonyms / legacy names
  orissa: '21',
  pondicherry: '34',
  'daman and diu': '26',
  'dadra and nagar haveli': '26',
};

function normalizeName(name?: string): string {
  return (name || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/\s+/g, ' ')
    .trim();
}

// Client-safe GST code resolver based on state name
export function getGstCodeFromStateName(
  countryCode: string,
  stateName: string,
): string | null {
  if (!countryCode || !stateName) return null;
  if (countryCode !== 'IN') return null;
  const code = GST_CODE_MAP[normalizeName(stateName)];
  return code || null;
}