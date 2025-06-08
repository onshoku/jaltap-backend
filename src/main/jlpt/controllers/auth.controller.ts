import { NextFunction, Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { UserModel } from '../user.model';
import { generateOTP, otpExpiryTime } from '../services/otp.service';
import { sendOTPEmail, sendPasswordResetEmail } from '../services/email.service';
import { config } from '../config';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';


export const register = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ 
            success: false,
            errors: errors.array() 
        });
        return;
    }

    const { fullName, email, phoneNumber, password } = req.body;

    try {
        // Check if user already exists
        const existingUser = await UserModel.findByEmail(email);
        if (existingUser) {
            res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
            return;
        }

        // Generate OTP
        const otp = generateOTP();
        const otpExpires = Math.floor(otpExpiryTime().getTime() / 1000); // Convert to Unix timestamp
        const role = 'student'

        // Create user with OTP (not verified yet)
        const user = await UserModel.create({
            fullName,
            email,
            phoneNumber,
            password,
            otp,
            otpExpires,
            role
        });

        // Send OTP email
        await sendOTPEmail(email, otp);

        // Respond without sensitive data
        const userResponse = {
            userId: user.userId,
            fullName: user.fullName,
            email: user.email,
            phoneNumber: user.phoneNumber,
            emailVerified: user.emailVerified
        };

        res.status(201).json({
            success: true,
            message: 'OTP sent to your email for verification',
            data: userResponse
        });

    } catch (error: any) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during registration',
            error: config.env === 'development' ? error.message : undefined
        });
    }
};

export const verifyOTP = async (req: Request, res: Response) => {
    const { email, otp } = req.body;

    try {
        const user = await UserModel.findByEmail(email);
        const now = Math.floor(Date.now() / 1000);

        if (!user || !user.otp || !user.otpExpires || user.otpExpires < now) {
            res.status(400).json({
                success: false,
                message: 'Invalid OTP or OTP expired'
            });
            return;
        }

        if (user.otp !== otp) {
            res.status(400).json({
                success: false,
                message: 'Invalid OTP'
            });
            return;
        }

        // Mark user as verified and clear OTP
        const updatedUser = await UserModel.update(user.userId, {
            emailVerified: true,
            otp: '',
            otpExpires: -1
        });

        if (!updatedUser) {
            throw new Error('Failed to update user');
        }

        // Respond without sensitive data
        const userResponse = {
            userId: updatedUser.userId,
            fullName: updatedUser.fullName,
            email: updatedUser.email,
            phoneNumber: updatedUser.phoneNumber,
            emailVerified: updatedUser.emailVerified
        };

        res.status(200).json({
            success: true,
            message: 'Email verified successfully',
            data: userResponse
        });

    } catch (error: any) {
        console.error('OTP verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during OTP verification',
            error: config.env === 'development' ? error.message : undefined
        });
    }
};

export const resendOTP = async (req: Request, res: Response) => {
    const { email } = req.body;

    try {
        const user = await UserModel.findByEmail(email);

        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
            return;
        }

        if (user.emailVerified) {
            res.status(400).json({
                success: false,
                message: 'Email is already verified'
            });
            return;
        }

        // Generate new OTP
        const otp = generateOTP();
        const otpExpires = Math.floor(otpExpiryTime().getTime() / 1000); // Convert to Unix timestamp

        // Update user with new OTP
        const updatedUser = await UserModel.update(user.userId, {
            otp,
            otpExpires
        });

        if (!updatedUser) {
            throw new Error('Failed to update user');
        }

        // Send OTP email
        await sendOTPEmail(email, otp);

        res.status(200).json({
            success: true,
            message: 'New OTP sent to your email'
        });

    } catch (error: any) {
        console.error('Resend OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while resending OTP',
            error: config.env === 'development' ? error.message : undefined
        });
    }
};

export const login = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ 
            success: false,
            errors: errors.array() 
        });
        return;
    }

    const { email, password } = req.body;

    try {
        const user = await UserModel.findByEmail(email);
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
            return;
        }

        const isMatch = await UserModel.comparePassword(user, password);
        if (!isMatch) {
            res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
            return;
        }

        if (!user.emailVerified) {
            res.status(403).json({
                success: false,
                message: 'Email not verified. Please verify your email first.'
            });
            return;
        }

        const token = jwt.sign(
            { userId: user.userId, email: user.email, role:user.role },
            config.jwt.secret as any,
            { expiresIn: config.jwt.expiresIn as any }
        );

        const userResponse = {
            userId: user.userId,
            fullName: user.fullName,
            email: user.email,
            role:user.role,
            phoneNumber: user.phoneNumber
        };

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            data: userResponse
        });
    } catch (error: any) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login',
            error: config.env === 'development' ? error.message : undefined
        });
    }
};

export const forgotPassword = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ 
            success: false,
            errors: errors.array() 
        });
        return;
    }

    const { email } = req.body;

    try {
        // Check if user exists
        const user = await UserModel.findByEmail(email);
        if (!user) {
            // Return success even if user doesn't exist to prevent email enumeration
            res.status(200).json({
                success: true,
                message: 'If an account exists with this email, a password reset link has been sent'
            });
            return;
        }

        // Generate password reset token (expires in 1 hour)
        const resetToken = jwt.sign(
            { userId: user.userId },
            config.jwt.secret,
            { expiresIn: '1h' }
        );

        // Save reset token to user record
        await UserModel.update(user.userId, {
            resetToken,
            resetTokenExpires: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
        });

        // Send password reset email
        const resetUrl = `${config.clientUrl}/reset-password?token=${resetToken}`;
        await sendPasswordResetEmail(email, resetUrl);

        res.status(200).json({
            success: true,
            message: 'Password reset link sent to your email'
        });
        return;

    } catch (error: any) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during password reset',
            error: config.env === 'development' ? error.message : undefined
        });
        return;
    }
};

export const resetPassword = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ 
            success: false,
            errors: errors.array() 
        });
        return;
    }

    const { token, password } = req.body;

    try {
        // Verify token
        const decoded = jwt.verify(token, config.jwt.secret) as { userId: string };
        
        // Get user
        const user = await UserModel.findByUserId(decoded.userId);
        if (!user || user.resetToken !== token || !user.resetTokenExpires) {
            res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token'
            });
            return 
        }

        // Check if token expired
        const now = Math.floor(Date.now() / 1000);
        if (user.resetTokenExpires < now) {
            res.status(400).json({
                success: false,
                message: 'Reset token has expired'
            });
            return 
        }

        // Hash new password
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Update password and clear reset token
        await UserModel.update(user.userId, {
            password: hashedPassword,
            resetToken: '',
            resetTokenExpires: -1
        });

        res.status(200).json({
            success: true,
            message: 'Password reset successfully'
        });
        return 

    } catch (error: any) {
        console.error('Reset password error:', error);
        if (error.name === 'TokenExpiredError') {
             res.status(400).json({
                success: false,
                message: 'Reset token has expired'
            });
            return
        }
        if (error.name === 'JsonWebTokenError') {
            res.status(400).json({
                success: false,
                message: 'Invalid reset token'
            });
            return 
        }
        res.status(500).json({
            success: false,
            message: 'Server error during password reset',
            error: config.env === 'development' ? error.message : undefined
        });
        return 
    }
};