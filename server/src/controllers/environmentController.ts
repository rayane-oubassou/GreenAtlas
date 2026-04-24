import { Request, Response, NextFunction } from 'express';
import { fetchFireHotspots } from '../services/firmsService';

export const getEnvironmentData = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const hotspots = await fetchFireHotspots();

    res.json({
      success: true,
      data: {
        fireHotspots: hotspots,
        totalHotspots: hotspots.length,
        source: 'NASA FIRMS VIIRS SNPP',
        region: 'Ifrane Province, Morocco',
        boundingBox: { west: -7, south: 32, east: -3, north: 35 },
        timestamp: new Date(),
      },
    });
  } catch (error) {
    next(error);
  }
};
