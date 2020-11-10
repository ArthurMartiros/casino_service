import { isNil } from "lodash";
import { ChannelType } from "../../../../../CommonJS/src/enums/channel_type.enum";
import { DEFAULT_WEB_SITE } from "../../../../../CommonJS/src/domain/constant";
import { QueryBuilder } from "../../../../../CommonJS/src/base/base.model";

import { ICasinoGameOrderFilter } from "../interfaces/casino_game_order_filter.interface";
import { ICasinoGameOrder } from "../interfaces/casino_game_order.interface";
import { CasinoGameOrderModel } from "../models/casino_game_order.model";

export class CasinoGameOrderFilter implements ICasinoGameOrderFilter {
    public casino_game_id?: number;
    public website_id: number;
    public channel_id: ChannelType;
    public page: number;

    constructor(data: ICasinoGameOrderFilter) {
        this.casino_game_id = data.casino_game_id;
        this.website_id = data.website_id || DEFAULT_WEB_SITE;
        this.channel_id = data.channel_id || ChannelType.BACKEND;
        this.casino_game_id = data.casino_game_id;
        this.page = data.page || 1;
        if (this.page <= 0) this.page = 1;
    }

    public async findList(): Promise<ICasinoGameOrder[]> {
        const query = QueryBuilder(CasinoGameOrderModel.tableName).where({ page: this.page });
        if (!isNil(this.casino_game_id)) query.where(`casino_game_id`, this.casino_game_id);
        if (this.channel_id) query.where(`channel_id`, this.channel_id);
        if (this.website_id) query.where(`website_id`, this.website_id);
        return CasinoGameOrderModel.manyOrNone(query);
    }
}
