import { BaseModel } from "../../../../../CommonJS/src/base/base.model";
import { SessionStatus } from "../enums/session.enum";
import { ChannelType } from "../../../../../CommonJS/src/enums/channel_type.enum";
import { ISessionModel } from "../interfaces/session.interface";
import { IpLookup } from "../../../../../CommonJS/src/utils/utils";
import { DEFAULT_WEB_SITE } from "../../../../../CommonJS/src/domain/constant";
import { ErrorUtil, ErrorCodes } from "../../../../../CommonJS/src/messaging/ErrorCodes";

export class SessionModel extends BaseModel implements ISessionModel {
    public static tableName = "sessions";

    public id?: number;
    public casino_game_id: number;
    public currency_id: number;
    public currency_code: string;
    public token?: string;
    public signature?: string;
    public status?: SessionStatus;
    public channel_id: ChannelType;
    public website_id: number;
    public user_id: number;
    public amount: number;
    public action_id?: number;
    public callback_id?: string;
    public refund_action_id?: number;
    public refund_callback_id?: string;
    public details?: string;
    public ping_date: Date;
    public ip: string;
    public ip_country: string;

    public constructor(data?: ISessionModel) {
        super();
        this.create(data);
    }

    private create(data?: ISessionModel) {
        if (!data) return;
        this.id = data.id ? data.id : this.id;
        this.casino_game_id = data.casino_game_id ? data.casino_game_id : this.casino_game_id;
        this.currency_id = data.currency_id;
        this.currency_code = data.currency_code;
        this.token = data.token ? data.token : this.token;
        this.signature = data.signature ? data.signature : this.signature;
        this.status = data.status ? data.status : this.status;
        this.user_id = data.user_id ? data.user_id : this.user_id;
        this.amount = data.amount || 0;
        this.action_id = data.action_id ? data.action_id : this.action_id;
        this.callback_id = data.callback_id ? data.callback_id : this.callback_id;
        this.refund_action_id = data.refund_action_id ? data.refund_action_id : this.refund_action_id;
        this.refund_callback_id = data.refund_callback_id ? data.refund_callback_id : this.refund_callback_id;
        this.details = data.details ? data.details : this.details;
        this.ping_date = data.ping_date || new Date();
        this.ip = data.ip;
        this.ip_country = data.ip_country;
        this.channel_id = data.channel_id;
        this.website_id = data.website_id || DEFAULT_WEB_SITE;
    }

    public async createStartSession(
        user_id: number,
        currency_id: number,
        currency_code: string,
        casino_game_id: number,
        token: string,
        ip: string,
        channel_id: number,
        website_id: number
    ) {
        this.user_id = user_id;
        this.currency_id = currency_id;
        this.currency_code = currency_code;
        this.casino_game_id = casino_game_id;
        this.token = token;
        this.status = SessionStatus.OPEN;
        this.channel_id = channel_id || ChannelType.WEB;
        this.website_id = website_id || DEFAULT_WEB_SITE;
        this.ip = ip;
        const geoIpData = IpLookup(this.ip);
        if (geoIpData) this.ip_country = geoIpData.country;
        await this.saveWithID();
    }

    public static async findByToken(token: string) {
        const session = await SessionModel.findOne({ token });
        if (!session) throw ErrorUtil.newError(ErrorCodes.SESSION_NOT_FOUND);
        return session;
    }
}
