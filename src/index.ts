import {DynamoDBClient} from "@aws-sdk/client-dynamodb";
import type {DynamoDBClientConfig} from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import type {APIGatewayProxyEvent, APIGatewayProxyResult, Context} from "aws-lambda";

const tableName: string = "cmpe-272_assn-w03_student-record";
const region: string = "us-east-1";

const clientConfig: DynamoDBClientConfig = { region };
const client = new DynamoDBClient(clientConfig);
const docClient = DynamoDBDocumentClient.from(client);

const jsonHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "OPTIONS,GET,POST,PUT,DELETE"
} as const;

const withHeaders = (response: Omit<APIGatewayProxyResult, "headers">): APIGatewayProxyResult => ({
  headers: jsonHeaders,
  ...response,
});

export const handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  try {
    const method = event?.httpMethod || "GET";
    console.log("Request received", {
      requestId: (context as any)?.awsRequestId,
      method,
      path: event?.path,
      query: event?.queryStringParameters,
      bodyPresent: Boolean(event?.body)
    });

    if (method === "OPTIONS") {
      return withHeaders({ statusCode: 204, body: "" });
    }

    let response: APIGatewayProxyResult;
    switch (method) {
      case "POST":
        response = await handlePostRequest(event, context);
        break;
      case "GET":
        response = await handleGetRequest(event);
        break;
      case "PUT":
        response = await handlePutRequest(event);
        break;
      case "DELETE":
        response = await handleDeleteRequest(event);
        break;
      default:
        response = {
          statusCode: 400,
          body: JSON.stringify({
            message: "Invalid request type",
          }),
          headers: jsonHeaders
        };
    }

    console.log("Response", { statusCode: response.statusCode });
    return withHeaders(response);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Handler error", { message, error });
    return withHeaders({
      statusCode: 500,
      body: JSON.stringify({
        message: "Internal server error",
        error: message
      }),
    });
  }
};

type StudentRecord = {
  id: string;
  name: string;
  course: string;
  createdAt: string;
  updatedAt?: string;
};

const handlePostRequest = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  if (!event?.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Missing request body" }),
    };
  }

  let requestBody: Partial<StudentRecord>;
  try {
    requestBody = JSON.parse(event.body);
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Invalid JSON body" }),
    };
  }

  const studentRecord: StudentRecord = {
    id: (requestBody as any).id || `student-${Date.now()}`,
    name: (requestBody as any).name as string,
    course: (requestBody as any).course as string,
    createdAt: new Date().toISOString()
  };

  const command = new PutCommand({
    TableName: tableName,
    Item: studentRecord,
  });

  await docClient.send(command);
  console.log("PutCommand success", { id: studentRecord.id });

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Student record created successfully",
      record: studentRecord
    }),
  };
};

const handleGetRequest = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const queryParams = event.queryStringParameters || {};

  const id = queryParams["id"];
  if (!id) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Missing required parameter: id" }),
    };
  }

  const command = new GetCommand({
    TableName: tableName,
    Key: {
      id
    }
  });

  const response = await docClient.send(command);
  console.log("GetCommand result", { found: Boolean(response.Item) });

  if (response.Item) {
    return {
      statusCode: 200,
      body: JSON.stringify(response.Item),
    };
  } else {
    return {
      statusCode: 404,
      body: JSON.stringify({
        message: `Student record with id '${id}' not found`
      }),
    };
  }

};

const handlePutRequest = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const queryParams = event.queryStringParameters || {};

  const id = queryParams["id"];
  if (!id) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "Missing required parameter: id"
      }),
    };
  }

  if (!event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Missing request body" }),
    };
  }

  let requestBody: { name?: string; course?: string };
  try {
    requestBody = JSON.parse(event.body);
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Invalid JSON body" }),
    };
  }

  const command = new UpdateCommand({
    TableName: tableName,
    Key: {
      id
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
  console.log("UpdateCommand success", { id });

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Student record updated successfully",
      record: response.Attributes
    }),
  };
};

const handleDeleteRequest = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const queryParams = event.queryStringParameters || {};

  const id = queryParams["id"];
  if (!id) {
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
      id
    }
  });

  await docClient.send(command);
  console.log("DeleteCommand success", { id });

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Student record deleted successfully"
    }),
  };
};
