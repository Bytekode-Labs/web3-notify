import { IActivityLog } from "./IActivityLog";

interface IWebhookLog {
    id: string,
    webhook_id: string,
    network: string,
    activity: IActivityLog
}

export { IWebhookLog }