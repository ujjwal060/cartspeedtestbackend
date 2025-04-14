import express from 'express';
import adminAuthRoutes from './adminAuthRoutes.js';
import verifyTokenRoutes from './verifyTokenRoutes.js'

const router = express.Router();

router.use('/admin', adminAuthRoutes);
router.use('/admin/auth',verifyTokenRoutes);

export default router;
