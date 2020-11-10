import { ICashBackFilter, ICashBackableUserFilter } from "../interfaces/cash_back.interface";
import { CashBackModel, CashBackableUser, CashBackCount, CashBackableUserCount } from "../models/cash_back.model";
import { CashBackStatusID, SettlementStatusID } from "../enums/cash_back_status.enum";
import { QueryBuilder } from "../../../../../CommonJS/src/base/base.model";
import { isUndefined } from "util";
import { NormalizePage, NormalizeLimit } from "../../../../../CommonJS/src/utils/utils";
import { IListWithPagination } from "../../../../../CommonJS/src/interfaces/list_with_pagination.interface";
import { all } from "bluebird";

export class CashBackFilter implements ICashBackFilter {
    public id?: number;
    public status_id?: CashBackStatusID;
    public start_date_from?: Date;
    public start_date_to?: Date;
    public end_date_from?: Date;
    public end_date_to?: Date;
    public recurring?: boolean;
    public settlement_date_from?: Date;
    public settlement_date_to?: Date;

    public ggr_percent_from?: number;
    public ggr_percent_to?: number;

    public casino_game_ids?: string;
    public casino_provider_ids?: string;

    public page: number;
    public limit: number;

    constructor(data: ICashBackFilter) {
        this.id = data.id;
        this.status_id = data.status_id;
        this.start_date_from = data.start_date_from;
        this.start_date_to = data.start_date_to;
        this.end_date_from = data.end_date_from;
        this.end_date_to = data.end_date_to;
        this.recurring = data.recurring;
        this.settlement_date_from = data.settlement_date_from;
        this.settlement_date_to = data.settlement_date_to;
        this.ggr_percent_from = data.ggr_percent_from;
        this.ggr_percent_to = data.ggr_percent_to;
        this.casino_game_ids = data.casino_game_ids;
        this.casino_provider_ids = data.casino_provider_ids;
        this.page = NormalizePage(data.page);
        if (this.page > 0) this.page = this.page - 1;
        this.limit = NormalizeLimit(data.limit);
    }

    public static FindSubCashBacks(data): Promise<CashBackModel[]> {
        return CashBackModel.findMany({ parent_id: data.parent_id }); // sub cash backs of parent cash back
    }

    public async FilterAllCashBacks(): Promise<IListWithPagination> {
        const query = QueryBuilder(CashBackModel.tableName);
        const queryCount = QueryBuilder(CashBackModel.tableName).select(QueryBuilder.raw(`count(*) as full_count`));

        if (!isUndefined(this.id)) {
            query.where("id", "=", this.id);
            queryCount.where("id", "=", this.id);
        }
        if (!isUndefined(this.status_id)) {
            query.where("status_id", "=", this.status_id);
            queryCount.where("status_id", "=", this.status_id);
        }
        if (!isUndefined(this.start_date_from) && !isUndefined(this.start_date_to)) {
            query.whereBetween("start_date", [new Date(this.start_date_from).toISOString(), new Date(this.start_date_to).toISOString()]);
            queryCount.whereBetween("start_date", [new Date(this.start_date_from).toISOString(), new Date(this.start_date_to).toISOString()]);
        }
        if (!isUndefined(this.end_date_from) && !isUndefined(this.end_date_to)) {
            query.whereBetween("end_date", [new Date(this.end_date_from).toISOString(), new Date(this.end_date_to).toISOString()]);
            queryCount.whereBetween("end_date", [new Date(this.end_date_from).toISOString(), new Date(this.end_date_to).toISOString()]);
        }
        if (!isUndefined(this.settlement_date_from) && !isUndefined(this.settlement_date_to)) {
            query.whereBetween("settlement_date", [new Date(this.settlement_date_from).toISOString(), new Date(this.settlement_date_to).toISOString()]);
            queryCount.whereBetween("settlement_date", [new Date(this.settlement_date_from).toISOString(), new Date(this.settlement_date_to).toISOString()]);
        }
        if (!isUndefined(this.ggr_percent_from)) {
            query.where("ggr_percent", ">=", this.ggr_percent_from);
            queryCount.where("ggr_percent", ">=", this.ggr_percent_from);
        }
        if (!isUndefined(this.ggr_percent_to)) {
            query.where("ggr_percent", "<=", this.ggr_percent_to);
            queryCount.where("ggr_percent", "<=", this.ggr_percent_to);
        }
        if (!isUndefined(this.casino_game_ids)) {
            this.casino_game_ids = this.casino_game_ids
                .replace("[", "")
                .replace("]", "")
                .replace("{", "")
                .replace("}", "");
            query.whereRaw(`casino_game_ids && '{${this.casino_game_ids}}'::bigint[]`);
            queryCount.whereRaw(`casino_game_ids && '{${this.casino_game_ids}}'::bigint[]`);
        }
        if (!isUndefined(this.casino_provider_ids)) {
            this.casino_provider_ids = this.casino_provider_ids
                .replace("[", "")
                .replace("]", "")
                .replace("{", "")
                .replace("}", "");
            query.whereRaw(`casino_provider_ids && '{${this.casino_provider_ids}}'::bigint[]`);
            queryCount.whereRaw(`casino_provider_ids && '{${this.casino_provider_ids}}'::bigint[]`);
        }
        if (isUndefined(this.recurring)) {
            query.whereRaw(`((recurring = true and parent_id is null) or ((recurring=false or recurring is null) and parent_id is null ))`);
            queryCount.whereRaw(`((recurring = true and parent_id is null) or ((recurring=false or recurring is null) and parent_id is null ))`);
        } else {
            query.whereRaw(`(recurring=${this.recurring}  and parent_id is null )`);
            queryCount.whereRaw(`(recurring=${this.recurring}  and parent_id is null )`);
        }

        query.limit(this.limit).offset(this.page * this.limit);

        const data = await all([CashBackModel.manyOrNone(query), CashBackCount.one(queryCount)]);
        // return data
        return <IListWithPagination>{
            data: data[0],
            full_count: data[1].full_count
        };
    }
}

