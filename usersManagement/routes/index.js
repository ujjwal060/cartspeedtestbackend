import express from 'express';
import userRoutes from './userRoutes.js';
import videosRoutes from './videosRoutes.js';
import userLocationroutes from '../routes/userLocationRoutes.js';
import {authenticateUser} from '../../middleware/authMiddleware.js';
import userAssesmentRoutes from './userAssesmentRoutes.js';
import lsvRuleRoutes from './lsvRuleRoutes.js';
import {checkIsAdminActive} from '../../middleware/checkMiddleware.js';

const router = express.Router();

router.use('/users', userRoutes);
router.use('/user/video',authenticateUser,checkIsAdminActive,videosRoutes);
router.use('/user/location',authenticateUser,checkIsAdminActive,userLocationroutes);
router.use('/user/asses',authenticateUser,checkIsAdminActive,userAssesmentRoutes);
router.use('/user/lsv',authenticateUser,checkIsAdminActive,lsvRuleRoutes);

export default router;
