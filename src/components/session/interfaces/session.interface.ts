import { SessionStatus } from "../enums/session.enum";
import { ChannelType } from "../../../../../CommonJS/src/enums/channel_type.enum";

export interface ISessionModel {
    id?: number;
    casino_game_id: number;
    currency_id: number;
    currency_code: string;
    signature?: string;
    token?: string;
    callback_id?: string;
    status?: SessionStatus;
    user_id: number;
    amount?: number;
    action_id?: number;
    refund_action_id?: number;
    refund_callback_id?: string;
    details?: string;
    ping_date?: Date;
    ip: string;
    ip_country: string;
    channel_id: ChannelType;
    website_id: number;
}
