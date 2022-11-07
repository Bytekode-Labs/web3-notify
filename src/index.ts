import express from 'express'
import { config } from 'dotenv'
import { urlencoded } from 'body-parser'
import { telegramBot } from './config/telegram'
import { parseMessage } from './utils/parseMessage'
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
    // create alchemy webhook
    const chatId = message.chat.id
    const msg = message.text as string
    const response = await parseMessage(msg)
    // await createWebhooks(`https://webhooks.com/${address}`, address)
    telegramBot.sendMessage(chatId, response)
})