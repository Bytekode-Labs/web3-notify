import { utils } from 'ethers'
import TelegramBot from 'node-telegram-bot-api'
import { dynamoClient } from '../config/dynamoDB'
import { createWebhooks } from './createWebhook'
import { PutCommand } from '@aws-sdk/lib-dynamodb'
import { fetchChatIdsByAddress } from './findChatIds'

const valid_commands = ['add', 'remove']

const addAddress = async (message: TelegramBot.Message, address: string) => {
    const { id } = message.chat
    await dynamoClient.send(new PutCommand({
        TableName: `wallet_notifications`,
        Item: {
            wallet_address: address,
            ids: [id]
        }
    }))
}

const updateChatIds = async (address: string, chatIds: Array<number>) => {
    await dynamoClient.send(new PutCommand({
        TableName: `wallet_notifications`,
        Item: {
            wallet_address: address,
            ids: [chatIds]
        }
    }))
}

const parseMessage = async (message: TelegramBot.Message) => {
    const { id: chatId } = message.chat
    const msg = message.text as string
    if(msg.toLowerCase() == '/start'){
        let response = `Hello Anon! Welcome to <b>insync</b> 👋\nTrack your wallet activity in real-time across <b>ETH, Polygon & more.</b>\n\nTo track an address, simply text me: \n\n<b>add 0xabcd...your_address</b>\n\nWe'll send you a message anytime you send or receive any tokens on this address\n\nLFG🚀`
        return response
    }
    const words = msg.trim().split(' ')
    if(words.length != 2){
        let response = `We're not sure what that message does 😶‍🌫️\n\nTo track your wallet address, simply enter this command:\n\n<b>add "your wallet address"</b>` 
        return response
    }
    else if(!valid_commands.includes(words[0].toLowerCase())){
        return('Please enter a valid command')
    }
    else {
        if(words[0] == 'add'){
            // if 2nd word is an address, check if address exists in db
            if(utils.isAddress(words[1])){
                try {
                    // checks if address exists in db
                    const chatIds = await fetchChatIdsByAddress(words[1])
                    if(chatIds.length == 0){
                        await createWebhooks(words[1])
                        await addAddress(message, words[1])
                        return (`We've added your address! We'll dm you anytime you send or receive money`)
                    }
                    else {
                        let newChatIds = [...chatIds, chatId]
                        await updateChatIds(words[1], newChatIds)
                        return (`We've added your address! We'll dm you anytime you send or receive money`)
                    }
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

export { parseMessage, updateChatIds }