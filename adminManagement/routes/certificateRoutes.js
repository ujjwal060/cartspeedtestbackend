import express from 'express';
import {getAllCertificateAdmin} from '../controllers/certificateController.js';

const router = express.Router();

router.get('/getAllCertificate',getAllCertificateAdmin);

export default router;