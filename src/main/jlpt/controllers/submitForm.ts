import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Parser } from 'json2csv';
import AWS from 'aws-sdk';
import { FormSubmission } from '../interfaces/form.interface';
import { validateFormSubmission, validateSave, validatePaymentSave } from '../validations/form.validation';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { convertToCustomCsv } from '../../../utils/helper';

// Initialize DynamoDB client
const dynamoDbClient = new DynamoDBClient({
    region: process.env.AWS_REGION || 'ap-south-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

const docClient = DynamoDBDocumentClient.from(dynamoDbClient);

const TABLE_NAME = 'JLPTForms';
const PAYMENT_TABLE = 'Payments'

export const payment = async (req: Request, res: Response): Promise<void> => {
  const { valid, errors } = validatePaymentSave(req.body);
  if (!valid) {
    res.status(400).json({
      code: 'VALIDATION_FAILED',
      message: 'Validation failed',
      errors,
      timestamp: new Date().toISOString()
    });
    return;
  }

  try {
    const now = new Date().toISOString();
    let submission: any; //CREATE A INTERFACE FOR PAYMENTS
    let action: 'created' | 'updated';
    // const idempotencyKey = req.headers['x-idempotency-key']?.toString();

    // 2. Check for existing document if ID is provided
    if (req.body.pid) {
      // 3. Optimistic concurrency control with versioning
      const existingDoc = await docClient.send(new GetCommand({
        TableName: PAYMENT_TABLE,
        Key: { pid: req.body.pid },
        ConsistentRead: true // Strong consistency for updates
      }));

      if (!existingDoc.Item) {
        res.status(404).json({
          code: 'DOCUMENT_NOT_FOUND',
          message: 'Document not found',
          requestedId: req.body.pid,
          timestamp: now
        });
        return;
      }

      // 4. Merge existing data with updates (preserve unchanged fields)
      submission = {
        ...existingDoc.Item,
        ...req.body,
        version: (existingDoc.Item.version || 0) + 1, // Concurrency control
        updatedAt: now,
        createdAt: existingDoc.Item.createdAt // Preserve original creation time
      };
      action = 'updated';
    } else {
      // 5. New document creation
      submission = {
        ...req.body,
        pid: uuidv4(),
        version: 1,
        createdAt: now,
        updatedAt: now
      };
      action = 'created';
    }

    // 6. Conditional write to prevent overwrites
    const params = {
      TableName: PAYMENT_TABLE,
      Item: submission,
      ...(action === 'updated' && {
        ConditionExpression: 'attribute_exists(id) AND version = :currentVersion',
        ExpressionAttributeValues: {
          ':currentVersion': submission.version - 1
        }
      }),
      // ...(idempotencyKey && {
      //   ConditionExpression: `${action === 'updated' ? 'attribute_exists(id) AND ' : ''}(attribute_not_exists(idempotencyKey) OR idempotencyKey = :key)`,
      //   ExpressionAttributeValues: {
      //     ...(action === 'updated' && { ':currentVersion': submission.version - 1 }),
      //     ':key': idempotencyKey
      //   }
      // })
    };

    await docClient.send(new PutCommand(params));

    // 7. Audit logging (in production, use a proper logging system)
    // console.log(`Document ${action}`, {
    //   id: submission.id,
    //   action,
    //   timestamp: now,
    //   user: req.user?.id // Assuming you have user context
    // });

    // 8. Comprehensive success response
    res.status(action === 'created' ? 201 : 200).json({
      status: 'success',
      action,
      data: {
        pid: submission.pid,
        version: submission.version,
        createdAt: submission.createdAt,
        updatedAt: submission.updatedAt
      },
      links: {
        self: `/documents/${submission.pid}`,
        get: `/documents/${submission.pid}`
      },
      meta: {
        timestamp: now,
        // idempotencyKey: idempotencyKey || undefined
      }
    });

  } catch (error:any) {
    // 9. Enhanced error handling
    let statusCode = 500;
    let errorCode = 'INTERNAL_ERROR';
    let errorMessage = 'Failed to process form';

    if (error.name === 'ConditionalCheckFailedException') {
      statusCode = 409; // Conflict
      errorCode = 'CONCURRENT_MODIFICATION';
      errorMessage = 'Document was modified by another request';
    }

    console.error('Database operation failed:', {
      error: error.message,
      stack: error.stack,
      body: req.body,
      timestamp: new Date().toISOString()
    });

    res.status(statusCode).json({
      status: 'error',
      code: errorCode,
      message: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString()
    });
  }
};

export const saveForm = async (req: Request, res: Response): Promise<void> => {
  const { valid, errors } = validateSave(req.body);
  if (!valid) {
    res.status(400).json({
      code: 'VALIDATION_FAILED',
      message: 'Validation failed',
      errors,
      timestamp: new Date().toISOString()
    });
    return;
  }

  try {
    const now = new Date().toISOString();
    let submission: FormSubmission;
    let action: 'created' | 'updated';
    // const idempotencyKey = req.headers['x-idempotency-key']?.toString();

    // 2. Check for existing document if ID is provided
    if (req.body.id) {
      // 3. Optimistic concurrency control with versioning
      const existingDoc = await docClient.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: { id: req.body.id },
        ConsistentRead: true // Strong consistency for updates
      }));

      if (!existingDoc.Item) {
        res.status(404).json({
          code: 'DOCUMENT_NOT_FOUND',
          message: 'Document not found',
          requestedId: req.body.id,
          timestamp: now
        });
        return;
      }

      // 4. Merge existing data with updates (preserve unchanged fields)
      submission = {
        ...existingDoc.Item,
        ...req.body,
        timeOfExam: '25B', //HARDCODING FOR NOW
        version: (existingDoc.Item.version || 0) + 1, // Concurrency control
        updatedAt: now,
        createdAt: existingDoc.Item.createdAt // Preserve original creation time
      };
      action = 'updated';
    } else {
      // 5. New document creation
      submission = {
        ...req.body,
        id: uuidv4(),
        timeOfExam: '25B', //HARDCODING FOR NOW
        version: 1,
        createdAt: now,
        updatedAt: now
      };
      action = 'created';
    }

    // 6. Conditional write to prevent overwrites
    const params = {
      TableName: TABLE_NAME,
      Item: submission,
      ...(action === 'updated' && {
        ConditionExpression: 'attribute_exists(id) AND version = :currentVersion',
        ExpressionAttributeValues: {
          ':currentVersion': submission.version - 1
        }
      }),
      // ...(idempotencyKey && {
      //   ConditionExpression: `${action === 'updated' ? 'attribute_exists(id) AND ' : ''}(attribute_not_exists(idempotencyKey) OR idempotencyKey = :key)`,
      //   ExpressionAttributeValues: {
      //     ...(action === 'updated' && { ':currentVersion': submission.version - 1 }),
      //     ':key': idempotencyKey
      //   }
      // })
    };

    await docClient.send(new PutCommand(params));

    // 7. Audit logging (in production, use a proper logging system)
    // console.log(`Document ${action}`, {
    //   id: submission.id,
    //   action,
    //   timestamp: now,
    //   user: req.user?.id // Assuming you have user context
    // });

    // 8. Comprehensive success response
    res.status(action === 'created' ? 201 : 200).json({
      status: 'success',
      action,
      data: {
        id: submission.id,
        version: submission.version,
        createdAt: submission.createdAt,
        updatedAt: submission.updatedAt
      },
      links: {
        self: `/documents/${submission.id}`,
        get: `/documents/${submission.id}`
      },
      meta: {
        timestamp: now,
        // idempotencyKey: idempotencyKey || undefined
      }
    });

  } catch (error:any) {
    // 9. Enhanced error handling
    let statusCode = 500;
    let errorCode = 'INTERNAL_ERROR';
    let errorMessage = 'Failed to process form';

    if (error.name === 'ConditionalCheckFailedException') {
      statusCode = 409; // Conflict
      errorCode = 'CONCURRENT_MODIFICATION';
      errorMessage = 'Document was modified by another request';
    }

    console.error('Database operation failed:', {
      error: error.message,
      stack: error.stack,
      body: req.body,
      timestamp: new Date().toISOString()
    });

    res.status(statusCode).json({
      status: 'error',
      code: errorCode,
      message: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString()
    });
  }
};

