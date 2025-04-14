import express from 'express';
import {verifyToken,refreshToken} from '../adminmiddleware/adminAuthmiddleware.js';

const router = express.Router();

router.post('/verifyToken', verifyToken);
router.post('/refreshToken', refreshToken);


export default router;