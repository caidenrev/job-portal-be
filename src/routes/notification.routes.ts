import { Router } from "express";
import { getUserNotifications, markAsRead, markAllAsRead } from "../controllers/notification.controller";
import { verifyToken } from "../middlewares/auth.middleware";

const router = Router();

// Apply middleware mapped to specific routes
router.use(verifyToken);

// Routes
router.get("/", getUserNotifications);
router.patch("/read-all", markAllAsRead);
router.patch("/:id/read", markAsRead);

export default router;
