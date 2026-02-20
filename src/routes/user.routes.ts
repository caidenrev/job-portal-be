import { Router } from 'express';
import { getProfile, updateProfile } from '../controllers/user.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

// Endpoint for current logged in user profile
import { uploadCV } from '../controllers/apply.controller';

router.get('/profile', verifyToken, getProfile);
router.put('/profile', verifyToken, uploadCV.single('cv'), updateProfile);

export default router;
