import { alchemy } from '../config/alchemy'
import { WebhookType, Network } from 'alchemy-sdk'

const createWebhooks = async (address: string) => {
    
    let baseUrl = `http://pushbytesapi-env.eba-f29zp2r7.us-west-1.elasticbeanstalk.com`
    let webhookUrl = `${baseUrl}/webhooks/${address}`
    
    try {
        await alchemy.notify.createWebhook(
            webhookUrl,
            WebhookType.ADDRESS_ACTIVITY,
            {
              addresses: [address],
              network: Network.MATIC_MUMBAI,
            }
        )
        await alchemy.notify.createWebhook(
            webhookUrl,
            WebhookType.ADDRESS_ACTIVITY,
            {
              addresses: [address],
              network: Network.MATIC_MAINNET,
            }
        )
        await alchemy.notify.createWebhook(
            webhookUrl,
            WebhookType.ADDRESS_ACTIVITY,
            {
              addresses: [address],
              network: Network.ETH_MAINNET,
            }
        )
    }
    catch (err) {
        return err
    }
}

export { createWebhooks }