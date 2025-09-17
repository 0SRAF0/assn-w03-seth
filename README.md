# Setup and Installation

## Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build the project:**
   ```bash
   sam build
   ```

3. **Start local API server:**
   ```bash
   npm run dev:aws
   # or
   sam local start-api --port 3001
   ```

4. **Test the API:**
   ```bash
   curl "http://127.0.0.1:3001/?id=1"
   ```

> **Note:** Local development will show DynamoDB errors since the table doesn't exist locally. This is expected behavior.

## Production Deployment

### Manual Deploy

1. **Build the deployment package:**
   ```bash
   sam build
   cd .aws-sam/build/LambdaFunction
   zip -r ../../../lambda-deployment.zip .
   cd ../../..
   ```

2. **Upload to AWS Lambda:**
    - Navigate to AWS Lambda Console
    - Select your function (or create a new one)
    - Go to "Code" tab
    - Click "Upload from" → ".zip file"
    - Select the `lambda-deployment.zip` file
    - Click "Save"

> **Important:** The deployment package contains the compiled JavaScript code from your TypeScript source. Always run `sam build` before creating the zip to ensure you have the latest changes.

### Deploy with Command

*Coming soon - automated deployment using SAM CLI*

---

# Screenshots

This section proves the API works end-to-end with DynamoDB.

## DynamoDB Table — Sample Records

**Table:** `cmpe-272_assn-w03_student-record`  
**Primary key:** `id` (string)

![DynamoDB table overview](https://i.imghippo.com/files/undj2571Lbk.png)

*Figure 1.1 Items list view showing sample records.*

## API Requests — Success Proof

> Base URL: `https://api.percival.services/cmpe-272/assn-w03/student-record`

### `POST` /student-record — create

![POST success](https://i.imghippo.com/files/Al7214BcM.png)

*Figure 2.1 200 OK with created record in response body.*

**Request body**

```json
{
  "id": "003",
  "name": "Fox Drexel",
  "course": "CMPE 273"
}
```

**Expected response**

```json
{
  "message": "Student record created successfully",
  "record": {
    "id": "003",
    "name": "Fox Drexel",
    "course": "CMPE 273",
    "createdAt": "2025-09-13T08:45:57.951Z"
  }
}
```

### 2.2 `GET` /student-record?id=003 — read

![GET success](https://i.imghippo.com/files/nIB2817PaE.png)
*Figure 2.2 200 OK returning the item.*

**Expected response**

```json
{
  "createdAt": "2025-09-13T08:45:57.951Z",
  "id": "003",
  "name": "Fox Drexel",
  "course": "CMPE 273"
}
```

### 2.3 `PUT` /student-record?id=003 — update

Update the name of course from `CMPE 273` to `CMPE 202`.

![PUT success](https://i.imghippo.com/files/bw7891Sg.png)

*Figure 2.3 200 OK with updated attributes.*

![GET success](https://i.imghippo.com/files/ldX1824XgM.png)

*Figure 2.4 200 OK with proof that data has been updated.*

**Request body**

```json
{
  "name": "Fox Drexel",
  "course": "CMPE 202"
}
```

**Expected response**

```json
{
  "message": "Student record updated successfully",
  "record": {
    "createdAt": "2025-09-13T08:45:57.951Z",
    "id": "003",
    "course": "CMPE 202",
    "name": "Fox Drexel",
    "updatedAt": "2025-09-13T09:01:44.842Z"
  }
}
```

### 2.4 `DELETE` /student-record?id=001 — delete

![DELETE success](https://i.imghippo.com/files/qXJQ7716uQ.png)

*Figure 2.5 200 OK confirming deletion.*

![DELETE success](https://i.imghippo.com/files/kwjp2139qo.png)

*Figure 2.6 200 OK with proof that data has been deleted.*

**Expected response**

```json
{
  "message": "Student record deleted successfully"
}
```

---

# Reflection

Working with AWS Lambda, API Gateway, and DynamoDB reminded me that “serverless” still demands serious engineering. My biggest gains came from understanding why things failed, not just how to patch them.

## API Gateway

My Lambda was kept returning 400 with “Invalid request type” because I created the method without _Lambda proxy integration_.
My handler expected the proxy event shape (httpMethod, path, body), but API Gateway was sending a different payload, so my switch fell into the default case. Enabling Lambda proxy integration when creating the method and redeploying fixed it. Lesson learned: pick the integration model up front and
keep the handler and event mapping in sync. I now log event.requestContext, test with curl, and either use proxy with no VTL templates or non-proxy with explicit templates, never a mixed setup.

## Lambda packaging

I was spending a while in dealing “Cannot find module ‘index’” error. Turns out it was a packaging mistake. I was zipping the project, not the deployable artifacts with the correct handler path. I learned to build, zip from the build output, and confirm the handler entry point before shipping. I
also added a pre-deploy checklist.

## Custom domain

Wiring a personal domain forced me to understand ACM validation, Route 53 records, and propagation timing. The lesson was ownership of the whole path from DNS to stage. Next time I will script this with IaC so the setup is reproducible.