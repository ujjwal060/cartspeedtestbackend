import express from 'express';
import{getAssesmentForUser,submitTestAttempt} from '../controllers/userAssesmentController.js';

const router = express.Router();

router.post('/getAsses',getAssesmentForUser);
router.post('/SubmitTest',submitTestAttempt);

export default router;
