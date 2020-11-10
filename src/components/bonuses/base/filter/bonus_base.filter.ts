import { QueryBuilder } from "../../../../../../CommonJS/src/base/base.model";
import { MIN_DATE, MAX_DATE } from "../../../../../../CommonJS/src/domain/constant";
import { IBaseBonusFilter } from "../interfaces/bonus.interface";
import { BonusStatus } from "../../../../../../CoreService/src/components/bonuses/base/enums/bonus_status.enum";

export class BaseBonusFilter implements IBaseBonusFilter {
    public static tableName: string;
    public id?: number;
    public name?: string;
    public status_id?: BonusStatus;
    public amount?: number;
    public currency_id?: number;
    public period?: number;
    public start_date_from: Date;
    public start_date_to: Date;
    public end_date_from: Date;
    public end_date_to: Date;
    public sort_by?: string;
    public sort_order?: string;
    
    constructor(data: IBaseBonusFilter) {
        this.id = data.id;
        this.name = data.name;
        this.status_id = data.status_id;
        this.amount = data.amount;
        this.currency_id = data.currency_id;
        this.period = data.period;
        this.start_date_from = data.start_date_from || MIN_DATE;
        this.start_date_to = data.start_date_to || MAX_DATE;
        this.end_date_from = data.end_date_from || MIN_DATE;
        this.end_date_to = data.end_date_to || MAX_DATE;
        this.sort_by = data.sort_by || `id`;
        this.sort_order = data.sort_order || `desc`;
    }

    public static getQuery(data: IBaseBonusFilter) {
        const filter = new BaseBonusFilter(data);
        const query = QueryBuilder(this.tableName)
            .whereBetween("start_date", [new Date(filter.start_date_from).toISOString(), new Date(filter.start_date_to).toISOString()])
            .whereBetween("end_date", [new Date(filter.end_date_from).toISOString(), new Date(filter.end_date_to).toISOString()])
            .orderBy(<string>filter.sort_by, filter.sort_order);
        if (filter.id) query.where({ id: filter.id });
        if (filter.name) query.where(`name`, `ilike`, `%${filter.name}%`);
        if (filter.status_id) query.where({ status_id: filter.status_id });
        if (filter.currency_id) query.where({ currency_id: filter.currency_id });
        if (filter.amount) query.where({ amount: filter.amount });
        if (filter.period) query.where({ period: filter.period });
        return query;
    }
}
