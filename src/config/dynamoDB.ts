import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { config as env } from 'dotenv'
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'
env()

const accessKeyId = process.env.AWS_ACCESS_KEY_ID as string
const secretAccessKey = process.env.AWS_SECRET_KEY as string

const dynamoDbClient = new DynamoDBClient({
    credentials: {
        accessKeyId, secretAccessKey
    }
})

const TABLE_NAME = `wallet_notifications`

const dynamoClient = DynamoDBDocument.from(dynamoDbClient)

export { dynamoClient, TABLE_NAME }