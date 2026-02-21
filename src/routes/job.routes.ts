import { Router } from 'express';
import { getJobs, getJobById, createJob, getMyJobs, getJobApplications } from '../controllers/job.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

// Publicly accessible for applicants
router.get('/', getJobs);
// Protected route to get HR's own jobs
router.get('/me', verifyToken, getMyJobs);

// Publicly accessible for applicants
router.get('/:id', getJobById);

// Protected route (Only logged-in HR can create jobs ideally)
router.post('/', verifyToken, createJob);

// Get applicants for a specific job
router.get('/:jobId/applications', verifyToken, getJobApplications);

export default router;
