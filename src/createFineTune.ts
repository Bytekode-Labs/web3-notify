import { openai } from './OpenAIapi'

async function createFineTune() {
  try {
    const response = await openai.createFineTune({
      training_file: 'file-xYfPypUe96otoH8zoLaQ6WIk',
      model: 'davinci'
    })
    console.log('response: ', response)
  } catch (err : any) {
    console.log('error: ', err.response.data.error)
  }
}

createFineTune()