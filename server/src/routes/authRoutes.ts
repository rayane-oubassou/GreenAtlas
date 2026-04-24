import { Router } from 'express';
import { register, login, getMe } from '../controllers/authController';
import { protect } from '../middleware/auth';
import { validateRegister, validateLogin } from '../middleware/validation';

const router = Router();

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.get('/me', protect, getMe);

export default router;
