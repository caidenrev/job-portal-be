import { Router } from 'express';
import { getProfile, updateProfile } from '../controllers/user.controller';
import { verifyToken } from '../middlewares/auth.middleware';
import { S3Client } from '@aws-sdk/client-s3';
import multer from 'multer';
import multerS3 from 'multer-s3';

const router = Router();

const s3 = new S3Client({
    region: process.env.AWS_REGION as string,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    }
});

const combinedUpload = multer({
    storage: multerS3({
        s3: s3,
        bucket: process.env.S3_BUCKET_NAME as string,
        acl: 'public-read',
        metadata: function (req, file, cb) {
            cb(null, { fieldName: file.fieldname });
        },
        key: function (req, file, cb) {
            if (file.fieldname === 'avatar') {
                cb(null, `avatars/${Date.now().toString()}-${file.originalname.replace(/\s+/g, '-')}`);
            } else {
                cb(null, `cvs/${Date.now().toString()}-${file.originalname.replace(/\s+/g, '-')}`);
            }
        },
    }),
});

router.get('/profile', verifyToken, getProfile);
router.put('/profile', verifyToken, combinedUpload.fields([{ name: 'cv', maxCount: 1 }, { name: 'avatar', maxCount: 1 }]), updateProfile);

export default router;
