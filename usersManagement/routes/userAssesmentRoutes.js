import express from 'express';
import{getAssesmentForUser,submitTestAttempt,enrollForCertificate,getAllCerificate} from '../controllers/userAssesmentController.js';

const router = express.Router();

router.post('/getAsses',getAssesmentForUser);
router.post('/SubmitTest',submitTestAttempt);
router.post('/enrollForCertificate',enrollForCertificate);
router.get('/getAllCertificate',getAllCerificate);

export default router;
