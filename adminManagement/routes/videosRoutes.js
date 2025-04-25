import express from 'express';
import {uploadToS3} from "../../utils/awsS3api.js"
import {
    addVideos,
    getAllVideos,
    deleteVideos,
    videosStatus
}from "../controllers/videosController.js";


const router = express.Router();

router.post('/add',uploadToS3,addVideos);
router.post('/getAll',getAllVideos);
router.delete('/deleteVideo/:videoId',deleteVideos)
router.patch('/status/:id', videosStatus);

export default router;