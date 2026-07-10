/**
 * Lightweight ZIP → climate zone for schedule filtering.
 * US-first heuristic; not a substitute for IECC maps.
 */
export type ClimateZone = 'cold' | 'mixed' | 'hot-humid' | 'hot-dry' | 'unknown';

/** Map first digit of ZIP to a coarse band (educational heuristic). */
export function climateZoneFromZip(zip?: string | null): ClimateZone {
  if (!zip) return 'unknown';
  const digits = zip.replace(/\D/g, '');
  if (digits.length < 1) return 'unknown';
  const first = digits[0];
  // Very coarse continental US sketch
  switch (first) {
    case '0':
    case '1':
    case '2':
      return 'cold'; // NE / mid-Atlantic-ish
    case '3':
      return 'hot-humid'; // SE
    case '4':
    case '5':
    case '6':
      return 'mixed'; // Midwest / plains
    case '7':
      return 'hot-humid'; // South Central (mixed in reality)
    case '8':
      return 'hot-dry'; // Mountain / SW
    case '9':
      return 'mixed'; // West coast varies wildly
    default:
      return 'unknown';
  }
}

export function zoneMatches(
  templateZones: string[] | undefined,
  zone: ClimateZone
): boolean {
  if (!templateZones || templateZones.length === 0) return true;
  if (templateZones.includes('*')) return true;
  if (zone === 'unknown') return templateZones.includes('*') || templateZones.includes('mixed');
  return templateZones.includes(zone);
}
