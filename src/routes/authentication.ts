import { Router, Request, Response, NextFunction } from 'express';
import { DynamoDBClient, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { table } from 'console';

// Initialize DynamoDB client
const dynamoDbClient = new DynamoDBClient({
    region: process.env.AWS_REGION || 'ap-south-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

const docClient = DynamoDBDocumentClient.from(dynamoDbClient);

// Interface for User
interface User {
    id: string;
    email: string;
    username: string;
    password: string;
    createdAt: string;
}

// Create router
const userRouter = Router();


// Function to describe a DynamoDB table
async function describeTable(tableName: string) {
    try {
      const command = new DescribeTableCommand({
        TableName: tableName,
      });
  
      const response = await docClient.send(command);
      
      console.log('Table Description:');
      console.log(JSON.stringify(response.Table, null, 2));
      
      return response.Table;
    } catch (error) {
      console.error('Error describing table:', error);
      throw error;
    }
  }

  
userRouter.get('/table/:tableName', async (req: Request, res: Response) => {

    const tableInfo = await describeTable(req.params.tableName);
    
    // Access specific information
    console.log('\nTable Name:', tableInfo?.TableName);
    console.log('Table Status:', tableInfo?.TableStatus);
    console.log('Item Count:', tableInfo?.ItemCount);
    console.log('Table Size (bytes):', tableInfo?.TableSizeBytes);
    
    // Key Schema
    console.log('\nKey Schema:');
    tableInfo?.KeySchema?.forEach(key => {
      console.log(`  ${key.AttributeName}: ${key.KeyType}`);
    });
    
    // Attribute Definitions
    console.log('\nAttribute Definitions:');
    tableInfo?.AttributeDefinitions?.forEach(attr => {
      console.log(`  ${attr.AttributeName}: ${attr.AttributeType}`);
    });

    res.status(200).json(tableInfo);
});


// Validation middleware
const validateRegistration = (req: Request, res: Response, next: NextFunction): void => {
    const { email, username, password } = req.body;

    if (!email || !username || !password) {
        res.status(400).json({
            error: 'Missing required fields: email, username, and password are required',
        });
        return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        res.status(400).json({
            error: 'Invalid email format',
        });
        return;
    }

    // Password validation (minimum 8 characters)
    if (password.length < 8) {
        res.status(400).json({
            error: 'Password must be at least 8 characters long',
        });
        return;
    }

    next();
};

// Register endpoint
userRouter.post('/register', validateRegistration, async (req: Request, res: Response) => {
    try {
        const { email, username, password } = req.body;

        // Check if user already exists (you might want to create GSI for email/username)
        // For now, we'll skip this check to keep it simple

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user object
        const user: User = {
            id: uuidv4(),
            email,
            username,
            password: hashedPassword,
            createdAt: new Date().toISOString(),
        };

        console.log('User object:', user);

        // Put item in DynamoDB
        const params = {
            TableName: process.env.USERS_TABLE_NAME || 'Users',
            Item: user,
            ConditionExpression: 'attribute_not_exists(id)', // Ensure ID doesn't exist
        };

        await docClient.send(new PutCommand(params));

        // Return user without password
        const { password: _, ...userWithoutPassword } = user;

        res.status(201).json({
            message: 'User registered successfully',
            user: userWithoutPassword,
        });

    } catch (error) {
        console.error('Registration error:', error);

        if ((error as any).name === 'ConditionalCheckFailedException') {
            res.status(409).json({
                error: 'User already exists',
            });
        } else {
            res.status(500).json({
                error: 'Internal server error',
            });
        }
    }
});

// // Login endpoint
// userRouter.post('/login', async (req: Request, res: Response, next: NextFunction) => {
//     try {
//         const { username, password } = req.body;

//         // Validate input
//         if (!username || !password) {
//             return res.status(400).json({
//                 error: 'Username and password are required'
//             });
//         }

//         // Query for user by username using GSI (assuming username-index exists)
//         const queryParams = {
//             TableName: process.env.USERS_TABLE_NAME || 'Users',
//             IndexName: 'username-index',
//             KeyConditionExpression: 'username = :username',
//             ExpressionAttributeValues: {
//                 ':username': username,
//             },
//         };

//         const result = await docClient.send(new QueryCommand(queryParams));

//         // Check if user exists
//         if (!result.Items || result.Items.length === 0) {
//             return res.status(400).json({
//                 error: 'Invalid username or password'
//             });
//         }

//         const user = result.Items[0] as User;

//         // Compare password
//         const isPasswordValid = await bcrypt.compare(password, user.password);
//         if (!isPasswordValid) {
//             return res.status(400).json({
//                 error: 'Invalid username or password'
//             });
//         }

//         // Generate JWT token
//         const token = jwt.sign(
//             {
//                 userId: user.id,
//                 username: user.username,
//                 email: user.email
//             },
//             process.env.JWT_SECRET || 'your-jwt-secret',
//             { expiresIn: '1h' }
//         );

//         // Return success response
//         res.status(200).json({
//             message: 'Login successful',
//             token,
//             user: {
//                 id: user.id,
//                 username: user.username,
//                 email: user.email,
//             }
//         });

//     } catch (error) {
//         console.error('Error logging in user:', error);
//         res.status(500).json({
//             error: 'Internal server error'
//         });
//     }
// });

export default userRouter;