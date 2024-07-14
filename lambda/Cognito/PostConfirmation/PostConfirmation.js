// this source code is inlined in the CloudFormation ...

const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb")

const dynamodb = new DynamoDBClient()

exports.handler = async (event) => {
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