export class CashBackableUsersFilter implements ICashBackableUserFilter {
    public id?: number;
    public user_id: number;
    public cash_back_id: number;
    public periodic: boolean;
    public amount_from: number;
    public amount_to: number;
    public amount_usd_from: number;
    public amount_usd_to: number;
    public total_stake_from: number;
    public total_stake_to: number;
    public total_stake_usd_from: number;
    public total_stake_usd_to: number;
    public total_won_amount_from: number;
    public total_won_amount_to: number;
    public total_won_amount_usd_from: number;
    public total_won_amount_usd_to: number;
    public settlement_date_from: Date;
    public settlement_date_to: Date;
    public ggr_percent_from: number;
    public ggr_percent_to: number;
    public settlement_status_id: SettlementStatusID;
    public currency_id: number;
    public date_from?: Date;
    public date_to?: Date;
    public page: number;
    public limit: number;

    constructor(data: ICashBackableUserFilter) {
        this.id = data.id;
        this.user_id = data.user_id;
        this.cash_back_id = data.cash_back_id;
        this.periodic = data.periodic;
        this.amount_from = data.amount_from;
        this.amount_to = data.amount_to;
        this.amount_usd_from = data.amount_usd_from;
        this.amount_usd_to = data.amount_usd_to;
        this.total_stake_from = data.total_stake_from;
        this.total_stake_to = data.total_stake_to;
        this.total_stake_usd_from = data.total_stake_usd_from;
        this.total_stake_usd_to = data.total_stake_usd_to;
        this.total_won_amount_from = data.total_won_amount_from;
        this.total_won_amount_to = data.total_won_amount_to;
        this.total_won_amount_usd_from = data.total_won_amount_usd_from;
        this.total_won_amount_usd_to = data.total_won_amount_usd_to;
        this.settlement_date_from = data.settlement_date_from;
        this.settlement_date_to = data.settlement_date_to;
        this.ggr_percent_from = data.ggr_percent_from;
        this.ggr_percent_to = data.ggr_percent_to;
        this.settlement_status_id = data.settlement_status_id;
        this.currency_id = data.currency_id;
        this.date_from = data.date_from;
        this.date_to = data.date_to;
        this.page = NormalizePage(data.page);
        if (this.page > 0) this.page = this.page - 1;
        this.limit = NormalizeLimit(data.limit);
    }

