import { config} from 'dotenv'
import TelegramBot from 'node-telegram-bot-api'
config()

const telegramToken = process.env.TELEGRAM_AUTH_TOKEN as string

const telegramBot = new TelegramBot(telegramToken, {
    polling: true
})

export { telegramBot }