import { IActivityLog } from "./IActivityLog";

interface IWebhookLog {
    id: string,
    webhookId: string,
    createdAt: string,
    event: {
        network: string,
        activity: IActivityLog
    }
}

export { IWebhookLog }