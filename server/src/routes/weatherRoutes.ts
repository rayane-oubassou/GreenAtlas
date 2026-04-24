import { Router } from 'express';
import { getWeather } from '../controllers/weatherController';
import { protect } from '../middleware/auth';

const router = Router();

router.get('/', protect, getWeather);

export default router;
