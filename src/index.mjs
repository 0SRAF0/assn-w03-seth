import {DynamoDBClient} from "@aws-sdk/client-dynamodb";
import {
    DynamoDBDocumentClient,
    PutCommand,
    GetCommand,
    UpdateCommand,
    DeleteCommand,
} from "@aws-sdk/lib-dynamodb";

const tableName = "cmpe-272_assn-w03_student-record";

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
        case "PUT":
            response = await handlePutRequest(event, context);
            break;
        case "DELETE":
            response = await handleDeleteRequest(event, context);
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

const handlePutRequest = async (event) => {
    const queryParams = event.queryStringParameters;
    
    if (!queryParams?.id) {
        return {
            statusCode: 400,
            body: JSON.stringify({
                message: "Missing required parameter: id"
            }),
        };
    }

    const requestBody = JSON.parse(event.body);

    const command = new UpdateCommand({
        TableName: tableName,
        Key: {
            id: queryParams.id
        },
        UpdateExpression: 'SET #name = :name, course = :course, updatedAt = :updatedAt',
        ExpressionAttributeNames: {
            '#name': 'name'
        },
        ExpressionAttributeValues: {
            ':name': requestBody.name,
            ':course': requestBody.course,
            ':updatedAt': new Date().toISOString()
        },
        ReturnValues: 'ALL_NEW'
    });

    const response = await docClient.send(command);

    return {
        statusCode: 200,
        body: JSON.stringify({
            message: "Student record updated successfully",
            record: response.Attributes
        }),
    };
};

const handleDeleteRequest = async (event) => {
    const queryParams = event.queryStringParameters;
    
    if (!queryParams?.id) {
        return {
            statusCode: 400,
            body: JSON.stringify({
                message: "Missing required parameter: id"
            }),
        };
    }

    const command = new DeleteCommand({
        TableName: tableName,
        Key: {
            id: queryParams.id
        }
    });

    await docClient.send(command);

    return {
        statusCode: 200,
        body: JSON.stringify({
            message: "Student record deleted successfully"
        }),
    };
};