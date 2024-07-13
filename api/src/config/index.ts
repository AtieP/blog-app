import dotenv from "dotenv"


dotenv.config()


interface Configuration {
    AWS: {
        DynamoDB: {
            region?: string
            endpoint?: string   // to allow local testing
            credentials?: any   // check @aws-sdk/credential-providers
            ProvisionedThroughput? : {
                users: {
                    ReadCapacityUnits: number
                    WriteCapacityUnits: number
                }
                posts: {    // shared with userIndex
                    ReadCapacityUnits: number
                    WriteCapacityUnits: number
                }
                comments: { // shared with userIndex
                    ReadCapacityUnits: number
                    WriteCapacityUnits: number
                }
            }
        }
        Cognito: {
            region?: string,
            credentials?: any,
            userPoolId: string,
            clientIds: {
                api: string
                hostedUI?: string
            },
            clientSecret: {
                api: string
            }
        }
        S3: {
            region?: string,
            credentials?: any,
            bucketName: string
        }
    }

    API: {
        PORT: number
        IP: string
        corsOrigin: "*",
        rateLimit: boolean
    }

    development: boolean
}

import conf from "./config"
export default conf
