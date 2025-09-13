import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
    DynamoDBDocumentClient,
    PutCommand,
    GetCommand,
} from "@aws-sdk/lib-dynamodb";

const tableName = "cmpe-202_assn-w03_student-record";

const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event, context) => {
    let response;

    switch (event.httpMethod) {
        case "POST":
            response = await handlePostRequest(event, context);
            break;
        case "GET":
            response = await handleGetRequest(event);
            break;
        default:
            response = {
                statusCode: 400,
                body: JSON.stringify({
                    message: "Invalid request type",
                    event: event,
                    context: context,
                }),
            };
    }

    return response;
};

const handlePostRequest = async (event, context) => {
    const requestBody = JSON.parse(event.body);
    
    const studentRecord = {
        id: requestBody.id || `student-${Date.now()}`,
        name: requestBody.name,
        course: requestBody.course,
        createdAt: new Date().toISOString()
    };

    const command = new PutCommand({
        TableName: tableName,
        Item: studentRecord,
    });

    await docClient.send(command);

    return {
        statusCode: 200,
        body: JSON.stringify({
            message: "Student record created successfully",
            record: studentRecord
        }),
    };
};

const handleGetRequest = async (event) => {
    const requestBody = event.queryStringParameters;

    const command = new GetCommand({
        TableName: tableName,
        Key: {
            id: requestBody.id
        }
    });

    const response = await docClient.send(command);

    if (response.Item) {
        return {
            statusCode: 200,
            body: JSON.stringify(response.Item),
        };
    } else {
        return {
            statusCode: 404,
            body: JSON.stringify({
                message: `Student record with id '${requestBody.id}' not found`
            }),
        };
    }

};