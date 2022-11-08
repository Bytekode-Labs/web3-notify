import express from 'express'
import { config } from 'dotenv'
import { urlencoded } from 'body-parser'
import { telegramBot } from './config/telegram'
import { parseMessage, updateChatIds } from './utils/parseMessage'
import { fetchChatIdsByAddress } from './utils/findChatIds'
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

app.post('/test', async (req, res) => {
    const address = '0x03f142529a7B70305C07a50fAA44f6EBDADB4624'
    const chatIds = [1,2,3]
    await updateChatIds(address, chatIds)
    res.status(200)
})