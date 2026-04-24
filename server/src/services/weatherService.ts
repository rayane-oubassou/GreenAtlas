import axios from 'axios';

export interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  description: string;
  icon: string;
  rainfall: number;
  pressure: number;
  visibility: number;
  location: string;
  country: string;
  fireRiskLevel: string;
  fireRiskScore: number;
  timestamp: Date;
}

interface OpenWeatherResponse {
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
    pressure: number;
  };
  wind: { speed: number };
  weather: Array<{ description: string; icon: string }>;
  rain?: { '1h'?: number; '3h'?: number };
  visibility: number;
  name: string;
  sys: { country: string };
}

// In-memory cache to avoid hammering the API
let cache: { data: WeatherData; expiresAt: number } | null = null;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

const computeFireRisk = (
  temperature: number,
  humidity: number,
  windSpeed: number
): { level: string; score: number } => {
  // Weighted score: high temp + low humidity + high wind = high fire risk
  const tempScore = Math.max(0, (temperature - 10) * 1.5);
  const humidityScore = Math.max(0, (60 - humidity) * 0.8);
  const windScore = windSpeed * 1.2;
  const score = Math.min(100, tempScore + humidityScore + windScore);

  let level: string;
  if (score >= 80) level = 'Extreme';
  else if (score >= 60) level = 'Very High';
  else if (score >= 40) level = 'High';
  else if (score >= 20) level = 'Medium';
  else level = 'Low';

  return { level, score: Math.round(score) };
};

export const fetchWeatherData = async (): Promise<WeatherData> => {
  if (cache && Date.now() < cache.expiresAt) {
    return cache.data;
  }

  const apiKey = process.env.OPENWEATHER_API_KEY;
  const lat = process.env.IFRANE_LAT || '33.5228';
  const lon = process.env.IFRANE_LON || '-5.1071';

  if (!apiKey || apiKey === 'your_openweathermap_api_key') {
    // Return realistic mock data when API key not configured
    return generateMockWeather();
  }

  try {
    const response = await axios.get<OpenWeatherResponse>(
      `https://api.openweathermap.org/data/2.5/weather`,
      {
        params: { lat, lon, appid: apiKey, units: 'metric' },
        timeout: 8000,
      }
    );

    const d = response.data;
    const rainfall = d.rain?.['1h'] || d.rain?.['3h'] || 0;
    const { level, score } = computeFireRisk(d.main.temp, d.main.humidity, d.wind.speed);

    const weatherData: WeatherData = {
      temperature: Math.round(d.main.temp * 10) / 10,
      feelsLike: Math.round(d.main.feels_like * 10) / 10,
      humidity: d.main.humidity,
      windSpeed: Math.round(d.wind.speed * 3.6 * 10) / 10, // m/s to km/h
      description: d.weather[0].description,
      icon: d.weather[0].icon,
      rainfall,
      pressure: d.main.pressure,
      visibility: Math.round(d.visibility / 1000),
      location: d.name,
      country: d.sys.country,
      fireRiskLevel: level,
      fireRiskScore: score,
      timestamp: new Date(),
    };

    cache = { data: weatherData, expiresAt: Date.now() + CACHE_TTL_MS };
    return weatherData;
  } catch (error) {
    console.error('Weather API error, using mock data:', error);
    return generateMockWeather();
  }
};

const generateMockWeather = (): WeatherData => {
  const temperature = 18 + Math.random() * 10;
  const humidity = 50 + Math.random() * 30;
  const windSpeed = 10 + Math.random() * 20;
  const { level, score } = computeFireRisk(temperature, humidity, windSpeed);

  return {
    temperature: Math.round(temperature * 10) / 10,
    feelsLike: Math.round((temperature - 2) * 10) / 10,
    humidity: Math.round(humidity),
    windSpeed: Math.round(windSpeed * 10) / 10,
    description: 'partly cloudy',
    icon: '02d',
    rainfall: Math.random() > 0.7 ? Math.round(Math.random() * 5 * 10) / 10 : 0,
    pressure: 1013 + Math.round(Math.random() * 20 - 10),
    visibility: 10,
    location: 'Ifrane',
    country: 'MA',
    fireRiskLevel: level,
    fireRiskScore: score,
    timestamp: new Date(),
  };
};
