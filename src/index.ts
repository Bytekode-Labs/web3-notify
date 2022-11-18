import express from 'express'
import { config } from 'dotenv'
import { urlencoded } from 'body-parser'
import { telegramBot } from './config/telegram'
import { parseMessage } from './utils/parseMessage'
import { fetchChatIdsByAddress } from './utils/findChatIds'
import { ethers } from 'ethers'
import { addTransactionToDB } from './utils/addTransactionToDB'
import { IWebhookLog } from './utils/interfaces/IWebhookLog'
import { dynamoClient } from './config/dynamoDB'

config()

// env vars
const port = process.env.PORT || 8080

const app = express()

//middleware
app.use(express.json())
app.use(urlencoded({ extended: false }))

app.listen(port, () => {
    console.log(`Bytekode API is live on port: ${port}`)
})

// ping
app.get('/', (req, res) => {
    res.json({
        "message": "Service is active."
    })
})


// telegram bot websockets

telegramBot.on('message', async (message) => {
    const chatId = message.chat.id
    const response = await parseMessage(message)
    telegramBot.sendMessage(chatId, response, {
        parse_mode: 'HTML'
    })
})

// alchemy notifications webhooks
app.post('/webhooks/:address', async (req, res) => {
    const { address } = req.params
    const body = await req.body
    console.log(body)
    const { id, webhookId, createdAt, event: log } = body
    const event = {
        network: log.network,
        activity: log.activity[0]
    }
    const messageLog = await body.event.activity[0]
    let message = ''

    if(messageLog.category == 'token'){
        // if the transfer is an NFT transfer 
        if(messageLog.erc721TokenId != undefined){
            // if the user receives NFT
            if(address.toLowerCase() == messageLog.toAddress){
                message = `📢 You've got a message for ${address} 📢\n\n🥳Congrats on your new NFT🥳`
            }
            else {
                let tokenId = ethers.BigNumber.from(messageLog.erc721TokenId)
                message = `📢 You've got a message for ${address} 📢\n\nYour NFT with token ID: <b>${tokenId}</b> was successfully sent to <b><i>${messageLog.toAddress}</i></b>`
            }
        }
        else {
            if(address.toLowerCase() == messageLog.fromAddress){
                message = `📢 You've got a message for ${address} 📢
                \nYou've sent <b>${messageLog.value} ${messageLog.asset}</b> to <b><i>${messageLog.toAddress}</i></b>
                `
            }
            else {
                message = `📢 You've got a message for ${address} 📢
                \nYou've received <b>${messageLog.value} ${messageLog.asset}</b> from <b><i>${messageLog.fromAddress}</i></b>
                `
            }    
        }
    }
    console.log(messageLog)
    // external transfers -> value/curreny transfer
    if(messageLog.category == 'external'){
        if(address.toLowerCase() == messageLog.fromAddress){
            message = `📢 You've got a message for ${address} 📢
            \nYou've sent <b>${messageLog.value} ${messageLog.asset}</b> to <b><i>${messageLog.toAddress}</i></b>
            `
        }
        else {
            message = `📢 You've got a message for ${address} 📢
            \nYou've received <b>${messageLog.value} ${messageLog.asset}</b> from <b><i>${messageLog.fromAddress}</i></b>
            `
        }
    }
    try {
        const chatIds = await fetchChatIdsByAddress(address)
        for(let i = 0; i < chatIds.length; i++){
            await telegramBot.sendMessage(chatIds[i], message, {
                parse_mode: 'HTML'
            })
        }
        await addTransactionToDB({
            createdAt, event, id, webhookId
        }, message, chatIds)
        res.json({ message }).status(200)
    }
    catch(err){
        res.json(err)
    }
})

/*


app.post('/test', async (req, res) => {
    const { id, webhookId, createdAt, event: log } = await req.body
    const { network, activity } = log

    const event = {
        network,
        activity: activity[0]
    }

    const webhookLog: IWebhookLog = {
        createdAt, id, webhookId, event
    }

    await dynamoClient.put({
        TableName: 'wallet_transactions',
        Item: {
            transaction_hash: event.activity.hash,
            webhookId,
            id,
            createdAt,
            network,
            activity: event.activity
        }
    })
    console.log(webhookLog)
    // await addTransactionToDB({ id, createdAt, event, webhookId })
    res.status(200).json({ event })
})
*/