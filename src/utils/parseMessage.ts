import { utils } from 'ethers'

const valid_commands = ['add', 'remove']

const parseMessage = async (msg: string) => {
    const words = msg.trim().split(' ')
    if(words.length != 2){
        return('Please enter a valid message')
    }
    else if(!valid_commands.includes(words[0].toLowerCase())){
        return('Please enter a valid command')
    }
    else {
        if(words[0] == 'add'){
            // if 2nd word is an address, check if address exists in db
            if(utils.isAddress(words[1])){
                return ('Successfully added')
            }
            return ('Please add a valid wallet address')
        }
        if(utils.isAddress(words[1])){
            return('Successfully removed')
        }
        return ('Wallet address not found')
    }
}

export { parseMessage }