export const submitForm = async (req: Request, res: Response): Promise<void> => {
  // 1. Enhanced Validation
  const { valid, errors } = validateFormSubmission(req.body);
  if (!valid) {
    res.status(400).json({
      code: 'VALIDATION_FAILED',
      message: 'Validation failed',
      errors,
      timestamp: new Date().toISOString()
    });
    return;
  }

  try {
    const now = new Date().toISOString();
    let submission: FormSubmission;
    let action: 'created' | 'updated';
    // const idempotencyKey = req.headers['x-idempotency-key']?.toString();

    // 2. Check for existing document if ID is provided
    if (req.body.id) {
      // 3. Optimistic concurrency control with versioning
      const existingDoc = await docClient.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: { id: req.body.id },
        ConsistentRead: true // Strong consistency for updates
      }));

      if (!existingDoc.Item) {
        res.status(404).json({
          code: 'DOCUMENT_NOT_FOUND',
          message: 'Document not found',
          requestedId: req.body.id,
          timestamp: now
        });
        return;
      }

      // 4. Merge existing data with updates (preserve unchanged fields)
      submission = {
        ...existingDoc.Item,
        ...req.body,
        timeOfExam: '25B', //HARDCODING FOR NOW
        version: (existingDoc.Item.version || 0) + 1, // Concurrency control
        updatedAt: now,
        createdAt: existingDoc.Item.createdAt // Preserve original creation time
      };
      action = 'updated';
    } else {
      // 5. New document creation
      submission = {
        ...req.body,
        id: uuidv4(),
        version: 1,
        timeOfExam: '25B', //HARDCODING FOR NOW
        createdAt: now,
        updatedAt: now
      };
      action = 'created';
    }

    // 6. Conditional write to prevent overwrites
    const params = {
      TableName: TABLE_NAME,
      Item: submission,
      ...(action === 'updated' && {
        ConditionExpression: 'attribute_exists(id) AND version = :currentVersion',
        ExpressionAttributeValues: {
          ':currentVersion': submission.version - 1
        }
      }),
      // ...(idempotencyKey && {
      //   ConditionExpression: `${action === 'updated' ? 'attribute_exists(id) AND ' : ''}(attribute_not_exists(idempotencyKey) OR idempotencyKey = :key)`,
      //   ExpressionAttributeValues: {
      //     ...(action === 'updated' && { ':currentVersion': submission.version - 1 }),
      //     ':key': idempotencyKey
      //   }
      // })
    };

    await docClient.send(new PutCommand(params));

    // 7. Audit logging (in production, use a proper logging system)
    // console.log(`Document ${action}`, {
    //   id: submission.id,
    //   action,
    //   timestamp: now,
    //   user: req.user?.id // Assuming you have user context
    // });

    // 8. Comprehensive success response
    res.status(action === 'created' ? 201 : 200).json({
      status: 'success',
      action,
      data: {
        id: submission.id,
        version: submission.version,
        createdAt: submission.createdAt,
        updatedAt: submission.updatedAt
      },
      links: {
        self: `/documents/${submission.id}`,
        get: `/documents/${submission.id}`
      },
      meta: {
        timestamp: now,
        // idempotencyKey: idempotencyKey || undefined
      }
    });

  } catch (error:any) {
    // 9. Enhanced error handling
    let statusCode = 500;
    let errorCode = 'INTERNAL_ERROR';
    let errorMessage = 'Failed to process form';

    if (error.name === 'ConditionalCheckFailedException') {
      statusCode = 409; // Conflict
      errorCode = 'CONCURRENT_MODIFICATION';
      errorMessage = 'Document was modified by another request';
    }

    console.error('Database operation failed:', {
      error: error.message,
      stack: error.stack,
      body: req.body,
      timestamp: new Date().toISOString()
    });

    res.status(statusCode).json({
      status: 'error',
      code: errorCode,
      message: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString()
    });
  }
};

