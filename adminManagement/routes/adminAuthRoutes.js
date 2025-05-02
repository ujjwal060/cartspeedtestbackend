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
    toggleAdminStatus,
    getAllAdmins
} from '../controllers/adminAuthController.js';
import { verifyTokenMiddleware } from '../adminmiddleware/adminAuthmiddleware.js';

const router = express.Router();

router.post('/register', validateRequest(adminValidationSchema), adminRegister);
router.post('/login', validateRequest(loginValidationSchema), login);
router.post('/forgote', forgatePassword);
router.post('/verifyotp',validateRequest(adminValidationSchemaOTP), verifyOtp);
router.post('/setPass', validateRequest(setPasswordValidationSchema), setPassword);
router.get('/profile/:id',verifyTokenMiddleware, getProfileById);
router.put('/status:/adminId',verifyTokenMiddleware,toggleAdminStatus);
router.post('/getAllAdmins',verifyTokenMiddleware,getAllAdmins);


export default router;