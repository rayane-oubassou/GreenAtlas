import { Router } from 'express';
import { getForestData, addForestData, getForestWithWeather } from '../controllers/forestController';
import { protect, authorize } from '../middleware/auth';
import { validateForestData } from '../middleware/validation';

const router = Router();

router.use(protect);

router.get('/', getForestData);
router.get('/live', getForestWithWeather);
router.post('/', authorize('admin', 'agent'), validateForestData, addForestData);

export default router;