export const getDocumentById = async (req: Request, res: Response) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');
  try {
    // Validate ID parameter
    if (!req.params.id || typeof req.params.id !== 'string') {
      res.status(400).json({ 
        status: 'error',
        message: 'Invalid document ID' 
      });
      return 
    }

    const { Item } = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { id: req.params.id }
    }));

    if (!Item) {
      res.status(404).json({ 
        status: 'error',
        message: 'Document not found' 
      });
      return 
    }

    // Transform response to only include necessary fields
    const response = Item;

    // Cache control
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.setHeader('ETag', require('crypto')
      .createHash('md5')
      .update(JSON.stringify(Item))
      .digest('hex'));

    res.json({
      status: 'success',
      data: response
    });
    return 

  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Internal server error' 
    });
    return 
  }
};

export const saveUserForm = async (req: Request, res: Response): Promise<void> => {


  try {
    const now = new Date().toISOString();
    let submission: any;
    let action: 'created' | 'updated';
    // const idempotencyKey = req.headers['x-idempotency-key']?.toString();

    // 2. Check for existing document if ID is provided
    if (req.body.userId) {
      // 3. Optimistic concurrency control with versioning
      const existingDoc = await docClient.send(new GetCommand({
        TableName: 'Users',
        Key: { userId: req.body.userId },
        ConsistentRead: true // Strong consistency for updates
      }));

      if (!existingDoc.Item) {
        res.status(404).json({
          code: 'DOCUMENT_NOT_FOUND',
          message: 'Document not found',
          requestedId: req.body.userId,
          timestamp: now
        });
        return;
      }

      // 4. Merge existing data with updates (preserve unchanged fields)
      submission = {
        ...existingDoc.Item,
        ...req.body,
        version: (existingDoc.Item.version || 0) + 1, // Concurrency control
        updatedAt: now,
        createdAt: existingDoc.Item.createdAt // Preserve original creation time
      };
      action = 'updated';

      console.log(submission,existingDoc.Item);
      
    } else {
      // 5. New document creation
      submission = {
        ...req.body,
        userId: uuidv4(),
        version: 1,
        createdAt: now,
        updatedAt: now
      };
      action = 'created';
    }

    // 6. Conditional write to prevent overwrites
    const params = {
      TableName: 'Users',
      Item: submission,
      ConditionExpression: action === 'created' 
        ? 'attribute_not_exists(userId)' 
        : 'userId = :userId AND version = :currentVersion OR attribute_not_exists(version)',
      ExpressionAttributeValues: {
        ...(action === 'updated' && { 
          ':userId': req.body.userId,
          ':currentVersion': submission.version - 1 // Note the -1 here
        })
      }
    };

    await docClient.send(new PutCommand(params));

    // 7. Audit logging (in production, use a proper logging system)
    // console.log(`Document ${action}`, {
    //   id: submission.id,
    //   action,
    //   timestamp: now,
    //   user: req.user?.id // Assuming you have user context
    // });

    // 8. Comprehensive success response
    res.status(action === 'created' ? 201 : 200).json({
      status: 'success',
      action,
      data: {
        userId: submission.userId,
        version: submission.version,
        createdAt: submission.createdAt,
        updatedAt: submission.updatedAt
      },
      links: {
        self: `/documents/${submission.userId}`,
        get: `/documents/${submission.userId}`
      },
      meta: {
        timestamp: now,
        // idempotencyKey: idempotencyKey || undefined
      }
    });

  } catch (error:any) {
    // 9. Enhanced error handling
    let statusCode = 500;
    let errorCode = 'INTERNAL_ERROR';
    let errorMessage = 'Failed to process form';

    if (error.name === 'ConditionalCheckFailedException') {
      statusCode = 409; // Conflict
      errorCode = 'CONCURRENT_MODIFICATION';
      errorMessage = 'Document was modified by another request';
    }

    console.error('Database operation failed:', {
      error: error.message,
      stack: error.stack,
      body: req.body,
      timestamp: new Date().toISOString()
    });

    res.status(statusCode).json({
      status: 'error',
      code: errorCode,
      message: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString()
    });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');
  try {
    // Validate ID parameter
    if (!req.params.id || typeof req.params.id !== 'string') {
      res.status(400).json({ 
        status: 'error',
        message: 'Invalid document ID' 
      });
      return 
    }

    const { Item } = await docClient.send(new GetCommand({
      TableName: 'Users',
      Key: { userId: req.params.id }
    }));

    if (!Item) {
      res.status(404).json({ 
        status: 'error',
        message: 'Document not found' 
      });
      return 
    }

    // Transform response to only include necessary fields
    const response = Item;

    // Cache control
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.setHeader('ETag', require('crypto')
      .createHash('md5')
      .update(JSON.stringify(Item))
      .digest('hex'));

    res.json({
      status: 'success',
      data: response
    });
    return 

  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Internal server error' 
    });
    return 
  }
};

