import express from 'express';
import {
    getVideos,
    updateVideoProgress,
    getSaftyVideo
} from '../controllers/userVideoController.js'

const router = express.Router();
router.get('/getVideos', getVideos);
router.post('/updateVideo', updateVideoProgress);
router.get('/getSaftyVideos', getSaftyVideo);

export default router;