import { utils } from 'ethers'
import TelegramBot from 'node-telegram-bot-api'
import { dynamoClient, TABLE_NAME } from '../config/dynamoDB'
import { createWebhooks } from './createWebhook'
import { PutCommand } from '@aws-sdk/lib-dynamodb'

const valid_commands = ['add', 'remove']

const addMessageToDB = async (message: TelegramBot.Message, address: string) => {
    const { id, type } = message.chat
    const msg = message.text as string
    await dynamoClient.send(new PutCommand({
        TableName: `wallet_notifications`,
        Item: {
            wallet_address: address,
            id,
            type,
            msg
        }
    }))
}

const parseMessage = async (message: TelegramBot.Message) => {
    const msg = message.text as string
    const words = msg.trim().split(' ')
    if(words.length != 2){
        return('Please enter a valid message')
    }
    else if(!valid_commands.includes(words[0].toLowerCase())){
        return('Please enter a valid command')
    }
    else {
        if(words[0] == 'add'){
            // if 2nd word is an address, check if address exists in db
            if(utils.isAddress(words[1])){
                try {
                    await createWebhooks(words[1])
                    await addMessageToDB(message, words[1])
                    return ('Successfully added')
                }
                catch (er){
                    console.log(er)
                    return('Unable to add wallet. Please try again')
                }
            }
            return ('Please add a valid wallet address')
        }
        if(utils.isAddress(words[1])){
            return('Successfully removed')
        }
        return ('Wallet address not found')
    }
}

export { parseMessage }