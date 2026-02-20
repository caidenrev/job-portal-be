import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { S3Client } from '@aws-sdk/client-s3';
import multer from 'multer';
import multerS3 from 'multer-s3';

const prisma = new PrismaClient();

// Konfigurasi AWS S3 v3
const s3 = new S3Client({
  region: process.env.AWS_REGION as string,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  }
});

export const uploadCV = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.S3_BUCKET_NAME as string,
    acl: 'public-read',
    metadata: function (req: Request, file: Express.Multer.File, cb: (error: any, metadata?: any) => void) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req: Request, file: Express.Multer.File, cb: (error: any, key?: string) => void) {
      cb(null, `cvs/${Date.now().toString()}-${file.originalname}`);
    },
  }),
});

// Apply to a job
export const applyJob = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.body;
    const applicantId = (req as any).user.id;

    // Ambil URL file yang sukses ter-upload di S3
    let cvUrl = (req.file as any)?.location;

    if (!cvUrl) {
      // Coba ambil dari profil user jika dia tidak upload file baru
      const user = await prisma.user.findUnique({ where: { id: applicantId } });
      if (user && user.savedCvUrl) {
        cvUrl = user.savedCvUrl;
      } else {
        return res.status(400).json({ message: 'File CV wajib diunggah atau lengkapi profil CV Anda terlebih dahulu' });
      }
    }

    const application = await prisma.application.create({
      data: {
        jobId: parseInt(jobId),
        applicantId,
        cvUrl,
        status: 'PENDING'
      }
    });

    res.status(201).json({ message: 'Application submitted successfully', application });
  } catch (error) {
    console.error('Error applying to job:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
