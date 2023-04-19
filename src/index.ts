import express from 'express'
import { config } from 'dotenv'
import { urlencoded } from 'body-parser'
import { telegramBot } from './config/telegram'
import { parseMessage } from './utils/parseMessage'
import { fetchChatIdsByAddress } from './utils/findChatIds'
import { ethers } from 'ethers'
import { addTransactionToDB } from './utils/addTransactionToDB'
import { Dcyfr } from 'bytekode-eth-decoder'
import uniswapabi from './utils/abis/UniswapABI.json'
import sushiswapabi from './utils/abis/SushiswapABI.json'
import { Configuration, OpenAIApi } from "openai";

// const provider = new ethers.providers.WebSocketProvider('wss://polygon-mumbai.g.alchemy.com/v2/CC-YaEP9wPG0mtb2SlesCoDRUlfhAppE');

config()
const polygon_mainnet_websocket_url = process.env.POLYGON_MAINNET_WEBSOCKET_URL as string
const uniswap_contract_address = process.env.UNISWAP_CONTRACT_ADDRESS as string
const sushiswap_contract_address = process.env.SUSHISWAP_CONTRACT_ADDRESS as string
const openai_org_id = process.env.OPENAI_ORG_ID as string
const openai_api_key = process.env.OPENAI_API_KEY as string
const uniswap_lp_contract_address = process.env.UNISWAP_LP_CONTRACT_ADDRESS as string
const provider = new ethers.providers.WebSocketProvider(polygon_mainnet_websocket_url);

interface ITransaction {
    txTo : string,
    func_executed : any ,
    toToken : string,
    fromToken : string,
    toValue : string,
    fromValue : string,
    platform : string,
    txn_network : string,
    txndata : any,
    response : any,
    decodedResponse : any,
    unidecodedResponse : any,
    sushidecodedResponse : any
}

let details: ITransaction = {
    txTo: "",
    func_executed: null,
    toToken: "",
    fromToken: "",
    toValue: "",
    fromValue: "",
    platform: "",
    txn_network: "",
    txndata: null,
    response: null,
    decodedResponse: null,
    unidecodedResponse : null,
    sushidecodedResponse : null
  };


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

    details.txn_network = event.network
    const messageLog = await body.event.activity[0]
    let message = ''

    const configuration = new Configuration({
        organization: openai_org_id,
        apiKey: openai_api_key,
    });
    const openai = new OpenAIApi(configuration);

    async function getConfirmedTransactionDetails(txHash : any) {
        const tx = await provider.getTransaction(txHash);
        if (tx && tx.blockNumber) {
          details.txndata = tx.data;
          if((tx.from ).toLowerCase() == messageLog.fromAddress.toLowerCase()){
              if ((tx.to)?.toLowerCase()) {
                details.txTo = tx.to;
                details.func_executed = await getContractABI();
              } else {
                console.log("Unable to get contract address from the given transaction hash.");
              }
          }
        }
      }
    
      async function getContractABI(): Promise<any> {
        try {

            if((details.txTo).toLowerCase() === (uniswap_lp_contract_address).toLowerCase()){
                details.response = await openai.createChatCompletion({
                    model: "gpt-3.5-turbo",
                    messages: [{role: "user", content: `A successful transaction request to add ${details.fromToken} of value ${details.fromValue} to the Liquidity pool of Uniswap has been made. Convert this into a simpler human-understandable form`,}],
                    temperature: 0.5,
                    max_tokens: 20,
                    top_p: 1.0,
                    frequency_penalty: 0.52,
                    presence_penalty: 0.5,
                  });
                return details.response.data.choices[0].message?.content
            }

            if((details.txTo).toLowerCase() === (uniswap_contract_address).toLowerCase()){
                details.response = await openai.createChatCompletion({
                    model: "gpt-3.5-turbo",
                    messages: [{role: "user", content: `Convert the following transaction detail for a successful swap occuring in Uniswap into a human-understandable form:
                    input token : ${details.fromToken}
                    input token amount : ${details.fromValue}
                    output token : ${details.toToken}
                    output token amount : ${details.toValue}
                    `,}],
                    temperature: 0.5,
                    max_tokens: 200,
                    top_p: 1.0,
                    frequency_penalty: 0.52,
                    presence_penalty: 0.5,
                  });
                return details.response.data.choices[0].message?.content
            }

            if((details.txTo).toLowerCase() === (sushiswap_contract_address).toLowerCase()){
                details.response = await openai.createChatCompletion({
                    model: "gpt-3.5-turbo",
                    messages: [{role: "user", content: `Convert the following transaction details occuring in Sushiswap into a human-understandable form:
                    input token : ${details.fromToken}
                    input token amount : ${details.fromValue}
                    output token : ${details.toToken}
                    output token amount : ${details.toValue}
                    `,}],
                    temperature: 0.5,
                    max_tokens: 200,
                    top_p: 1.0,
                    frequency_penalty: 0.52,
                    presence_penalty: 0.5,
                  });
                return details.response.data.choices[0].message?.content
            }
            
        } catch (error) {
          console.error("Error while fetching contract ABI:", error);
        }
        return null;
      }


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
                details.toValue = messageLog.value;
                details.toToken = messageLog.asset;
                if((details.txTo).toLowerCase() !== ('0x4c60051384bd2d3c01bfc845cf5f4b44bcbe9de5').toLowerCase() && (details.txTo).toLowerCase() !== ('0x0dc8e47a1196bcb590485ee8bf832c5c68a52f4b').toLowerCase())
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
            details.fromValue = messageLog.value;
            details.fromToken = messageLog.asset;
            if((messageLog.toAddress).toLowerCase() === (uniswap_contract_address).toLowerCase() || (messageLog.toAddress).toLowerCase() === (sushiswap_contract_address).toLowerCase()){
                await getConfirmedTransactionDetails(messageLog.hash)
                message = `📢 You've got a message for ${address} 📢
                \n<b><i>${details.func_executed}</i></b>`
            }
            else if((messageLog.toAddress).toLowerCase() === (uniswap_lp_contract_address).toLowerCase()){
                    await getConfirmedTransactionDetails(messageLog.hash)
                    message = `📢 You've got a message for ${address} 📢
                    \n<b><i>${details.func_executed}</i></b>`
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
