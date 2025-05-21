import express from 'express';
import{
    createLSVRule
}from '../controllers/goodLSVRuleController.js';
const router = express.Router();

router.post('/addGLSVR',createLSVRule);

export default router;