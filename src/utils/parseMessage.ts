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
        if(words[0] == 'add')
            return ('Successfully added')
        return('Successfully removed')
    }
}

export { parseMessage }