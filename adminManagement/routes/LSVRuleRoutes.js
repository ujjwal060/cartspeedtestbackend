import express from 'express';
import {uploadToS3} from "../../utils/awsS3api.js"
import {
    createLSVRule,
    getGLSVRules,
    getRRLSVRules,
    createRRLSV,
    deleteGLSV,
    deleteRRLSV
} from '../controllers/goodLSVRuleController.js';
const router = express.Router();

router.post('/addGLSVR',uploadToS3,createLSVRule);
router.post('/getGLSV', getGLSVRules);
router.post('/addRRLSVR',uploadToS3,createRRLSV);
router.post('/getRRLSV', getRRLSVRules);
router.delete('/deleteGLSV/:id', deleteGLSV);
router.delete('/deleteRRLSV/:id', deleteRRLSV);

export default router;