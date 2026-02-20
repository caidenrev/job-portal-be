import { Router } from 'express';
import { applyJob, uploadCV } from '../controllers/apply.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

// Endpoint apply dengan upload CV
router.post('/', verifyToken, uploadCV.single('cv'), applyJob);

export default router;
