import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Inisasialisasi Percakapan Baru atau Dapatkan yang sudah ada
export const getOrCreateConversation = async (req: Request, res: Response) => {
    try {
        const { hrId, applicantId, jobId } = req.body;

        const parsedJobId = parseInt(jobId);
        const parsedHrId = parseInt(hrId);
        const parsedApplicantId = parseInt(applicantId);

        if (isNaN(parsedJobId) || isNaN(parsedHrId) || isNaN(parsedApplicantId)) {
            return res.status(400).json({ message: "Invalid payload: jobId, hrId, and applicantId must be valid numbers" });
        }

        let conversation = await prisma.conversation.findUnique({
            where: {
                jobId_hrId_applicantId: {
                    jobId: parsedJobId,
                    hrId: parsedHrId,
                    applicantId: parsedApplicantId
                }
            }
        });

        if (!conversation) {
            conversation = await prisma.conversation.create({
                data: {
                    jobId: parsedJobId,
                    hrId: parsedHrId,
                    applicantId: parsedApplicantId
                }
            });
        }

        res.json(conversation);
    } catch (error) {
        console.error('Error in getOrCreateConversation:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Dapatkan semua percakapan untuk user (sebagai HR atau Applicant)
export const getConversations = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const role = (req as any).user.role;

        const conversations = await prisma.conversation.findMany({
            where: role === 'HR' ? { hrId: userId } : { applicantId: userId },
            include: {
                hr: { select: { id: true, name: true, profileImageUrl: true } },
                applicant: { select: { id: true, name: true, profileImageUrl: true } },
                job: { select: { id: true, title: true, company: { select: { name: true } } } },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            },
            orderBy: { updatedAt: 'desc' }
        });

        res.json(conversations);
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Dapatkan semua pesan dalam satu riwayat percakapan 
export const getMessages = async (req: Request, res: Response) => {
    try {
        const { conversationId } = req.params;

        const messages = await prisma.message.findMany({
            where: { conversationId: parseInt(conversationId) },
            orderBy: { createdAt: 'asc' },
            include: {
                sender: { select: { id: true, name: true } }
            }
        });

        res.json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
