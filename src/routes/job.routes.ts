import { Router } from 'express';
import { getJobs, createJob, getMyJobs } from '../controllers/job.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

// Publicly accessible for applicants
router.get('/', getJobs);

// Protected route to get HR's own jobs
router.get('/me', verifyToken, getMyJobs);

// Protected route (Only logged-in HR can create jobs ideally)
router.post('/', verifyToken, createJob);

export default router;
