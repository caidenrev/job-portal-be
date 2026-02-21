import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all applications for a specific HR/Company
export const getCandidates = async (req: Request, res: Response) => {
    try {
        // In a real app, you would filter by the logged-in User's companyId
        // For now, let's fetch all applications
        const applications = await prisma.application.findMany({
            include: {
                applicant: {
                    select: { name: true, email: true, phone: true }
                },
                job: {
                    select: { title: true }
                }
            }
        });

        res.json(applications);
    } catch (error) {
        console.error('Error fetching candidates:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Update an application status (e.g., from PENDING to REVIEWED)
export const updateApplicationStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const updatedApplication = await prisma.application.update({
            where: { id: parseInt(id) },
            data: { status }
        });

        res.json({ message: 'Status updated successfully', application: updatedApplication });
    } catch (error) {
        console.error('Error updating status:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get personal applications for logged-in Applicant
export const getMyApplications = async (req: Request, res: Response) => {
    try {
        const applicantId = (req as any).user.id;

        const myApplications = await prisma.application.findMany({
            where: { applicantId: applicantId },
            include: {
                job: {
                    select: {
                        title: true,
                        company: {
                            select: { name: true }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json(myApplications);
    } catch (error) {
        console.error('Error fetching my applications:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
