import { Router } from 'express';
import { getCandidates, updateApplicationStatus, getMyApplications } from '../controllers/application.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

// Route for applicant to get their own applications
router.get('/my', verifyToken, getMyApplications);

// Only logged-in HR can see and update candidates
router.get('/', verifyToken, getCandidates);
router.patch('/:id/status', verifyToken, updateApplicationStatus);

export default router;
