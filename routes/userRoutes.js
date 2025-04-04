import express from 'express';
import { validateRequest } from '../middleware/validationMiddleware.js';
import {
    userValidationSchema,
    loginValidationSchema,
    setPasswordValidationSchema,
    userValidationSchemaOTP,
    updateProfileSchema
} from '../validators/userValidator.js';
import {
    registerUser,
    loginUser,
    forgatePassword,
    resendOtp,
    logOut,
    setPassword,
    changePassword,
    verifyOtp,
    getProfileById,
    updateProfile
} from '../controllers/userController.js';
import {
    authenticateUser,
    refreshToken
} from '../middleware/authMiddleware.js';


const router = express.Router();

router.post('/signup', validateRequest(userValidationSchema), registerUser);
router.post('/login', validateRequest(loginValidationSchema), loginUser);
router.post('/forgot-password', forgatePassword);
router.post('/set-password', validateRequest(setPasswordValidationSchema), setPassword)
router.post('/resend-otp', resendOtp);
router.post('/logout', logOut);
router.post('/changePassword', authenticateUser, validateRequest(setPasswordValidationSchema), changePassword);
router.post('/verifyOTP', validateRequest(userValidationSchemaOTP),verifyOtp);
router.post('/refreshToken', refreshToken);
router.get('/getProfile/:id',authenticateUser,getProfileById);
router.put('/updateProfile/:userId',validateRequest(updateProfileSchema),authenticateUser,updateProfile);

export default router;