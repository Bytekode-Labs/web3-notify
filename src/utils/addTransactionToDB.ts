import { dynamoClient } from '../config/dynamoDB'
import { IWebhookLog } from './interfaces/IWebhookLog'

const addTransactionToDB = async ({ 
    id, 
    webhookId, 
    createdAt, 
    event 
}: IWebhookLog) => {

    const { hash : transaction_hash } = event.activity
    try {
        const res = await dynamoClient.put({
            TableName: 'wallet_transactions',
            Item: {
                transaction_hash,
                webhookId,
                id,
                createdAt,
                network: event.network,
                activity: event.activity
            }
        })
        return res
    }
    catch(err){
        return err
    }
}

export { addTransactionToDB }