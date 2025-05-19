import express from 'express';
import{getAssesmentForUser} from '../controllers/userAssesmentController.js';

const router = express.Router();

router.post('/getAsses',getAssesmentForUser)

export default router;
