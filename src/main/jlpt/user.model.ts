import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../jlpt/config';

const docClient = new DocumentClient({
    region: config.aws.region,
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey
});

export interface IUser {
    userId: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    password: string;
    emailVerified: boolean;
    otp?: string;
    otpExpires?: number; // Unix timestamp
    resetToken?: string; // Added for password reset
    resetTokenExpires?: number; // Added for password reset (Unix timestamp)
    createdAt: number;
    updatedAt: number;
    // Optional: Track failed login attempts for security
    failedLoginAttempts?: number;
    lastFailedLogin?: number; // Unix timestamp
    accountLockedUntil?: number; // Unix timestamp
    role?:string
}

export const UserModel = {
    // Create new user
    create: async (userData: Omit<IUser, 'userId' | 'emailVerified' | 'createdAt' | 'updatedAt'>): Promise<IUser> => {
        const userId = uuidv4();
        const now = Math.floor(Date.now() / 1000);
        
        // Hash password
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(userData.password, salt);
        
        const user: IUser = {
            userId,
            fullName: userData.fullName,
            email: userData.email.toLowerCase(),
            phoneNumber: userData.phoneNumber,
            password: hashedPassword,
            emailVerified: false,
            otp: userData.otp,
            otpExpires: userData.otpExpires,
            createdAt: now,
            updatedAt: now
        };

        const params = {
            TableName: config.aws.dynamoDBTableName,
            Item: user
        };

        await docClient.put(params).promise();
        return user;
    },

    // Find user by email
    findByEmail: async (email: string): Promise<IUser | null> => {
        const params = {
            TableName: config.aws.dynamoDBTableName,
            IndexName: 'EmailIndex', // Assuming you have a GSI on email
            KeyConditionExpression: 'email = :email',
            ExpressionAttributeValues: {
                ':email': email.toLowerCase()
            },
            Limit: 1
        };

        const result = await docClient.query(params).promise();
        return result.Items?.[0] as IUser || null;
    },

    // Update user
    update: async (userId: string, updateData: Partial<IUser>): Promise<IUser | null> => {
        const now = Math.floor(Date.now() / 1000);
        
        let updateExpression = 'SET updatedAt = :updatedAt';
        const expressionAttributeValues: any = {
            ':updatedAt': now
        };

        // Dynamically build the update expression
        Object.keys(updateData).forEach(key => {
            if (key !== 'userId') { // Don't update userId
                updateExpression += `, ${key} = :${key}`;
                expressionAttributeValues[`:${key}`] = updateData[key as keyof IUser];
            }
        });

        const params = {
            TableName: config.aws.dynamoDBTableName,
            Key: { userId },
            UpdateExpression: updateExpression,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: 'ALL_NEW'
        };

        const result = await docClient.update(params).promise();
        return result.Attributes as IUser || null;
    },

    // Compare passwords
    comparePassword: async (user: IUser, candidatePassword: string): Promise<boolean> => {
        return await bcrypt.compare(candidatePassword, user.password);
    },

    // Find user by userId
    findByUserId: async (userId: string): Promise<IUser | null> => {
        const params = {
            TableName: config.aws.dynamoDBTableName,
            Key: { userId }
        };

        const result = await docClient.get(params).promise();
        return result.Item as IUser || null;
    },

    // Find user by reset token
    findByResetToken: async (token: string): Promise<IUser | null> => {
        const params = {
            TableName: config.aws.dynamoDBTableName,
            IndexName: 'ResetTokenIndex', // You'll need to create this GSI
            KeyConditionExpression: 'resetToken = :token',
            ExpressionAttributeValues: {
                ':token': token
            },
            Limit: 1
        };

        const result = await docClient.query(params).promise();
        return result.Items?.[0] as IUser || null;
    }
};