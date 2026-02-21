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
                profileImageUrl: true,
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
        const uploadedCvUrl = (req.files as any)?.cv?.[0]?.location || (req.file as any)?.location;
        if (uploadedCvUrl) {
            dataToUpdate.savedCvUrl = uploadedCvUrl;
        }

        // Cek jika ada file Avatar yang diunggah
        const uploadedAvatarUrl = (req.files as any)?.avatar?.[0]?.location;
        if (uploadedAvatarUrl) {
            dataToUpdate.profileImageUrl = uploadedAvatarUrl;
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

        // Jalankan transaction jika update melibatkan User dan Company (untuk HR)
        const updatedUser = await prisma.$transaction(async (tx) => {
            const tempUser = await tx.user.update({
                where: { id: userId },
                data: dataToUpdate,
                select: { id: true, name: true, email: true, role: true, phone: true, bio: true, experience: true, skills: true, savedCvUrl: true, profileImageUrl: true }
            });

            // Update company info jika role adalah HR
            if (user.role === 'HR') {
                const { companyName, companyLocation, companyDescription } = req.body;

                // Setidaknya update yang dikirim tidak undefined
                if (companyName !== undefined || companyLocation !== undefined || companyDescription !== undefined) {
                    const companyDataToUpdate: any = {};
                    if (companyName) companyDataToUpdate.name = companyName;
                    if (companyLocation !== undefined) companyDataToUpdate.location = companyLocation;
                    if (companyDescription !== undefined) companyDataToUpdate.description = companyDescription;

                    // Pastikan HR benar-benar sudah punya company
                    const existingCompany = await tx.company.findUnique({ where: { userId } });
                    if (existingCompany) {
                        await tx.company.update({
                            where: { userId },
                            data: companyDataToUpdate
                        });
                    } else {
                        // Jika belum punya (backward compatibility untuk akun HR lama)
                        await tx.company.create({
                            data: {
                                userId,
                                name: companyName || `Perusahaan ${tempUser.name}`,
                                location: companyLocation || "Indonesia",
                                description: companyDescription || null
                            }
                        });
                    }
                }
            }

            return tempUser;
        });

        res.json({ message: 'Profile updated successfully', user: updatedUser });
    } catch (error) {
        console.error('Update Profile Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
