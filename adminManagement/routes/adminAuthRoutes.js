import express from 'express';
import { validateRequest } from '../../middleware/validationMiddleware.js';
import {
    adminValidationSchema
} from '../../validators/adminValidator.js';
import {
    adminRegister
} from '../controllers/adminAuthController.js';

const router = express.Router();

router.post('/register', validateRequest(adminValidationSchema), adminRegister);

export default router;