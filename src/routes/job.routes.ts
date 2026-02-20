import { Router } from 'express';
import { getJobs, createJob } from '../controllers/job.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

// Publicly accessible for applicants
router.get('/', getJobs);

// Protected route (Only logged-in HR can create jobs ideally)
router.post('/', verifyToken, createJob);

export default router;
