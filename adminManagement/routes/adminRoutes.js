import express from 'express';
import adminAuthRoutes from './adminAuthRoutes.js';
import verifyTokenRoutes from './verifyTokenRoutes.js'
import { verifyTokenMiddleware } from '../adminmiddleware/adminAuthmiddleware.js';
import videoRoutes from "../routes/videosRoutes.js";

const router = express.Router();

router.use('/admin', adminAuthRoutes);
router.use('/admin/auth',verifyTokenRoutes);
router.use('/admin/video',verifyTokenMiddleware,videoRoutes);

export default router;
