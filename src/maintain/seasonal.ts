import { climateZoneFromZip, zoneMatches, type ClimateZone } from './climate';
import { getSeasonalChecklists, type SeasonalChecklist } from './templates';

export function currentSeason(date = new Date()): string {
  const m = date.getUTCMonth() + 1; // 1-12
  if (m >= 3 && m <= 5) return 'spring';
  if (m >= 6 && m <= 8) return 'summer';
  if (m >= 9 && m <= 11) return 'fall';
  return 'winter';
}

export function pickSeasonalChecklists(
  zip?: string | null,
  season?: string
): SeasonalChecklist[] {
  const zone: ClimateZone = climateZoneFromZip(zip);
  const s = season ?? currentSeason();
  return getSeasonalChecklists().filter(
    (c) => c.season === s && zoneMatches(c.climateZones, zone)
  );
}
