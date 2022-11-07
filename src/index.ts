import express from 'express'
import { config } from 'dotenv'
import { urlencoded } from 'body-parser'
import { telegramBot } from './config/telegram'
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
    const valid_commands = ['add', 'remove']
    const chatId = message.chat.id
    const msg = message.text as string
    const words = msg.trim().split(' ')
    if(words.length != 2){
        telegramBot.sendMessage(chatId, 'Please enter a valid message')
    }
    else if(!valid_commands.includes(words[0].toLowerCase())){
        telegramBot.sendMessage(chatId, 'Please enter a valid command')
    }
    else {
        telegramBot.sendMessage(chatId, 'Valid command')
    }
    // await createWebhooks(`https://webhooks.com/${address}`, address)
})