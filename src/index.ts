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
import aaveabi from './utils/abis/AaveABI.json'
import { Configuration, OpenAIApi } from "openai";
import { openai } from './OpenAIapi'


config()
const polygon_testnet_websocket_url = process.env.POLYGON_TESTNET_WEBSOCKET_URL as string
const polygon_mainnet_websocket_url = process.env.POLYGON_MAINNET_WEBSOCKET_URL as string
const uniswap_contract_address = process.env.UNISWAP_CONTRACT_ADDRESS as string
const uniswap_lp_contract_address = process.env.UNISWAP_LP_CONTRACT_ADDRESS as string
const sushiswap_contract_address = process.env.SUSHISWAP_CONTRACT_ADDRESS as string
const aave_lp_contract_address = process.env.AAVE_LP_CONTRACT_ADDRESS as string
const provider = new ethers.providers.WebSocketProvider(polygon_mainnet_websocket_url);
const testnet_provider = new ethers.providers.WebSocketProvider(polygon_testnet_websocket_url);
const model = process.env.MODEL as string

interface ITransaction {
    txTo : string,
    txnHash : string,
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
    txnHash: "",
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

let repayToken : string = "";
let repayAmt : string = "";

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

    async function getTestnetTransactionDetails(txHash : any) {
        const tx = await testnet_provider.getTransaction(txHash);
        if (tx && tx.blockNumber) {
          details.txndata = tx.data;
          details.txnHash = txHash;
          if((tx.from ).toLowerCase() == messageLog.toAddress.toLowerCase()){
              if ((tx.to)?.toLowerCase()) {
                  details.txTo = tx.to;
                  details.func_executed = await getContractABI();
              } else {
                console.log("Unable to get contract address from the given transaction hash.");
              }
          }
        }
      }

      async function getTestnetTransactionDetails2(txHash : any) {
        const tx = await testnet_provider.getTransaction(txHash);
        if (tx && tx.blockNumber) {
          details.txndata = tx.data;
          details.txnHash = txHash;
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

    async function getConfirmedTransactionDetails(txHash : any) {
        const tx = await provider.getTransaction(txHash);
        if (tx && tx.blockNumber) {
          details.txndata = tx.data;
          details.txnHash = txHash;
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
                details.platform = "Uniswap";
                details.response = await openai.createCompletion({
                    model: model,
                    prompt: `Convert the following transaction details into human understandable form: Transaction hash-${details.txnHash}, Platform-${details.platform}, Input token-${details.fromToken}, Input token amount-${details.fromValue}`,
                    max_tokens: 22
                  });
                return details.response.data.choices[0]?.text
            }

            else if(details.txTo.toLowerCase() == (aave_lp_contract_address).toLowerCase()){
                const dcyfr = new Dcyfr(aaveabi)
                const data = details.txndata
                details.decodedResponse = dcyfr.getTxInfoFromData({ data })
                const func = details.decodedResponse?.func
                if(func === 'repay')
                {
                    details.platform = "AAVE";
                    details.response = await openai.createCompletion({
                        model: model,
                        prompt: `Convert the following transaction details into human understandable form: Transaction hash-${details.txnHash}, Platform-${details.platform}, Repay token-${repayToken}, Repay token amount-${repayAmt}`,
                        max_tokens: 22
                      });
                    return details.response.data.choices[0]?.text
                }
                else if(func === 'borrow')
                {
                    details.platform = "AAVE";
                    details.response = await openai.createCompletion({
                        model: model,
                        prompt: `Convert the following transaction details into human understandable form: Transaction hash-${details.txnHash}, Platform-${details.platform}, Borrow token-${details.toToken}, Borrow token amount-${details.toValue}`,
                        max_tokens: 22
                      });
                    return details.response.data.choices[0]?.text
                }
                else if(func === 'withdraw')
                {
                    details.platform = "AAVE";
                    details.response = await openai.createCompletion({
                        model: model,
                        prompt: `Convert the following transaction details into human understandable form: Transaction hash-${details.txnHash}, Platform-${details.platform}, Withdraw token-${details.toToken}, Withdraw token amount-${details.toValue}`,
                        max_tokens: 22
                      });
                    return details.response.data.choices[0]?.text
                }
            }

            else if((details.txTo).toLowerCase() === (uniswap_contract_address).toLowerCase()){
                details.platform = "Uniswap";
                details.response = await openai.createCompletion({
                    model: model,
                    prompt: `Convert the following transaction details into human understandable form: Transaction hash-${details.txnHash}, Platform-${details.platform}, Input token-${details.fromToken}, Input token amount-${details.fromValue}, Output token-${details.toToken}, Output token amount-${details.toValue}`,
                    max_tokens: 22
                  });
                return details.response.data.choices[0]?.text
            }

            else if((details.txTo).toLowerCase() === (sushiswap_contract_address).toLowerCase()){
                details.platform = "Sushiswap";
                details.response = await openai.createCompletion({
                    model: model,
                    prompt: `Convert the following transaction details into human understandable form: Transaction hash-${details.txnHash}, Platform-${details.platform}, Input token-${details.fromToken}, Input token amount-${details.fromValue}, Output token-${details.toToken}, Output token amount-${details.toValue}`,
                    max_tokens: 22
                  });
                return details.response.data.choices[0]?.text
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
                //repay in aave
                repayToken = messageLog.asset
                repayAmt = messageLog.value
                await getTestnetTransactionDetails2(messageLog.hash)
                message = `📢 You've got a message for ${address} 📢
                \n<b><i>${details.func_executed}</i></b>
                `
            }
            else {
                details.toValue = messageLog.value;
                details.toToken = messageLog.asset;
                if((messageLog.toAddress).toLowerCase() === (address).toLowerCase())
                {
                    //borrow and withdraw in aave
                    await getTestnetTransactionDetails(messageLog.hash)
                    message = `📢 You've got a message for ${address} 📢
                    \n<b><i>${details.func_executed}</i></b>
                    `
                }

                else
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
            else
            {
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