import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export const getProfile = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                phone: true,
                bio: true,
                experience: true,
                skills: true,
                savedCvUrl: true,
                company: true // Always include, Prisma will return null if APPLICANT
            }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Get Profile Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const updateProfile = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        const { name, phone, bio, experience, skills, currentPassword, newPassword } = req.body;

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const dataToUpdate: any = { name, phone, bio, experience, skills };

        // Cek jika ada file CV yang diunggah
        const uploadedCvUrl = (req.file as any)?.location;
        if (uploadedCvUrl) {
            dataToUpdate.savedCvUrl = uploadedCvUrl;
        }

        // Handle password update
        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({ message: 'Current password is required to change password' });
            }
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: 'Current password is incorrect' });
            }
            dataToUpdate.password = await bcrypt.hash(newPassword, 10);
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: dataToUpdate,
            select: { id: true, name: true, email: true, role: true, phone: true, bio: true, experience: true, skills: true, savedCvUrl: true }
        });

        res.json({ message: 'Profile updated successfully', user: updatedUser });
    } catch (error) {
        console.error('Update Profile Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
