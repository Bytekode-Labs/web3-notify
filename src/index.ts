import express from 'express'
import { config } from 'dotenv'
import { urlencoded } from 'body-parser'
import { telegramBot } from './config/telegram'
import { parseMessage } from './utils/parseMessage'
import { fetchChatIdsByAddress } from './utils/findChatIds'
import { MessageEntity } from 'node-telegram-bot-api'
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
    telegramBot.sendMessage(chatId, response)
})

/*
telegramBot.onText(/\/echo (.+)/, (msg, match) => {
    const { chat, date, message_id, location } = msg 
    const message = `📢 You've got a message for wallet B 📢
    \nYou've received ${`<b>0.01 MATIC</b>`} from <b><i>abc</i></b>
    `
    telegramBot.sendMessage(chat.id, message, {
        parse_mode: 'HTML'
    })
    console.log(chat, message_id, location)
})
*/

// alchemy notifications webhooks
app.post('/webhooks/:address', async (req, res) => {
    const { address } = req.params
    const body = await req.body
    console.log(body.event.network)
    const messageLog = await body.event.activity[0]
    
    let message = `📢 You've got a message for ${address} 📢
    \nYou've received <b>${messageLog.asset}</b> from <b><i>${messageLog.fromAddress}</i></b>
    `
    console.log(messageLog)
    if(address == messageLog.fromAddress){
        message = `📢 You've got a message for ${address} 📢
        \nYou've sent <b>${messageLog.asset}</b> to <b><i>${messageLog.toAddress}</i></b>
        `
    }
    try {
        const chatIds = await fetchChatIdsByAddress(address)
        for(let i = 0; i < chatIds.length; i++){
            await telegramBot.sendMessage(chatIds[i], message, {
                parse_mode: 'HTML'
            })
        }
        res.json({ message }).status(200)
    }
    catch(err){
        res.json(err)
    }
})