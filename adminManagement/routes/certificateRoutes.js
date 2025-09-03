import express from 'express';
import {getAllCertificateAdmin,getLatestCertificates} from '../controllers/certificateController.js';

const router = express.Router();

router.post('/getAllCertificate',getAllCertificateAdmin);
router.get('/latest', getLatestCertificates);

export default router;