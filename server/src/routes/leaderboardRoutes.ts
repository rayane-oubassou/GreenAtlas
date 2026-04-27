import { Router } from 'express';
import { getLeaderboard } from '../controllers/leaderboardController';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect);
router.get('/', getLeaderboard);

export default router;
