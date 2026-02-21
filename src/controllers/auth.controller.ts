import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const register = async (req: Request, res: Response) => {
    try {
        const { name, email, password, role, phone } = req.body;

        // Check if user exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Use transaction to ensure both User and Company (if HR) are created safely
        const newUser = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                    role: role || 'APPLICANT',
                    phone,
                },
            });

            if (role === 'HR') {
                const { companyName, companyLocation, companyDescription } = req.body;
                if (!companyName) {
                    throw new Error("Company Name is required for HR registration");
                }
                await tx.company.create({
                    data: {
                        userId: user.id,
                        name: companyName,
                        location: companyLocation || "Indonesia",
                        description: companyDescription || null
                    }
                });
            }

            return user;
        });

        res.status(201).json({ message: 'User registered successfully', user: { id: newUser.id, email: newUser.email, role: newUser.role } });
    } catch (error: any) {
        console.error('Registration Error:', error);

        // Handle specific transaction error gracefully
        if (error.message === "Company Name is required for HR registration") {
            return res.status(400).json({ message: error.message });
        }

        res.status(500).json({ message: 'Internal server error' });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generate token
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET as string,
            { expiresIn: '1d' }
        );

        res.json({ message: 'Login successful', token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
