import { Response, NextFunction } from 'express';
import ForestData from '../models/ForestData';
import { AuthRequest } from '../middleware/auth';
import { fetchWeatherData } from '../services/weatherService';
import { FireRiskLevel } from '../models/ForestData';

const computeFireRisk = (
  temperature: number,
  humidity: number,
  windSpeed: number
): FireRiskLevel => {
  const tempScore = Math.max(0, (temperature - 10) * 1.5);
  const humidityScore = Math.max(0, (60 - humidity) * 0.8);
  const windScore = windSpeed * 1.2;
  const score = tempScore + humidityScore + windScore;

  if (score >= 80) return 'Extreme';
  if (score >= 60) return 'Very High';
  if (score >= 40) return 'High';
  if (score >= 20) return 'Medium';
  return 'Low';
};

export const getForestData = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = await ForestData.find().sort({ timestamp: -1 }).limit(50);

    const summary = await ForestData.aggregate([
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: '$location',
          fireRiskLevel: { $first: '$fireRiskLevel' },
          healthIndex: { $first: '$healthIndex' },
          area: { $first: '$area' },
          lastUpdated: { $first: '$timestamp' },
        },
      },
    ]);

    res.json({ success: true, data, summary });
  } catch (error) {
    next(error);
  }
};

export const addForestData = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { healthIndex, location, area, temperature, humidity, windSpeed, notes } = req.body;
    const fireRiskLevel = computeFireRisk(
      parseFloat(temperature),
      parseFloat(humidity),
      parseFloat(windSpeed)
    );

    const forestData = await ForestData.create({
      fireRiskLevel,
      healthIndex: parseFloat(healthIndex),
      location,
      area: parseFloat(area),
      temperature: parseFloat(temperature),
      humidity: parseFloat(humidity),
      windSpeed: parseFloat(windSpeed),
      notes,
      timestamp: new Date(),
    });

    res.status(201).json({
      success: true,
      message: 'Forest data recorded successfully',
      data: forestData,
    });
  } catch (error) {
    next(error);
  }
};

export const getForestWithWeather = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const [forestData, weather] = await Promise.all([
      ForestData.find().sort({ timestamp: -1 }).limit(10),
      fetchWeatherData(),
    ]);

    // Compute current fire risk from live weather
    const liveFireRisk = computeFireRisk(
      weather.temperature,
      weather.humidity,
      weather.windSpeed
    );

    res.json({
      success: true,
      data: {
        forestData,
        liveWeather: weather,
        liveFireRisk,
      },
    });
  } catch (error) {
    next(error);
  }
};
