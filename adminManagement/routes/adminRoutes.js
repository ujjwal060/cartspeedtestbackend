import express from 'express';
import adminAuthRoutes from './adminAuthRoutes.js';
import verifyTokenRoutes from './verifyTokenRoutes.js'
import { verifyTokenMiddleware } from '../adminmiddleware/adminAuthmiddleware.js';
import videoRoutes from "./videosRoutes.js";
import questionRoutes from "./questionRoutes.js"

const router = express.Router();

router.use('/admin', adminAuthRoutes);
router.use('/admin/auth',verifyTokenRoutes);
router.use('/admin/video',verifyTokenMiddleware,videoRoutes);
router.use('/admin/QA',verifyTokenMiddleware,questionRoutes);

export default router;
