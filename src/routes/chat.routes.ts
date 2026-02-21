import { Router } from 'express';
import { getOrCreateConversation, getConversations, getMessages } from '../controllers/chat.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

// Semua rute perlu autentikasi
router.use(verifyToken as any);

router.post('/init', getOrCreateConversation as any);
router.get('/inbox', getConversations as any);
router.get('/:conversationId/messages', getMessages as any);

export default router;
