import { dynamoClient } from '../config/dynamoDB'
import { IWebhookLog } from './interfaces/IWebhookLog'

const addTransactionToDB = async ({ 
    id, 
    webhookId, 
    createdAt, 
    event 
}: IWebhookLog, message: string, chatIds: Array<number>) => {

    const { hash : transaction_hash } = event.activity
    console.log(transaction_hash)
    try {
        const res = await dynamoClient.put({
            TableName: 'wallet_transactions',
            Item: {
                transaction_hash,
                webhookId,
                id,
                createdAt,
                network: event.network,
                activity: event.activity,
                message,
                chat_ids: chatIds
            }
        })
        return res
    }
    catch(err){
        return err
    }
}

export { addTransactionToDB }