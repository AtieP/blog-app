This is a very simple blog site, written in TypeScript and using a fair bunch of AWS's services.

# Features
- Users, blog posts, comments
- Authentication (possibly even federated)
- REST API and React + Tailwind frontend
- Written in Typescript
- Heavily dependant on AWS: DynamoDB, Cognito (user pool + hosted UI), Lambda, S3, CloudFormation
- In-memory cache, rate limiting
- Nonetheless, other database/authentication/caching providers can be implemented, see `api/src/interfaces`
- Easily deployable with Docker compose, the frontend and backend
are in their own containers and accessible via the internet with a third nginx container

# Code organization
## API
The API source code is in the `api` directory. Inside, the top-level `index.ts` file is responsible for the initialization. All the logic is found in the `src` directory.
- `config/` hosts the `index.ts` file, which contains an interface for the `config` object, and imports the `config.ts` file in the same directory, which is made available in the directory via Docker secrets (see the instructions on how to deploy)
- `controllers/` has the handlers for the API routes, which are plugged to them by `routes/Api.ts` (see the API documentation for more details)
- `interfaces/` and `models/` provide definitions for the data which is being worked on and class blueprints for the database/authentication/cache/etc providers
- `log/` imports the Bunyan package which is responsible for logging and exports the `log` object
- `middleware/` has functions which assist on repetitive tasks on routes, such as rate limiting, authentication, and so on
- `providers/` contains implementation-specific code which implements the interfaces defined in `interfaces/`

