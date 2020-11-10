import { BaseModel } from "../../../../../CommonJS/src/base/base.model";
import { ICasinoGameOrder } from "../interfaces/casino_game_order.interface";
import { ChannelType } from "../../../../../CommonJS/src/enums/channel_type.enum";
import { DEFAULT_WEB_SITE } from "../../../../../CommonJS/src/domain/constant";
import { CasinoGameWeight } from "../enums/casino_weight.enum";

export class CasinoGameOrderModel extends BaseModel implements ICasinoGameOrder {
    public static tableName = "casino_games_order";
    public casino_game_id: number;
    public website_id: number;
    public channel_id: ChannelType;
    public position_x: number;
    public position_y: number;
    public weight: CasinoGameWeight;
    public page: number;
    constructor(data: ICasinoGameOrder) {
        super();
        this.casino_game_id = data.casino_game_id ? data.casino_game_id : -1;
        this.website_id = data.website_id || DEFAULT_WEB_SITE;
        this.channel_id = data.channel_id || ChannelType.BACKEND;
        this.position_x = data.position_x || 0;
        this.position_y = data.position_y || 0;
        this.weight = data.weight || CasinoGameWeight.SMALL;
        this.page = data.page || 1;
    }
}
