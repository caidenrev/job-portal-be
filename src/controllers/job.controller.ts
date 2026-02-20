import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all jobs (For Applicants and HR)
export const getJobs = async (req: Request, res: Response) => {
    try {
        const jobs = await prisma.job.findMany({
            include: {
                company: {
                    select: { name: true, location: true, logoUrl: true }
                }
            }
        });
        res.json(jobs);
    } catch (error) {
        console.error('Error fetching jobs:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Create a new job (For HR only)
export const createJob = async (req: Request, res: Response) => {
    try {
        const { companyId, title, description, requirements, type } = req.body;

        // In a real app, companyId should be derived from the logged-in User's HR profile
        const newJob = await prisma.job.create({
            data: {
                companyId,
                title,
                description,
                requirements,
                type,
            }
        });

        res.status(201).json({ message: 'Job created successfully', job: newJob });
    } catch (error) {
        console.error('Error creating job:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
