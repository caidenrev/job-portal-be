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

// Get HR's own jobs
export const getMyJobs = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;

        const company = await prisma.company.findUnique({ where: { userId } });
        if (!company) {
            return res.json([]); // HR hasn't created any company/jobs yet
        }

        const jobs = await prisma.job.findMany({
            where: { companyId: company.id },
            include: {
                _count: {
                    select: { applications: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(jobs);
    } catch (error) {
        console.error('Error fetching HR jobs:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Create a new job (For HR only)
export const createJob = async (req: Request, res: Response) => {
    try {
        const { title, description, requirements, type, location } = req.body;
        const userId = (req as any).user.id;

        // Auto-create or get Company profile for this HR user
        let company = await prisma.company.findUnique({ where: { userId } });

        if (!company) {
            const user = await prisma.user.findUnique({ where: { id: userId } });
            company = await prisma.company.create({
                data: {
                    userId,
                    name: `Perusahaan ${user?.name || "HR"}`,
                    location: location || "Indonesia"
                }
            });
        } else if (location && company.location !== location) {
            // Update company location based on latest job
            company = await prisma.company.update({
                where: { id: company.id },
                data: { location }
            });
        }

        const newJob = await prisma.job.create({
            data: {
                companyId: company.id,
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
