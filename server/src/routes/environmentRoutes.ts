import { Router } from 'express';
import { getEnvironmentData } from '../controllers/environmentController';
import { protect } from '../middleware/auth';

const router = Router();

router.get('/', protect, getEnvironmentData);

export default router;
