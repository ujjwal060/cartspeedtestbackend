import express from 'express';
import {
    getVideos
} from '../controllers/userVideoController.js'

const router = express.Router();
router.post('/getVideos', getVideos);

export default router;