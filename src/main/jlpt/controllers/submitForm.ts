import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import AWS from 'aws-sdk';
import { FormSubmission } from '../interfaces/form.interface';
import { validateFormSubmission } from '../validations/form.validation';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

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

export const submitForm = async (req: Request, res: Response): Promise<void> => {
  const { valid, errors } = validateFormSubmission(req.body);
  if (!valid) {
    res.status(400).json({ message: 'Validation failed', errors });
    return;
  }

  const submission: FormSubmission = {
    ...req.body,
    id: uuidv4(),
    timestamp: new Date().toISOString(),
  };

  try {
    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: submission,
    }));

    res.status(201).json({ message: 'Form submitted', submissionId: submission.submissionId });
  } catch (error) {
    console.error('DynamoDB error:', error);
    res.status(500).json({ message: 'Failed to store form', error });
  }
};

export const getFormById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const result = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { submissionId: id },
    }));

    if (!result.Item) {
      res.status(404).json({ message: 'Form not found' });
      return;
    }

    res.status(200).json(result.Item);
  } catch (error) {
    console.error('DynamoDB error:', error);
    res.status(500).json({ message: 'Failed to retrieve form', error });
  }
};
