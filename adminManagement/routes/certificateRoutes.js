import express from 'express';
import {getAllCertificateAdmin,getLatestCertificates,deleteCertificate} from '../controllers/certificateController.js';

const router = express.Router();

router.post('/getAllCertificate',getAllCertificateAdmin);
router.get('/latest', getLatestCertificates);
router.delete('/delete/:id', deleteCertificate);


export default router;