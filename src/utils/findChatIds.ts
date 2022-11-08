import { dynamoClient, TABLE_NAME } from '../config/dynamoDB'
import { GetCommand } from '@aws-sdk/lib-dynamodb'

const fetchChatIdsByAddress = async (address: string) => {
    const chatIds = await dynamoClient.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: {
            wallet_address: address
        }
    }))
    return chatIds
}

export { fetchChatIdsByAddress }