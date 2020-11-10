import { CasinoBetPublicFilter } from "../filters/casino_history.filter";
import { ServiceWithRequestInfo } from "../../../../../CommonJS/src/components/service_with_request_info/service_with_request_info";
import { ICasinoBetPublicFilter } from "../interfaces/casino_history.interface";
import { IListWithPagination } from "../../../../../CommonJS/src/interfaces/list_with_pagination.interface";
import { IDashboardFilterParams } from "../../../../../CoreService/src/components/dashboard/filters/dashboard.filter";
import { BaseModel } from "../../../../../CommonJS/src/base/base.model";
import { CasinoBet } from "../../casino_bet/models/casino_bet.model";
import { ErrorUtil, ErrorCodes } from "../../../../../CommonJS/src/messaging/ErrorCodes";
import { round } from "lodash";
import moment = require("moment");

export class CasinoHistoryService extends ServiceWithRequestInfo {
    public async list(data: ICasinoBetPublicFilter): Promise<IListWithPagination> {
        return new CasinoBetPublicFilter(Object.assign(data, this.requestInfo)).find();
    }

    async betsByDate(filter: IDashboardFilterParams) {
        const reg = /^\d{4}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])$/;
        if (
            !filter.end_date ||
            !filter.end_date.toString().match(reg) ||
            !filter.start_date ||
            !filter.start_date.toString().match(reg) ||
            new Date(filter.start_date) > new Date(filter.end_date)
        )
            throw ErrorUtil.newError(ErrorCodes.INVALID_DATE);

        filter.start_date = moment(filter.start_date)
            .startOf("day")
            .format();
        filter.end_date = moment(filter.end_date)
            .endOf("day")
            .format();
        const query = `
            select 
            count(id) as count, 
            date,
            sum(stake_usd) as stake, 
            sum(won_amount_usd) as won_amount 
            from ${CasinoBet.tableName}
            where date between '${filter.start_date}' and '${filter.end_date}' and website_id = ${filter.website_id}
            group by date
            order by date desc;
            `;
        const result = await BaseModel.manyOrNoneRaw(query);

        return result.map(r => {
            r.stake = round(r.stake, 2);
            r.won_amount = round(r.won_amount, 2);
            return r;
        });
    }
}
