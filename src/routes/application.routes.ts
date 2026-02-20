import { Router } from 'express';
import { getCandidates, updateApplicationStatus } from '../controllers/application.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

// Only logged-in HR can see and update candidates
router.get('/', verifyToken, getCandidates);
router.patch('/:id/status', verifyToken, updateApplicationStatus);

export default router;
