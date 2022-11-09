import express from 'express'
import { config } from 'dotenv'
import { urlencoded } from 'body-parser'
import { telegramBot } from './config/telegram'
import { parseMessage } from './utils/parseMessage'
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


// telegram bot websockets
telegramBot.on('message', async (message) => {
    // create alchemy webhook
    const chatId = message.chat.id
    const response = await parseMessage(message)
    telegramBot.sendMessage(chatId, response)
})

// alchemy notifications webhooks
app.post('/webhooks/:address', async (req, res) => {
    const { address } = req.params 
    const body = await req.body
    const messageLog = body.event.activity[0]

    const message = `You've got a message for ${address}📢📢\n
        You've received ${messageLog.value} ${messageLog.asset} from ${messageLog.fromAddress}.
    `
    console.log(address)
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