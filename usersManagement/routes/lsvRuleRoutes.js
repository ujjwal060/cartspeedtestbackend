import express from 'express';
import {
getGLSVRule
}from "../controllers/userLSVRulesController.js"
const router = express.Router();

router.get('/getGLSV',getGLSVRule);

export default router;