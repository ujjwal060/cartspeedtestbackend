import express from 'express';
import userRoutes from './userRoutes.js';
import videosRoutes from './videosRoutes.js';
import userLocationroutes from '../routes/userLocationRoutes.js';
import {authenticateUser} from '../../middleware/authMiddleware.js';
import userAssesmentRoutes from './userAssesmentRoutes.js';
import lsvRuleRoutes from './lsvRuleRoutes.js';

const router = express.Router();

router.use('/users', userRoutes);
router.use('/user/video',authenticateUser,videosRoutes);
router.use('/user/location',authenticateUser,userLocationroutes);
router.use('/user/asses',authenticateUser,userAssesmentRoutes);
router.use('/user/lsv',authenticateUser,lsvRuleRoutes);

export default router;
