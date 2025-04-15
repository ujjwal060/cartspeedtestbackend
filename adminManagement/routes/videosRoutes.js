import express from 'express';
import {verifyTokenMiddleware}from "../adminmiddleware/adminAuthmiddleware.js"
import {uploadToS3} from "../../utils/awsS3api.js"
import {
    addVideos
}from "../controllers/videosController.js";


const router = express.Router();

router.post('/add',uploadToS3,addVideos);

export default router;