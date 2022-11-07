import { Alchemy, Network } from 'alchemy-sdk'
import { config } from 'dotenv'
config()

const authToken = process.env.ALCHEMY_AUTH_TOKEN as string

const settings = {
    authToken,
    network: Network.MATIC_MUMBAI 
}

const alchemy = new Alchemy(settings)

export { alchemy }