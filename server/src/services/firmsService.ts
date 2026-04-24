import axios from 'axios';

export interface FireHotspot {
  latitude: number;
  longitude: number;
  brightness: number;
  confidence: number;
  acquiredDate: string;
  acquiredTime: string;
  satellite: string;
  frp: number;
}

// In-memory cache for FIRMS data (30 minute TTL)
let cache: { data: FireHotspot[]; expiresAt: number } | null = null;
const CACHE_TTL_MS = 30 * 60 * 1000;

// Bounding box for Ifrane province region
const BBOX = '-7,32,-3,35'; // west,south,east,north

const parseCSV = (csvText: string): FireHotspot[] => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const hotspots: FireHotspot[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    if (values.length < 5) continue;

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = values[idx]?.trim() || ''; });

    const lat = parseFloat(row['latitude'] || row['lat'] || '0');
    const lon = parseFloat(row['longitude'] || row['lon'] || '0');
    const brightness = parseFloat(row['brightness'] || row['bright_ti4'] || '0');
    const confidence = parseInt(row['confidence'] || '50', 10);
    const frp = parseFloat(row['frp'] || '0');

    if (!isNaN(lat) && !isNaN(lon)) {
      hotspots.push({
        latitude: lat,
        longitude: lon,
        brightness,
        confidence,
        acquiredDate: row['acq_date'] || new Date().toISOString().split('T')[0],
        acquiredTime: row['acq_time'] || '0000',
        satellite: row['satellite'] || 'N',
        frp,
      });
    }
  }

  return hotspots;
};

export const fetchFireHotspots = async (): Promise<FireHotspot[]> => {
  if (cache && Date.now() < cache.expiresAt) {
    return cache.data;
  }

  const mapKey = process.env.NASA_FIRMS_MAP_KEY;

  if (!mapKey || mapKey === 'your_nasa_firms_map_key') {
    return generateMockHotspots();
  }

  try {
    const response = await axios.get<string>(
      `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${mapKey}/VIIRS_SNPP_NRT/${BBOX}/1`,
      { timeout: 10000, responseType: 'text' }
    );

    const hotspots = parseCSV(response.data);
    cache = { data: hotspots, expiresAt: Date.now() + CACHE_TTL_MS };
    return hotspots;
  } catch (error) {
    console.error('NASA FIRMS API error, using mock data:', error);
    return generateMockHotspots();
  }
};

const generateMockHotspots = (): FireHotspot[] => {
  // Realistic mock hotspots near Ifrane forest area
  const baseLat = 33.5228;
  const baseLon = -5.1071;
  const count = Math.floor(Math.random() * 5);

  return Array.from({ length: count }, (_, i) => ({
    latitude: baseLat + (Math.random() - 0.5) * 1.5,
    longitude: baseLon + (Math.random() - 0.5) * 1.5,
    brightness: 300 + Math.random() * 100,
    confidence: 50 + Math.floor(Math.random() * 50),
    acquiredDate: new Date().toISOString().split('T')[0],
    acquiredTime: `${String(Math.floor(Math.random() * 24)).padStart(2, '0')}${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
    satellite: i % 2 === 0 ? 'N' : 'A',
    frp: Math.round(Math.random() * 50 * 10) / 10,
  }));
};
