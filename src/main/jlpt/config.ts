import dotenv from 'dotenv';

dotenv.config();

interface IConfig {
    env: string;
    port: number;
    aws: {
        region: string;
        accessKeyId: string;
        secretAccessKey: string;
        dynamoDBTableName: string;
    };
    email: {
        user: string;
        password: string;
    };
    jwt: {
        secret: string;
        expiresIn: string;
        resetExpiresIn: string; // Added for password reset tokens
    };
    clientUrl: string; // Added for password reset links
    security: {
        passwordResetTimeout: number; // In seconds
        otpExpiryMinutes: number;
    };
}

const config: IConfig = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    aws: {
        region: process.env.AWS_REGION || 'ap-south-1',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        dynamoDBTableName: process.env.DYNAMODB_TABLE_NAME || 'Users'
    },
    email: {
        user: process.env.EMAIL_USER || 'pushkarsutar999@gmail.com',
        password: process.env.EMAIL_PASSWORD || ''
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'your-secret-key',
        expiresIn: process.env.JWT_EXPIRES_IN || '30d',
        resetExpiresIn: process.env.JWT_RESET_EXPIRES_IN || '1h'
    },
    clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
    security: {
        passwordResetTimeout: parseInt(process.env.PASSWORD_RESET_TIMEOUT || '3600', 10), // 1 hour
        otpExpiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10)
    }
};

export { config };