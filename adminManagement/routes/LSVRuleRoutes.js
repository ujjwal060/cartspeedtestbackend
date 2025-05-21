import express from 'express';
import {
    createLSVRule,
    getGLSVRules
} from '../controllers/goodLSVRuleController.js';
const router = express.Router();

router.post('/addGLSVR', createLSVRule);
router.get('/getGLSV', getGLSVRules);

export default router;