import express from 'express';
import userRoutes from './userRoutes.js';
import videosRoutes from './videosRoutes.js';
import userLocationroutes from '../routes/userLocationRoutes.js';
import {authenticateUser} from '../../middleware/authMiddleware.js';

const router = express.Router();

router.use('/users', userRoutes);
router.use('/user/video',authenticateUser,videosRoutes);
router.use('/user/location',authenticateUser,userLocationroutes);

export default router;
