import express from 'express'
import { config } from 'dotenv'
import { urlencoded } from 'body-parser'
import { telegramBot } from './config/telegram'
import { parseMessage, updateChatIds } from './utils/parseMessage'
import { fetchChatIdsByAddress } from './utils/findChatIds'
import { dynamoClient } from './config/dynamoDB'
import { GetCommand } from '@aws-sdk/lib-dynamodb'

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

// alchemy notification webhooks
app.post('/webhooks/:wallet_address', async (req, res) => {
    const { wallet_address } = req.params
    const message = req.body
    // find chatIds where the wallet address is subscribed
})

// telegram bot websockets
telegramBot.on('message', async (message) => {
    // create alchemy webhook
    const chatId = message.chat.id
    const response = await parseMessage(message)
    telegramBot.sendMessage(chatId, response)
})

app.get('/webhooks/:address', async (req, res) => {
    const { address } = req.params 
    console.log(address)
    let message = `Your transaction is success`
    // get all chatIds
    try {
        const chatIds = await fetchChatIdsByAddress(address)
        for(let i = 0; i < chatIds.length; i++){
            await telegramBot.sendMessage(chatIds[i], message)
        }
        res.json({ message }).status(200)
    }
    catch(err){
        res.json(err)
    }
})