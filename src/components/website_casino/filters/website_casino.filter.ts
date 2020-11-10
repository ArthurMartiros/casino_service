import { IWebsiteCasinoFilter } from "../interfaces/website_casino.interface";
import { WebsiteCasinoModel } from "../models/website_casino.model";
import { QueryBuilder } from "../../../../../CommonJS/src/base/base.model";
import { isBoolean, isNumber } from "lodash";

export class WebsiteCasinoFilter implements IWebsiteCasinoFilter {
    public id?: number;
    public casino_id?: number;
    public status?: number;
    public website_id?: number;
    public test?: boolean;

    constructor(data: IWebsiteCasinoFilter) {
        this.id = data.id;
        this.casino_id = data.casino_id;
        this.status = data.status_id;
        this.website_id = data.website_id;
    }

    private static async queryConst(filter: IWebsiteCasinoFilter) {
        const query = QueryBuilder.table(WebsiteCasinoModel.tableName);
        if (filter.id) query.where("id", filter.id);
        if (filter.casino_id) query.where("casino_id", filter.casino_id);
        if (filter.status_id) query.where("status_id", filter.status_id);
        if (filter.website_id) query.where("website_id", filter.website_id);
        if (isBoolean(filter.test)) query.where("test", filter.test);
        if (!(isBoolean(filter.unlimited) && filter.unlimited)) {
            const limit: number = isNumber(filter.limit) && filter.limit > 0 ? filter.limit : 10;
            const offset: number = isNumber(filter.page) && filter.page > 0 ? filter.page - 1 : 0;
            query.offset(offset);
            query.limit(limit);
        }

        return query.toString();
    }

    public static async FindAll(filter: IWebsiteCasinoFilter): Promise<WebsiteCasinoModel[]> {
        filter = new this(filter);
        const query = await this.queryConst(filter);
        return WebsiteCasinoModel.manyOrNone(query);
    }
}
