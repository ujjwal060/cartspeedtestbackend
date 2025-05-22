import express from 'express';
import {
getGLSVRule,getRRLSVRule
}from "../controllers/userLSVRulesController.js"
const router = express.Router();

router.get('/getGLSV',getGLSVRule);
router.get('/getRRLSV',getRRLSVRule);


export default router;