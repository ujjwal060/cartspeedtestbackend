import express from 'express';
import {uploadToS3} from "../../utils/awsS3api.js"
import {
    createLSVRule,
    getGLSVRules,
    getRRLSVRules,
    createRRLSV
} from '../controllers/goodLSVRuleController.js';
const router = express.Router();

router.post('/addGLSVR',uploadToS3,createLSVRule);
router.get('/getGLSV', getGLSVRules);
router.post('/addRRLSVR',uploadToS3,createRRLSV);
router.get('/getRRLSV', getRRLSVRules);

export default router;