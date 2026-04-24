import { Request, Response, NextFunction } from 'express';
import { fetchWeatherData } from '../services/weatherService';

export const getWeather = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = await fetchWeatherData();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
