import express from 'express';
import {
    getVideos,
    updateVideoProgress
} from '../controllers/userVideoController.js'

const router = express.Router();
router.get('/getVideos', getVideos);
router.post('/updateVideo', updateVideoProgress);

export default router;