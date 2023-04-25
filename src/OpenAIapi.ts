import { Configuration, OpenAIApi } from 'openai'
import {config} from 'dotenv'
config()
const openaiApiKey = process.env.OPENAI_API_KEY as string
const configuration = new Configuration({
    organization: "org-uhejXjLvZgnYlhLcvSC2KxAR",
    apiKey: openaiApiKey
})

export const openai = new OpenAIApi(configuration)