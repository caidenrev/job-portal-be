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
            data: { status },
            include: { job: { include: { company: true } } }
        });

        // Trigger Notification to Applicant
        let notifMsg = `Status lamaranmu diperbarui menjadi ${status}.`;
        if (status === 'REVIEWED') notifMsg = `Kabar baik! Lamaranmu untuk posisi ${updatedApplication.job.title} di ${updatedApplication.job.company?.name || 'Perusahaan'} sedang ditinjau HR.`;
        if (status === 'INTERVIEW') notifMsg = `Selamat! Kamu terpilih untuk lanjut ke tahap Wawancara untuk posisi ${updatedApplication.job.title} di ${updatedApplication.job.company?.name || 'Perusahaan'}.`;
        if (status === 'ACCEPTED') notifMsg = `Luar biasa! Kamu dinyatakan Lolos untuk posisi ${updatedApplication.job.title} di ${updatedApplication.job.company?.name || 'Perusahaan'}.`;
        if (status === 'REJECTED') notifMsg = `Maaf, lamaranmu untuk posisi ${updatedApplication.job.title} di ${updatedApplication.job.company?.name || 'Perusahaan'} belum sesuai dengan kualifikasi saat ini.`;

        await prisma.notification.create({
            data: {
                userId: updatedApplication.applicantId,
                title: "Pembaruan Status Lamaran",
                message: notifMsg,
                type: "APPLICATION_STATUS",
                relatedId: updatedApplication.id
            }
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
