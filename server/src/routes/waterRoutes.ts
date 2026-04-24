import { Router } from 'express';
import { getWaterData, addWaterData, getWaterTrends } from '../controllers/waterController';
import { protect, authorize } from '../middleware/auth';
import { validateWaterData } from '../middleware/validation';

const router = Router();

router.use(protect);

router.get('/', getWaterData);
router.get('/trends', getWaterTrends);
router.post('/', authorize('admin', 'agent'), validateWaterData, addWaterData);

export default router;
