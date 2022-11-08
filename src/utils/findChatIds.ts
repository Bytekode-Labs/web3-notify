import { dynamoClient, TABLE_NAME } from '../config/dynamoDB'

const fetchChatIdsByAddress = async (address: string) => {
    const chatIds = await dynamoClient.get({
        TableName: TABLE_NAME,
        Key: {
            wallet_address: address
        }
    })
    if(chatIds.Item){
        return chatIds.Item.ids as Array<number>
    }
    return []
}

export { fetchChatIdsByAddress }