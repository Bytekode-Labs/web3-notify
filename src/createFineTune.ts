import { openai } from './OpenAIapi'
import {config} from 'dotenv'
config()

const training_file = process.env.TRAINING_FILE as string

async function createFineTune() {
  try {
    const response = await openai.createFineTune({
      training_file: training_file,
      model: 'davinci'
    })
    console.log('response: ', response)
  } catch (err : any) {
    console.log('error: ', err.response.data.error)
  }
}

createFineTune()