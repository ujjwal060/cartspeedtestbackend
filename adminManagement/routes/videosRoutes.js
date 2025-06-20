import express from 'express';
import {uploadToS3} from "../../utils/awsS3api.js"
import {
    addVideos,
    getAllVideos,
    deleteVideos,
    videosStatus,
    checkExistingSection,
    addSafityVideos,
    getSaftyVideos,
    toggleSaftyVideoStatus,
    deleteSaftyVideo
}from "../controllers/videosController.js";


const router = express.Router();

router.post('/add',uploadToS3,addVideos);
router.post('/getAll',getAllVideos);
router.delete('/deleteVideo/:videoId',deleteVideos)
router.patch('/status/:id', videosStatus);
router.post('/checkExSection/:adminId',checkExistingSection);
router.post('/addSafityVideo',uploadToS3,addSafityVideos);
router.post('/getSeftyVideo',getSaftyVideos);
router.patch('/saftyStatus/:id', toggleSaftyVideoStatus);
router.delete('/deleteSaftyVideo/:id',deleteSaftyVideo)


export default router;