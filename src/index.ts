import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import jobRoutes from './routes/job.routes';
import applicationRoutes from './routes/application.routes';
import applyRoutes from './routes/apply.routes';
import userRoutes from './routes/user.routes';
import notificationRoutes from "./routes/notification.routes";

dotenv.config();

const app = express();
const port = process.env.PORT || 8000;

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

app.get('/', (req: Request, res: Response) => {
    res.json({ message: 'Welcome to JobPortal API v1' });
});

// Global Error Handler untuk menangkap Error Upload / AWS S3 sehingga menjadi JSON yang readable
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Global error:', err.message);
    res.status(500).json({ message: err.message || 'Internal Server Error' });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
