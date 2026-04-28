import { ZH_NAMES } from "./zh-names";

export interface Airport {
  iata: string;
  icao: string;
  name_en: string;
  city: string;
  country: string;
  country_code: string;
  region: string;
  lat: number;
  lon: number;
}

export function getZhName(iata: string): string | undefined {
  return ZH_NAMES[iata];
}

export function searchAirports(airports: Airport[], query: string): Airport[] {
  if (!query.trim()) return airports;
  const q = query.trim().toUpperCase();
  const qLower = query.trim().toLowerCase();

  return airports.filter((a) => {
    const zhName = ZH_NAMES[a.iata];
    return (
      a.iata.includes(q) ||
      a.icao.toUpperCase().includes(q) ||
      a.name_en.toLowerCase().includes(qLower) ||
      a.city.toLowerCase().includes(qLower) ||
      a.country.toLowerCase().includes(qLower) ||
      (zhName && zhName.includes(query.trim()))
    );
  });
}
