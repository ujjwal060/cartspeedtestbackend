import express from 'express';
import {
    createNotification,
    getNotifications,
    deleteNotification
} from '../controllers/notificationController.js';

const router = express.Router();

router.post('/notifications', createNotification);
router.get('/notifications', getNotifications);
router.delete('/notifications/:id', deleteNotification);

export default router;
