import { Configuration, OpenAIApi } from 'openai'
const openaiApiKey = "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"
const configuration = new Configuration({
    organization: "org-uhejXjLvZgnYlhLcvSC2KxAR",
    apiKey: openaiApiKey
})

export const openai = new OpenAIApi(configuration)