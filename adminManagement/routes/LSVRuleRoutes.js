import express from 'express';
import {
    createLSVRule,
    getGLSVRules,
    getRRLSVRules,
    createRRLSV
} from '../controllers/goodLSVRuleController.js';
const router = express.Router();

router.post('/addGLSVR', createLSVRule);
router.get('/getGLSV', getGLSVRules);
router.post('/addRRLSVR', createRRLSV);
router.get('/getRRLSV', getRRLSVRules);

export default router;