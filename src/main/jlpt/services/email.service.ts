import nodemailer from 'nodemailer';
import { config } from '../config';

interface IMailOptions {
    email: string;
    subject: string;
    html: string;
}

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: config.email.user,
        pass: config.email.password
    }
});

export const sendEmail = async (options: IMailOptions): Promise<void> => {
    const mailOptions = {
        from: `"Your App Name" <${config.email.user}>`,
        to: options.email,
        subject: options.subject,
        html: options.html
    };

    await transporter.sendMail(mailOptions);
};

export const sendOTPEmail = async (email: string, otp: string): Promise<void> => {
    const subject = 'Your OTP for Registration';
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Registration OTP</h2>
            <p>Your OTP for registration is:</p>
            <div style="background: #f4f4f4; padding: 10px; margin: 10px 0; font-size: 24px; letter-spacing: 2px; text-align: center;">
                ${otp}
            </div>
            <p>This OTP is valid for 10 minutes.</p>
            <p>If you didn't request this, please ignore this email.</p>
            <p>Best regards,<br>Your App Team</p>
        </div>
    `;

    await sendEmail({ email, subject, html });
};

export const sendPasswordResetEmail = async (email: string, resetUrl: string): Promise<void> => {
    const subject = 'Password Reset Request';
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Password Reset</h2>
            <p>You requested to reset your password. Click the link below to proceed:</p>
            <div style="margin: 20px 0;">
                <a href="${resetUrl}" 
                   style="background: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                    Reset Password
                </a>
            </div>
            <p>If you didn't request this, please ignore this email.</p>
            <p>This link will expire in 1 hour.</p>
            <p>Best regards,<br>Your App Team</p>
        </div>
    `;

    await sendEmail({ email, subject, html });
};

export const sendPasswordChangedEmail = async (email: string): Promise<void> => {
    const subject = 'Your Password Has Been Changed';
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Password Changed</h2>
            <p>This is a confirmation that your password has been successfully changed.</p>
            <p>If you didn't make this change, please contact our support team immediately.</p>
            <p>Best regards,<br>Your App Team</p>
        </div>
    `;

    await sendEmail({ email, subject, html });
};