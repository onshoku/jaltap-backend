import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { NextFunction, Request, Response } from "express";

// Initialize DynamoDB client
const dynamoDbClient = new DynamoDBClient({
    region: process.env.AWS_REGION || "ap-south-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

const docClient = DynamoDBDocumentClient.from(dynamoDbClient);

const TABLE_NAME =  process.env.GlobalData;

export const getData = async (req: Request, res: Response, _next:NextFunction): Promise<void> => {
    
    try {
        const result = await docClient.send(
            new GetCommand({
                TableName: TABLE_NAME,
                Key: { id: "GLOBAL_JLPT_DATA" },
            })
        );

        if (!result.Item) {
            res.status(404).json({ message: "Form not found" });
            return;
        }

        res.status(200).json(result.Item);
        return;
    } catch (error) {
        console.error("DynamoDB error:", error);
    if (!res.headersSent) {
        res.status(500).json({ message: "Failed to retrieve form", error });
    }
    return;
    }
};
