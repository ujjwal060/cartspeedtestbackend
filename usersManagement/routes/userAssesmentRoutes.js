import express from 'express';
import{getAssesmentForUser,submitTestAttempt,enrollForCertificate} from '../controllers/userAssesmentController.js';

const router = express.Router();

router.post('/getAsses',getAssesmentForUser);
router.post('/SubmitTest',submitTestAttempt);
router.post('/enrollForCertificate',enrollForCertificate);

export default router;
