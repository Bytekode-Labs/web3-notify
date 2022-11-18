interface IActivityLog {
    fromAddress: string,
    toAddress: string,
    blockNum: string,
    hash: string,
    value?: number,
    asset?: string,
    category: string,
    rawContract?: IRawContract
    log: ITransactionLog
}

interface ITransactionLog {
    address: string,
    topics: Array<string>,
    data: string,
    blockNumber: string,
    transactionHash: string,
    transactionIndex: string,
    blockhash: string,
    logIndex: string,
    removed: boolean
}

interface IRawContract {
    rawValue: string,
    address: string,
    decimals: number
}

export { IActivityLog } 