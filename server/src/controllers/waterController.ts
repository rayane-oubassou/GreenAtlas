import { Response, NextFunction } from 'express';
import WaterData from '../models/WaterData';
import { AuthRequest } from '../middleware/auth';

export const getWaterData = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { location, limit = '50' } = req.query;
    const filter: Record<string, unknown> = {};
    if (location) filter.location = { $regex: location, $options: 'i' };

    const data = await WaterData.find(filter)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit as string, 10));

    // Aggregate latest per location for summary
    const summary = await WaterData.aggregate([
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: '$source',
          level: { $first: '$level' },
          location: { $first: '$location' },
          status: { $first: '$status' },
          lastUpdated: { $first: '$timestamp' },
        },
      },
    ]);

    res.json({ success: true, data, summary });
  } catch (error) {
    next(error);
  }
};

export const addWaterData = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { level, location, source, notes } = req.body;

    const waterData = await WaterData.create({
      level: parseFloat(level),
      location,
      source,
      notes,
      timestamp: new Date(),
    });

    res.status(201).json({
      success: true,
      message: 'Water data recorded successfully',
      data: waterData,
    });
  } catch (error) {
    next(error);
  }
};

export const getWaterTrends = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const trends = await WaterData.aggregate([
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: {
            source: '$source',
            year: { $year: '$timestamp' },
            month: { $month: '$timestamp' },
            day: { $dayOfMonth: '$timestamp' },
          },
          avgLevel: { $avg: '$level' },
          date: { $first: '$timestamp' },
        },
      },
      { $sort: { date: 1 } },
      { $limit: 90 },
    ]);

    res.json({ success: true, data: trends });
  } catch (error) {
    next(error);
  }
};
