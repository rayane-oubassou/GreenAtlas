import { Router } from 'express';
import {
  getAllReports,
  getReportById,
  createReport,
  updateReport,
  deleteReport,
  getReportStats,
} from '../controllers/reportController';
import { protect, authorize } from '../middleware/auth';
import { validateReport } from '../middleware/validation';
import { upload } from '../middleware/upload';

const router = Router();

router.use(protect);

router.get('/stats', getReportStats);
router.get('/', getAllReports);
router.get('/:id', getReportById);
router.post('/', upload.single('image'), validateReport, createReport);
router.put('/:id', updateReport);
router.delete('/:id', authorize('agent', 'admin'), deleteReport);

export default router;