export const getDocumentsByUserAndTime = async (req: Request, res: Response) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');
  try {
    // Validate query parameters
    const userId = req.query.userId as string;
    const timeOfExam = req.query.timeOfExam as string;
    const limit = parseInt(req.query.limit as string) || 10;
    const nextToken = req.query.nextToken as string | undefined;
    let projection = req.body;

    console.log(projection);

    // if(Object.keys(projection).length == 0){
      projection = {
        ...projection,
        id:1,
        timeOfExam:1,
        testLevel:1,
        createdAt:1,
        progress:1
      }
    // }
    

    if (!userId || !timeOfExam) {
      res.status(400).json({ 
        status: 'error',
        message: 'Both userId and timeOfExam parameters are required' 
      });
      return 
    }

    // DynamoDB query
    const params = {
      TableName: TABLE_NAME,
      IndexName: 'UserLevelIndex', // GSI you'll need to create
      KeyConditionExpression: 'userId = :userId AND #timeOfExam = :timeOfExam',
      ExpressionAttributeNames: { '#timeOfExam': 'timeOfExam' }, 
      ExpressionAttributeValues: { 
        ':userId': userId,
        ':timeOfExam': timeOfExam 
      },
      Limit: limit,
      ProjectionExpression: buildDynamoDBProjection(projection), // Only return these fields
      ScanIndexForward: false, // Newest first
      ExclusiveStartKey: nextToken 
        ? JSON.parse(Buffer.from(nextToken, 'base64').toString()) 
        : undefined
    };

    const { Items, LastEvaluatedKey } = await docClient.send(new QueryCommand(params));

    // Transform results
    const results = shapeResultsByProjection(Items || [], projection)

     res.json({
      status: 'success',
      data: results,
      pagination: {
        nextToken: LastEvaluatedKey 
          ? Buffer.from(JSON.stringify(LastEvaluatedKey)).toString('base64')
          : null,
        limit
      }
    });
    return

  } catch (error:any) {
    console.error('Database error:', error);
    
    if (error.name === 'ConditionalCheckFailedException') {
       res.status(400).json({ 
        status: 'error',
        message: 'Invalid pagination token' 
      });
      return
    }

     res.status(500).json({ 
      status: 'error',
      message: 'Internal server error' 
    });
    return
  }
};



