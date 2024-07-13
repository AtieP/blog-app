
const debug = require("debug")("AWS:DynamoDB")


import { CreateTableCommand, DeleteItemCommand, DynamoDBClient, ListTablesCommand, ListTablesCommandOutput, PutItemCommand, QueryCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb"
import NoSQL from "../../interfaces/NoSQL"
import PostAttributes from "../../models/PostAttributes"
import User from "../../models/User"
import config from "../../config"
import log from "../../log"
import Comment from "../../models/Comment"



class DynamoDBProvider implements NoSQL {
    private client: DynamoDBClient

    private async CreateUsersTable(): Promise<void> {
        log.info("creating users table")
        const cmd = new CreateTableCommand({
            TableName: "users",
            AttributeDefinitions: [
                {
                    AttributeName: "username",
                    AttributeType: "S"
                }
            ],
            KeySchema: [
                {
                    AttributeName: "username",
                    KeyType: "HASH"
                }
            ],
            ProvisionedThroughput: config.AWS.DynamoDB.ProvisionedThroughput.users,
            BillingMode: "PROVISIONED"
        })

        const result = await this.client.send(cmd)
        if (result.$metadata.httpStatusCode !== 200) {
            log.error("Error creating users table")
            process.exit(1)
        }
    }

    private async CreatePostsTable(): Promise<void> {
        log.info("creating posts table")
        const cmd = new CreateTableCommand({
            TableName: "posts",
            AttributeDefinitions: [
                {
                    AttributeName: "postId",
                    AttributeType: "S"
                },
                {
                    AttributeName: "username",
                    AttributeType: "S"
                }
            ],
            KeySchema: [
                {
                    AttributeName: "postId",
                    KeyType: "HASH"
                }
            ],
            GlobalSecondaryIndexes: [
                {
                    IndexName: "userIndex",
                    ProvisionedThroughput: config.AWS.DynamoDB.ProvisionedThroughput.posts,
                    Projection: {
                        NonKeyAttributes: ["title", "caption", "captionImage", "creationDate"],
                        ProjectionType: "INCLUDE"
                    },
                    KeySchema: [
                        {
                            AttributeName: "username",
                            KeyType: "HASH"
                        }
                    ]
                }
            ],
            ProvisionedThroughput: config.AWS.DynamoDB.ProvisionedThroughput.posts,
            BillingMode: "PROVISIONED"
        })

        const result = await this.client.send(cmd)
        if (result.$metadata.httpStatusCode !== 200) {
            log.error("error creating posts table")
            process.exit(1)
        }
    }

    private async CreateCommentsTable(): Promise<void> {
        log.info("creating comments table")
        const cmd = new CreateTableCommand({
            TableName: "comments",
            AttributeDefinitions: [
                {
                    AttributeName: "postId",
                    AttributeType: "S"
                },
                {
                    AttributeName: "commentId",
                    AttributeType: "S"
                },
                {
                    AttributeName: "username",
                    AttributeType: "S"
                }
            ],
            KeySchema: [
                {
                    AttributeName: "postId",
                    KeyType: "HASH"
                },
                {
                    AttributeName: "commentId",
                    KeyType: "RANGE"
                }
            ],
            GlobalSecondaryIndexes: [
                {
                    IndexName: "userIndex", // for assisting on deletions
                    KeySchema: [
                        {
                            AttributeName: "username",
                            KeyType: "HASH"
                        }
                    ],
                    Projection: {
                        ProjectionType: "KEYS_ONLY"
                    },
                    ProvisionedThroughput: config.AWS.DynamoDB.ProvisionedThroughput.comments
                }
            ],
            ProvisionedThroughput: config.AWS.DynamoDB.ProvisionedThroughput.comments,
            BillingMode: "PROVISIONED"
        })

        const result = await this.client.send(cmd)
        if (result.$metadata.httpStatusCode !== 200) {
            log.error("error creating comments table")
            process.exit(1)
        }
    }

    public async Init(): Promise<void> {
        debug("initializing client")
        this.client = new DynamoDBClient({
            endpoint: config.AWS.DynamoDB.endpoint,
            region: config.AWS.DynamoDB.region,
            credentials: config.AWS.DynamoDB.credentials
        })

        // Verify that tables exist
        debug("querying tables")
        const tableCmdOut: ListTablesCommandOutput = await this.client.send(
            new ListTablesCommand()
        )
        if (tableCmdOut.$metadata.httpStatusCode != 200) {
            log.error("Error querying list of tables")
            process.exit(1)
        }

        if (tableCmdOut.TableNames.indexOf("users") === -1) {
            await this.CreateUsersTable()
        }

        if (tableCmdOut.TableNames.indexOf("posts") === -1) {
            await this.CreatePostsTable()
        }

        if (tableCmdOut.TableNames.indexOf("comments") === -1) {
            await this.CreateCommentsTable()
        }

        log.info("DynamoDB connection initialized")
    }

    public async QueryUserByName(username: string): Promise<User | null> {
        debug("querying user", username)
        const cmd = new QueryCommand({
            TableName: "users",
            Select: "ALL_ATTRIBUTES",
            ConsistentRead: false,
            KeyConditionExpression: "username = :username",
            ExpressionAttributeValues: {
                ":username": {
                    "S": username
                }
            }
        })

        const result = await this.client.send(cmd)
        if (result.Count === 0) {
            return null
        }

        const item = result.Items[0]
        return {
            username: item.username.S,
            creationDate: new Date(item.creationDate.S),
            fullName: item.fullName.S,
            profilePicture: item.profilePicture.S,
            bio: item.bio.S
        }
    }

    public async QueryPostAttributesById(postId: string): Promise<PostAttributes> {
        debug("querying post attributes for", postId)
        const cmd = new QueryCommand({
            TableName: "posts",
            Select: "ALL_ATTRIBUTES",
            ConsistentRead: false,
            KeyConditionExpression: "postId = :postId",
            ExpressionAttributeValues: {
                ":postId": {
                    "S": postId
                }
            }
        })

        const result = await this.client.send(cmd)
        if (result.Count === 0) {
            return null
        }

        const item = result.Items[0]
        return {
            postId: item.postId.S,
            title: item.title.S,
            caption: item.caption.S,
            captionImage: item.captionImage.S,
            username: item.username.S,
            creationDate: new Date(item.creationDate.S)
        }
    }

    public async QueryUserPosts(username: string): Promise<PostAttributes[]> {
        debug("querying posts for user", username)
        const cmd = new QueryCommand({
            TableName: "posts",
            IndexName: "userIndex",
            KeyConditionExpression: "username = :username",
            ExpressionAttributeValues: {
                ":username": {
                    "S": username
                }
            },
            Select: "ALL_PROJECTED_ATTRIBUTES",
            ConsistentRead: false
        })

        const result = await this.client.send(cmd)
        const posts: PostAttributes[] = []
        for (const post of result.Items) {
            posts.push({
                postId: post.postId.S,
                username: post.username.S,
                title: post.title.S,
                caption: post.caption.S,
                captionImage: post.captionImage.S,
                creationDate: new Date(post.creationDate.S)
            })
        }

        return posts
    }

    public async UpdateUser(username: string, user: Partial<User>): Promise<void> {
        debug("updating user", username)

        const updateExpressions = []
        const expressionAttributeValues = {}
        for (const attr in user) {
            if (typeof user[attr] === "undefined") {
                continue
            }

            updateExpressions.push(`${attr} = :${attr}`)
            expressionAttributeValues[`:${attr}`] = {}
            expressionAttributeValues[`:${attr}`]["S"] = user[attr]
        }

        const updateExpression = "SET " + updateExpressions.join(", ")

        const cmd = new UpdateItemCommand({
            TableName: "users",
            Key: {
                "username": {
                    "S": username
                }
            },
            ExpressionAttributeValues: expressionAttributeValues,
            UpdateExpression: updateExpression
        })

        await this.client.send(cmd)
    }

    public async CreatePostAttributes(post: PostAttributes): Promise<void> {
        debug("creating new post attributes for user", post.username)
        const cmd = new PutItemCommand({
            TableName: "posts",
            Item: {
                "postId": {
                    "S": post.postId
                },
                "username": {
                    "S": post.username
                },
                "title": {
                    "S": post.title
                },
                "caption": {
                    "S": post.caption
                },
                "captionImage": {
                    "S": post.captionImage
                },
                "creationDate": {
                    "S": post.creationDate.toISOString()
                }
            }
        })

        await this.client.send(cmd)
    }

    public async UpdatePostAttributes(username: string, post: Partial<PostAttributes>): Promise<void> {
        debug("updating post attributes", post.postId, "by user", username)
        
        const updateExpressions = []
        const expressionAttributeValues = {}
        for (const item in post) {
            switch (item) {
                case "username":
                    throw new Error("cannot update username of a post")
                case "creationDate":
                    throw new Error("cannot update creationDate of a post")
                case "postId":
                    break
                default:
                    if (typeof post[item] === "undefined") {
                        break
                    }

                    updateExpressions.push(`${item} = :${item}`)
                    expressionAttributeValues[`:${item}`] = {}
                    expressionAttributeValues[`:${item}`]["S"] = post[item]
            }
        }

        const updateExpression = "SET " + updateExpressions.join(", ")

        const cmd = new UpdateItemCommand({
            TableName: "posts",
            Key: {
                "postId": {
                    "S": post.postId
                }
            },
            ExpressionAttributeValues: {
                ...expressionAttributeValues,
                ":username": {
                    "S": username
                }
            },
            UpdateExpression: updateExpression,
            ConditionExpression: "username = :username"
        })

        await this.client.send(cmd)
    }

    public async DeletePostAttributes(username: string, postId: string): Promise<void> {
        debug("deleting post attributes", postId, "by user", username)

        const cmd = new DeleteItemCommand({
            TableName: "posts",
            Key: {
                "postId": {
                    "S": postId
                }
            },
            ExpressionAttributeValues: {
                ":username": {
                    "S": username
                }
            },
            ConditionExpression: "username = :username"
        })

        await this.client.send(cmd)
    }

    public async QueryPostComments(postId: string, offset: number, limit: number): Promise<Comment[]> {
        debug("querying comments from post", postId, "offset", offset, "limit", limit)
        const cmd = new QueryCommand({
            TableName: "comments",
            KeyConditionExpression: "postId = :postId",
            ExpressionAttributeValues: {
                ":postId": {
                    "S": postId
                }
            },
            Select: "ALL_ATTRIBUTES",
            ConsistentRead: false
        })

        const result = await this.client.send(cmd)
        const ret: Comment[] = []
        for (const comment of result.Items) {
            ret.push({
                commentId: comment.commentId.S,
                postId: comment.postId.S,
                username: comment.username.S,
                content: comment.content.S,
                creationDate: new Date(comment.creationDate.S)
            })
        }

        return ret
    }

    public async CreateComment(comment: Comment): Promise<void> {
        debug("creating comment on post", comment.postId, "commentId", comment.commentId)
        const cmd = new PutItemCommand({
            TableName: "comments",
            Item: {
                "postId": {
                    "S": comment.postId
                },
                "commentId": {
                    "S": comment.commentId
                },
                "username": {
                    "S": comment.username
                },
                "content": {
                    "S": comment.content
                },
                "creationDate": {
                    "S": comment.creationDate.toISOString()
                }
            }
        })

        await this.client.send(cmd)
    }

    public async DeleteComment(username: string, postId: string, commentId: string): Promise<void> {
        debug("deleting comment from post", postId, "comment", commentId, "user", username)
        const cmd = new DeleteItemCommand({
            TableName: "comments",
            ExpressionAttributeValues: {
                ":username": {
                    "S": username
                }
            },
            Key: {
                "postId": {
                    "S": postId
                },
                "commentId": {
                    "S": commentId
                }
            },
            ConditionExpression: "username = :username"
        })

        await this.client.send(cmd)
    }
}


export default new DynamoDBProvider()