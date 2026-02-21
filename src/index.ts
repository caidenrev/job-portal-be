import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import jobRoutes from './routes/job.routes';
import applicationRoutes from './routes/application.routes';
import applyRoutes from './routes/apply.routes';
import userRoutes from './routes/user.routes';
import notificationRoutes from "./routes/notification.routes";
import chatRoutes from "./routes/chat.routes";
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const port = process.env.PORT || 8000;
const httpServer = createServer(app);
const prisma = new PrismaClient();

// Setup WebSocket Server
const io = new Server(httpServer, {
    cors: {
        origin: "*", // Adjust for production
        methods: ["GET", "POST", "PATCH"]
    }
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/apply', applyRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/chat", chatRoutes);

app.get('/', (req: Request, res: Response) => {
    res.json({ message: 'Welcome to JobPortal API v1' });
});

// WebSocket Events
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Join room percakapan spesifik
    socket.on('join_room', (conversationId) => {
        socket.join(`chat_${conversationId}`);
        console.log(`Socket ${socket.id} joined room chat_${conversationId}`);
    });

    // Menangani pesan baru
    socket.on('send_message', async (data) => {
        const { conversationId, senderId, content } = data;

        try {
            // Simpan pesan ke DB
            const savedMessage = await prisma.message.create({
                data: {
                    conversationId: parseInt(conversationId),
                    senderId: parseInt(senderId),
                    content: content
                },
                include: {
                    sender: { select: { id: true, name: true } }
                }
            });

            // Update timestamp percakapan
            await prisma.conversation.update({
                where: { id: parseInt(conversationId) },
                data: { updatedAt: new Date() }
            });

            // Broadcast pesan ke seluruh user di room tersebut (HR & Applicant)
            io.to(`chat_${conversationId}`).emit('receive_message', savedMessage);

            // Juga broadcast update inbox global agar urutan chat ter-update
            io.emit('inbox_update', { conversationId });

        } catch (error) {
            console.error('Socket send_message error:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

// Global Error Handler untuk menangkap Error Upload / AWS S3 sehingga menjadi JSON yang readable
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Global error:', err.message);
    res.status(500).json({ message: err.message || 'Internal Server Error' });
});

httpServer.listen(port, () => {
    console.log(`HTTP/WS Server is running on port ${port}`);
});
