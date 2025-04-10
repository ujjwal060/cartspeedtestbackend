import express from 'express';
import adminAuthRoutes from './adminAuthRoutes.js';

const router = express.Router();

router.use('/admin', adminAuthRoutes);

export default router;
