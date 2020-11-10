import { map } from "bluebird";
import { ServiceWithRequestInfo } from "../../../../../CommonJS/src/components/service_with_request_info/service_with_request_info";
import { ICasinoGameOrder } from "../interfaces/casino_game_order.interface";
import { CasinoGameOrderFilter } from "../filters/casino_game_order.filter";
import { CasinoGameOrderModel } from "../models/casino_game_order.model";
import { ICasinoGameOrderFilter } from "../interfaces/casino_game_order_filter.interface";
import { toNumber, cloneDeep } from "lodash";

export class CasinoGameOrderService extends ServiceWithRequestInfo {
    public async list(filter: ICasinoGameOrderFilter): Promise<ICasinoGameOrder[]> {
        return new CasinoGameOrderFilter(Object.assign(this.requestInfo, filter)).findList();
    }

    public async update(data: ICasinoGameOrder[]): Promise<ICasinoGameOrder[]> {
        const requestInfo = cloneDeep(this.requestInfo);
        // delete popular grid
        const defaultGrid = data.every(i => toNumber(i.casino_game_id) === -1);
        if (defaultGrid) {
            data = data.map(item => new CasinoGameOrderModel(Object.assign(requestInfo, item)));
            const website_id = data[0].website_id;
            const channel_id = data[0].channel_id;
            await CasinoGameOrderModel.delete({ casino_game_id: -1, website_id, channel_id });
            return map(data, async item => new CasinoGameOrderModel(item).save());
        }
        //
        return map(data, async item => {
            item = new CasinoGameOrderModel(Object.assign(requestInfo, item));
            const byFields = {
                casino_game_id: item.casino_game_id,
                website_id: item.website_id,
                channel_id: item.channel_id
            };
            let order = await CasinoGameOrderModel.findOne(byFields);
            if (!order) return new CasinoGameOrderModel(item).save();
            else return order.update(item, byFields);
        });
    }
}
