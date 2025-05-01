import express from 'express';
import { validateRequest } from '../../middleware/validationMiddleware.js';
import {
    adminValidationSchema,
    loginValidationSchema,
    setPasswordValidationSchema,
    adminValidationSchemaOTP
} from '../../validators/adminValidator.js';
import {
    adminRegister,
    login,
    forgatePassword,
    verifyOtp,
    setPassword,
    getProfileById,
    toggleAdminStatus
} from '../controllers/adminAuthController.js';

const router = express.Router();

router.post('/register', validateRequest(adminValidationSchema), adminRegister);
router.post('/login', validateRequest(loginValidationSchema), login);
router.post('/forgote', forgatePassword);
router.post('/verifyotp',validateRequest(adminValidationSchemaOTP), verifyOtp);
router.post('/setPass', validateRequest(setPasswordValidationSchema), setPassword);
router.get('/profile/:id', getProfileById);
router.get('/profile/:id', getProfileById);
router.put('/status:/adminId',toggleAdminStatus);

export default router;