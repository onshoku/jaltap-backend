import express from 'express';
import {
    register,
    verifyOTP,
    resendOTP,
    login,
    forgotPassword,
    resetPassword
} from '../main/jlpt/controllers/auth.controller';
import {
    registerValidator,
    verifyOTPValidator,
    resendOTPValidator,
    loginValidator,
    forgotPasswordValidator,
    resetPasswordValidator
} from '../main/jlpt/middlewares/auth.validator';

const router = express.Router();

router.post('/register', registerValidator, register);
router.post('/verify-otp', verifyOTPValidator, verifyOTP);
router.post('/resend-otp', resendOTPValidator, resendOTP);
router.post('/login', loginValidator, login);
router.post('/forgot', forgotPasswordValidator, forgotPassword);
router.post('/reset-password', resetPasswordValidator, resetPassword);

export default router;