    public async Filter(): Promise<IListWithPagination> {
        const query = QueryBuilder(CashBackableUser.tableName);
        const queryCount = QueryBuilder(CashBackableUser.tableName).select(QueryBuilder.raw(`count(*) as full_count`));

        if (!isUndefined(this.id)) {
            query.where("id", "=", this.id);
            queryCount.where("id", "=", this.id);
        }
        if (!isUndefined(this.user_id)) {
            query.where("user_id", "=", this.user_id);
            queryCount.where("user_id", "=", this.user_id);
        }
        if (!isUndefined(this.cash_back_id)) {
            query.where("cash_back_id", "=", this.cash_back_id);
            queryCount.where("cash_back_id", "=", this.cash_back_id);
        }
        if (!isUndefined(this.currency_id)) {
            query.where("currency_id", "=", this.currency_id);
            queryCount.where("currency_id", "=", this.currency_id);
        }
        if (!isUndefined(this.periodic)) {
            query.where("periodic", "=", this.periodic);
            queryCount.where("periodic", "=", this.periodic);
        }
        if (!isUndefined(this.settlement_status_id)) {
            query.where("settlement_status_id", "=", this.settlement_status_id);
            queryCount.where("settlement_status_id", "=", this.settlement_status_id);
        }
        if (!isUndefined(this.settlement_date_from)) {
            query.where("settlement_date", ">=", new Date(this.settlement_date_from).toISOString());
            queryCount.where("settlement_date", ">=", new Date(this.settlement_date_from).toISOString());
        }
        if (!isUndefined(this.settlement_date_to)) {
            query.where("settlement_date", "<=", new Date(this.settlement_date_to).toISOString());
            queryCount.where("settlement_date", "<=", new Date(this.settlement_date_to).toISOString());
        }
        if (!isUndefined(this.ggr_percent_from)) {
            query.where("ggr_percent", ">=", this.ggr_percent_from);
            queryCount.where("ggr_percent", ">=", this.ggr_percent_from);
        }
        if (!isUndefined(this.ggr_percent_to)) {
            query.where("ggr_percent", "<=", this.ggr_percent_to);
            queryCount.where("ggr_percent", "<=", this.ggr_percent_to);
        }
        if (!isUndefined(this.amount_from)) {
            query.where("amount", ">=", this.amount_from);
            queryCount.where("amount", ">=", this.amount_from);
        }
        if (!isUndefined(this.amount_to)) {
            query.where("amount", "<=", this.amount_to);
            queryCount.where("amount", "<=", this.amount_to);
        }
        if (!isUndefined(this.amount_usd_from)) {
            query.where("amount_usd", ">=", this.amount_usd_from);
            queryCount.where("amount_usd", ">=", this.amount_usd_from);
        }
        if (!isUndefined(this.amount_usd_to)) {
            query.where("amount_usd", "<=", this.amount_usd_to);
            queryCount.where("amount_usd", "<=", this.amount_usd_to);
        }
        if (!isUndefined(this.total_stake_from)) {
            query.where("total_stake", ">=", this.total_stake_from);
            queryCount.where("total_stake", ">=", this.total_stake_from);
        }
        if (!isUndefined(this.total_stake_to)) {
            query.where("total_stake", "<=", this.total_stake_to);
            queryCount.where("total_stake", "<=", this.total_stake_to);
        }
        if (!isUndefined(this.total_stake_usd_from)) {
            query.where("total_stake_usd", ">=", this.total_stake_usd_from);
            queryCount.where("total_stake_usd", ">=", this.total_stake_usd_from);
        }
        if (!isUndefined(this.total_stake_usd_to)) {
            query.where("total_stake_usd", "<=", this.total_stake_usd_to);
            queryCount.where("total_stake_usd", "<=", this.total_stake_usd_to);
        }
        if (!isUndefined(this.total_won_amount_from)) {
            query.where("total_won_amount", ">=", this.total_won_amount_from);
            queryCount.where("total_won_amount", ">=", this.total_won_amount_from);
        }
        if (!isUndefined(this.total_won_amount_to)) {
            query.where("total_won_amount", "<=", this.total_won_amount_to);
            queryCount.where("total_won_amount", "<=", this.total_won_amount_to);
        }
        if (!isUndefined(this.total_won_amount_usd_from)) {
            query.where("total_won_amount_usd", ">=", this.total_won_amount_usd_from);
            queryCount.where("total_won_amount_usd", ">=", this.total_won_amount_usd_from);
        }
        if (!isUndefined(this.total_won_amount_usd_to)) {
            query.where("total_won_amount_usd", "<=", this.total_won_amount_usd_to);
            queryCount.where("total_won_amount_usd", "<=", this.total_won_amount_usd_to);
        }
        if (!isUndefined(this.ggr_percent_from)) {
            query.where("ggr_percent", ">=", this.ggr_percent_from);
            queryCount.where("ggr_percent", ">=", this.ggr_percent_from);
        }
        if (!isUndefined(this.ggr_percent_to)) {
            query.where("ggr_percent", "<=", this.ggr_percent_to);
            queryCount.where("ggr_percent", "<=", this.ggr_percent_to);
        }
        if (!isUndefined(this.date_from)) {
            query.where("date", ">=", new Date(this.date_from).toISOString());
            queryCount.where("date", ">=", new Date(this.date_from).toISOString());
        }
        if (!isUndefined(this.date_to)) {
            query.where("date", "<=", new Date(this.date_to).toISOString());
            queryCount.where("date", "<=", new Date(this.date_to).toISOString());
        }

        query.limit(this.limit).offset(this.page * this.limit);

        const data = await all([CashBackableUser.manyOrNone(query), CashBackableUserCount.one(queryCount)]);
        // return data
        return <IListWithPagination>{
            data: data[0],
            full_count: data[1].full_count
        };
    }
}
