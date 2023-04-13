import express from 'express'
import { config } from 'dotenv'
import { urlencoded } from 'body-parser'
import { telegramBot } from './config/telegram'
import { parseMessage } from './utils/parseMessage'
import { fetchChatIdsByAddress } from './utils/findChatIds'
import { ethers } from 'ethers'
import { addTransactionToDB } from './utils/addTransactionToDB'


// const provider = new ethers.providers.WebSocketProvider('wss://polygon-mumbai.g.alchemy.com/v2/CC-YaEP9wPG0mtb2SlesCoDRUlfhAppE');

config()

const polygon_mainnet_websocket_url = process.env.POLYGON_MAINNET_WEBSOCKET_URL as string

const uniswap_contract_address = process.env.UNISWAP_CONTRACT_ADDRESS as string
const uniswap_from_address = process.env.UNISWAP_FROM_ADDRESS as string
const sushiswap_contract_address = process.env.SUSHISWAP_CONTRACT_ADDRESS as string  
const sushiswap_from_address = process.env.SUSHISWAP_FROM_ADDRESS as string

const provider = new ethers.providers.WebSocketProvider(polygon_mainnet_websocket_url);

var txTo = '';
var func_executed = 'xyz';
var toToken = '';
var fromToken = '';
var toValue = '';
var fromValue = '';
var platform = '';
var txn_network = '';

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
    telegramBot.sendMessage(chatId, response, {
        parse_mode: 'HTML'
    })
})

// alchemy notifications webhooks
app.post('/webhooks/:address', async (req, res) => {
    const { address } = req.params
    const body = await req.body
    console.log(body)
    const { id, webhookId, createdAt, event: log } = body
    const event = {
        network: log.network,
        activity: log.activity[0]
    }
    txn_network = event.network
    const messageLog = await body.event.activity[0]
    let message = ''



    async function getConfirmedTransactionDetails(txHash : any) {
        const tx = await provider.getTransaction(txHash);
        if (tx && tx.blockNumber) {
          if((tx.from ).toLowerCase() == messageLog.fromAddress.toLowerCase()){
              if ((tx.to)?.toLowerCase()) {
                txTo = tx.to;
                func_executed = await getContractABI();
              } else {
                console.log("Unable to get contract address from the given transaction hash.");
              }
          }
        }
      }
    
      async function getContractABI(): Promise<any> {
        try {
            if((txTo).toLowerCase() === (sushiswap_contract_address).toLowerCase()){
                platform = 'Sushiswap'
                return 'swap'
            }
            else if((txTo).toLowerCase() === (uniswap_contract_address).toLowerCase()){
                platform = 'Uniswap'
                return 'swap'
            }
        } catch (error) {
          console.error("Error while fetching contract ABI:", error);
        }
        return null;
      }

      await getConfirmedTransactionDetails(messageLog.hash)

      if(messageLog.category == 'token'){
        // if the transfer is an NFT transfer 
        if(messageLog.erc721TokenId != undefined){
            // if the user receives NFT
            if(address.toLowerCase() == messageLog.toAddress){
                message = `📢 You've got a message for ${address} 📢\n\n🥳Congrats on your new NFT🥳`
            }
            else {
                let tokenId = ethers.BigNumber.from(messageLog.erc721TokenId)
                message = `📢 You've got a message for ${address} 📢\n\nYour NFT with token ID: <b>${tokenId}</b> was successfully sent to <b><i>${messageLog.toAddress}</i></b>`
            }
        }
        else {
            if(address.toLowerCase() == messageLog.fromAddress){
                message = `📢 You've got a message for ${address} 📢
                \nYou've sent <b>${messageLog.value} ${messageLog.asset}</b> to <b><i>${messageLog.toAddress}</i></b>
                `
            }
            else {
                toValue = messageLog.value;
                toToken = messageLog.asset;
                if((messageLog.fromAddress).toLowerCase() !== (uniswap_from_address).toLowerCase() && (messageLog.fromAddress).toLowerCase() !== (sushiswap_from_address).toLowerCase())
                {
                    message = `📢 You've got a message for ${address} 📢
                    \nYou've received <b>${messageLog.value} ${messageLog.asset}</b> from <b><i>${messageLog.fromAddress}</i></b>
                    `
                }
            }    
        }
    }

    if(messageLog.category == 'external' && messageLog.value != 0){
        if(address.toLowerCase() == messageLog.fromAddress){
            fromValue = messageLog.value;
            fromToken = messageLog.asset;
            if((messageLog.toAddress).toLowerCase() === (uniswap_contract_address).toLowerCase() || (messageLog.toAddress).toLowerCase() === (sushiswap_contract_address).toLowerCase()){
            message = `📢 You've got a message for ${address} 📢
                \n\nCongratulations 🥳 !! You've successfully swapped <b>${toValue} ${toToken}</b> for <b>${fromValue} ${fromToken}</b> on ${txn_network} via <b><i>${platform}</i></b>`
            }
            else{
                message = `📢 You've got a message for ${address} 📢
                \nYou've sent <b>${messageLog.value} ${messageLog.asset}</b> to <b><i>${messageLog.toAddress}</i></b>`
            }
        }
        else {
            message = `📢 You've got a message for ${address} 📢
            \nYou've received <b>${messageLog.value} ${messageLog.asset}</b> from <b><i>${messageLog.fromAddress}</i></b>`
        }
    }

    try {
        const chatIds = await fetchChatIdsByAddress(address)
        for(let i = 0; i < chatIds.length; i++){
            await telegramBot.sendMessage(chatIds[i], message, {
                parse_mode: 'HTML'
            })
        }
        await addTransactionToDB({
            createdAt, event, id, webhookId
        }, message, chatIds)
        res.json({ message }).status(200)
    }
    catch(err){
        res.json(err)
    }
})