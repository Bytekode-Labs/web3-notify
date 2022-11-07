import { DynamoDB } from 'aws-sdk'
import { config as env } from 'dotenv'
env()

const accessKeyId = process.env.AWS_ACCESS_KEY_ID as string
const secretAccessKey = process.env.AWS_SECRET_KEY as string

const dynamoClient = new DynamoDB({
    credentials: {
        accessKeyId, secretAccessKey
    }
})

const TABLE_NAME = `wallet_notifications`

export { dynamoClient, TABLE_NAME }