## Website
The website is a React Next.js project, so for more information on the layout please read [the Next.js documentation on project organization and routing](https://nextjs.org/docs/app/building-your-application/routing).

## Miscellaneous
### Nginx
The Dockerfile and configuration file for nginx can be found in the `nginx/` directory.

### AWS Lambda
Currently, AWS Lambda is used to create user entries for new users in the DynamoDB database, via the [Cognito Post confirmation Lambda Trigger](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-post-confirmation.html). The source code for it is in `lambda/Cognito/PostConfirmation`. After running `npm install`, bundle the function into a ZIP using `npm run bundle`, and then use `npm run createFunction` to submit it into Lambda. Do not forget to create a role which grants access to the `users` DynamoDB table for the function, and to associate the function with the Cognito user pool Post confirmation trigger.

### Secrets
Both the API and website require knowing some secrets, such as API keys, secret user pool client IDs, and AWS credentials.  

#### API
For configuring the API secrets, create a `secrets/` directory in the root directory of the project, and then create an `api/` subdir. Inside, you can write an `.env` file, and a `config.ts` file. These will be made available in the Docker container, the former in the API source code directory, and the latter inside `src/config`. Please check `api/src/config/index.ts` for the format of the configuration file. The .env file can be used in `config.ts` via dotenv.

#### Website
The website only has to know the backend API URL, the Internet visible API URL, and the URL of the AWS Cognito Hosted UI. For that, create the `secrets/website` directory, and an `.env` file with the following keys:
```
SERVER_API_URL=http://api/api (if using Docker compose, otherwise whatever's necessary)
NEXT_PUBLIC_API_URL=<API URL accessible from the browser>
NEXT_PUBLIC_AUTH_HOSTED_UI=<AWS Cognito Hosted UI URL>
```
**WARNING**: The environment variables will be baked into the website Docker image. These secrets are only made visible during the build process.

# Building
## For development
You can follow the Production steps, but if you do not feel like building new Docker images every time you make a change in your code, and you want to make use of Next.js' development experience, you can avoid using Docker at all, and instead run the components manually. Read the instructions on how to set up the secrets, but copy the secrets files into the source code directories instead. Then, use `npm run dev`.  

If you do not want to use AWS CloudFormation, you'll have to create manually:
- A S3 bucket
- The Lambda for the Post Confirmation hook (see` lambda/Cognito/PostConfirmation`), along with a role which allows the lambda access to the DynamoDB users table
- A Cognito User Pool, along with two app integrations: a client for the Hosted UI without a secret, and another one for the API with a secret

It is not necessary to create the DynamoDB tables manually. The API DynamoDB provider does that automatically, if they do not exist. It is highly recommended [to install the AWS DynamoDB NoSQL Workbench](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/workbench.settingup.install.html) or use [the DynamoDB local Docker image](https://hub.docker.com/r/amazon/dynamodb-local) to have a DynamoDB instance running locally.

Nonetheless, running the application in development mode should incur in practically no AWS costs. AWS users can make use of free:
- 5GB S3 storage, along with 20000 GET requests and 2000 POST requests, for the first 12 months.
- 50000 MAU (monthly active users), as long as federation and the advanced security features are not used, case in which it is limited to 50 MAU. Two-factor authentication is available for free, and for testing 50 Cognito emails for both confirmation and password recovery requests are available, per month. **Always free**.
- 1 million Lambda requests and 400,000 GB-seconds per month. **Always free**.
- 25GB for DynamoDB storage with 25 RCUs and WCUs, in provisioned mode. This is the default mode for this application. **Always free**.

## Production
1. Create the stack:  
`aws cloudformation create-stack --stack-name blog-app --template-body file://$(pwd)/CloudFormation.yml --capabilities CAPABILITY_NAME_IAM`  
Make sure to check the content and modify default values, such as domain names and so on.
2. Create an EC2 instance, and download the code on it, along with Docker.
3. Set up secrets and so on. Edit `nginx/ngix.conf`.
4. `docker compose up -d`, on the project root. For logs, use `docker compose logs [service]`. The `service` argument is optional.

# API Documentation

## Authentication
When required, include an `Authorization` HTTP header with the access token, as a bearer. Example:   
`Authorization: Bearer <access token>`  
The access token will be validated and checked whether it has been revoked.  
To check whether an error has occurred while authenticating, check for the existence of the `WWW-Authenticate` header, and read the `error` field of the response JSON.

## Endpoints

The base endpoint for all requests is **`/api/v1`**. If a body is required, it is of type `application/json`. So, include the following header in these requests:  
`Content-Type: application/json`  
The returned data is always JSON. For successful requests that do not return bodies, check the `message` field. For failed requests, check the `error` field. These are human-readable messages.

### User endpoint
#### GET `/user/<username>`
Retrieves the information about the user.  
Access key required: false   
Returns:   
- 200: The following JSON:
```json
{
    "username": string,
    "fullName": string,
    "creationDate": string,
    "profilePicture": string,
    "bio": string,
    "posts": PostAttributes[]
}
```
For more information on PostAttributes, see `GET /post/<postId>`
- 404: User not found    
- 429: Rate limit exceeded

#### PUT `/user/<username>`
Updates an user's information.  The access key owner must be the one of the user.
Access key required: true  
Body:
```json
{
    "fullName": string? (max 50 chars),
    "profilePicture": URL? (max 256 chars),
    "bio": string? (max 200 chars)
}
```
Returns:
- 200: User updated successfully
- 400: Bad JSON format, or invalid parameters
- 403: Access token user does not match the username
- 404: User not found
- 429: Rate limit exceeded

#### DELETE `/user/<username>`
Deletes the user.  The access key owner must be the one of the user.  
Access key required: true  
Body: none  
Returns:
- 501: Not implemented

### Post endpoint

#### POST `/post`
Creates a new post.  
Access key required: true  
Body:
```json
{
    "title": string (max 100 characters),
    "caption": string (max 200 characters),
    "captionImage": URL (max 256 characters),
    "content": string (max 200000 characters)
}
```
Returns:
- 201: Post has created successfully, the following response header and JSON are sent:  
`Location: /api/v1/post/<postId>`  
```json
{
    "message": string,
    "location": "/api/v1/post/<postId>"
}
```
- 400: Invalid JSON or invalid parameters
- 429: Rate limit exceeded

#### GET `/post/<postId>`
Retrieves a post's attributes and content.  
Access key required: false  
Returns:
- 200: The following JSON:
```json
{
    // post attributes
    "postId": string,
    "title": string,
    "caption": string,
    "captionImage": URL,
    "username": string,
    "creationDate": string,

    // post content
    "content": string
}
```
- 404: Post not found
- 429: Rate limit exceeded

#### PUT `/post/<postId>`
Updates a post's attributes. Ownership over the post is required.  
Access key required: true  
Body:
```json
{
    "title": string? (max 100 chars),
    "caption": string? (max 200 chars),
    "captionImage": string? (max 256 chars)
}
```
Returns:
- 200: Post updated successfully
- 400: Invalid JSON or parameters
- 403: Not owner of post
- 404: Post not found
- 429: Rate limit exceeded

#### DELETE `/post/<postId>`
Deletes a post. Ownership over the post is required.  
Access key required: true  
Body: none  
Returns:
- 200: Post deleted successfully
- 403: Not owner of post
- 404: Post not found
- 429: Rate limit exceeded

#### GET `/post/<postId>/comment`
Retrieve a post's comments.  
Access key required: false  
Returns: 
- 200: The following JSON:
```json
{
    "comments": {
        "commentId": string,
        "postId": string,
        "username": string,
        "content": string,
        "creationDate": string
    }[]
}
```
- 404: Post not found
- 429: Rate limit exceeded

#### POST `/post/<postId>/comment`
Create a new comment.  
Access key required: true  
Body:
```json
{
    "content": string (max 1000 characters)
}
```
Returns:
- 201: Comment created successfully, the following JSON is returned:
```json
{
    "commentId": string,
    "postId": string,
    "username": string,
    "content": string,
    "creationDate": string
}
```
- 400: Invalid JSON or parameters
- 404: Post not found
- 429: Rate limit exceeded

#### DELETE `/post/<postId>/comment/<commentId>`
Deletes a comment. Ownership over the comment is required.  
Access key required: true  
Body: none
Returns:
- 200: Comment deleted successfully
- 403: Not owner of comment
- 404: Post or comment not found
- 429: Rate limit exceeded