export const exportMatchingRecords = async (req: Request, res: Response): Promise<void> => {
  const { testLevel, country } = req.query;

  // Build filter expression
  let filterExpression = '';
  const expressionAttributeValues: Record<string, any> = {};

  if (testLevel) {
    filterExpression += '#tl = :testLevel';
    expressionAttributeValues[':testLevel'] = testLevel;
  }

  if (country) {
    if (filterExpression) filterExpression += ' AND ';
    filterExpression += '#country = :country';
    expressionAttributeValues[':country'] = country;
  }

  const params = {
    TableName: TABLE_NAME,
    ...(filterExpression && {
      FilterExpression: filterExpression,
      ExpressionAttributeValues: expressionAttributeValues,
    //   ExpressionAttributeNames: {
    //     '#tl': 'testLevel',
    //     '#country': 'country',
    //   },
    }),
  };

  try {
    const result = await docClient.send(new ScanCommand(params));
    let items:any = result.Items ?? [];
    // items = unmarshall(items)
    if (items.length === 0) {
      res.status(404).json({ message: 'No records found' });
      return;
    }

    // Optional: Format items if needed
    const csv = convertToCustomCsv(items);

    res.header('Content-Type', 'text/csv');
    res.attachment('form-submissions.csv');
    res.send(csv);
  } catch (error) {
    console.error('CSV Export error:', error);
    res.status(500).json({ message: 'Failed to export CSV', error });
  }
};

function buildDynamoDBProjection(projection: Record<string, any>) {
  const ExpressionAttributeNames: Record<string, string> = {};
  const expressionParts: string[] = [];

  for (const key in projection) {
    if (projection[key]) {
      const placeholder = `${key}`;
      ExpressionAttributeNames[placeholder] = key;
      expressionParts.push(placeholder);
    }
  }

  const ProjectionExpression = expressionParts.join(", ");

  return ProjectionExpression;
}

function shapeResultsByProjection(items: any[], projection: Record<string, any>) {
  const keysToInclude = Object.keys(projection).filter(key => projection[key]);

  return items.map(item => {
    const shaped: any = {};
    for (const key of keysToInclude) {
      shaped[key] = item[key];
    }
    return shaped;
  });
}