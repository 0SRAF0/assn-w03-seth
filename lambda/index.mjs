export const handler = async (event, context) => {
    let response;

    switch (event.httpMethod) {
        case "POST":
            response = await handlePostRequest(event, context);
            break;
        case "GET":
            response = await handleGetRequest();
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
    return {
        statusCode: 200,
        body: JSON.stringify({message: "Student record created successfully"}),
    };
};

const handleGetRequest = async () => {
    return {
        statusCode: 200,
        body: JSON.stringify({ message: "Student records retrieved", items: [] }),
    };
};