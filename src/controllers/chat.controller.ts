import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Inisasialisasi Percakapan Baru atau Dapatkan yang sudah ada
export const getOrCreateConversation = async (req: Request, res: Response) => {
    try {
        const { hrId, applicantId, jobId } = req.body;

        let conversation = await prisma.conversation.findUnique({
            where: {
                jobId_hrId_applicantId: {
                    jobId: parseInt(jobId),
                    hrId: parseInt(hrId),
                    applicantId: parseInt(applicantId)
                }
            }
        });

        if (!conversation) {
            conversation = await prisma.conversation.create({
                data: {
                    jobId: parseInt(jobId),
                    hrId: parseInt(hrId),
                    applicantId: parseInt(applicantId)
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
