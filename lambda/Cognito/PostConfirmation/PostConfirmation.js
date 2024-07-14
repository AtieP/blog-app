// this source code is inlined in the CloudFormation ...

import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb"

const dynamodb = new DynamoDBClient()

export async function handler(event, context) {
  const username = event.userName
  const cmd = new PutItemCommand({
    TableName: "users",
    Item: {
      "username": {
        "S": username
      },
      "fullName": {
        "S": ""
      },
      "profilePicture": {
        "S": ""
      },
      "creationDate": {
        "S": (new Date()).toISOString()
      },
      "bio": {
        "S": ""
      }
    }
  })
  
  await dynamodb.send(cmd)
  return event
}