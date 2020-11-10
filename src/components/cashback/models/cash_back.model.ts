import { BaseModel } from "../../../../../CommonJS/src/base/base.model";
import { ICashBack, IGGRPreface, ICashBackableUser, ICashBackableUserParameterData } from "../interfaces/cash_back.interface";
import { CashBackStatusID, SettlementStatusID } from "../enums/cash_back_status.enum";

export class CashBackModel extends BaseModel implements ICashBack {
    public static tableName = "cash_back";
    public id: number;
    public ggr_limit: number;
    public min_ggr: number;
    public start_date: Date;
    public end_date: Date;
    public settlement_date: Date;
    public status_id: CashBackStatusID;
    public ggr_percent: number;
    public casino_game_ids: Array<number>;
    public casino_provider_ids: Array<number>;
    public parent_id?: number;
    public sub_cash_backs?: ICashBack[];
    public recurring: boolean;
    public period: number;

    constructor(data: ICashBack) {
        super();
        if(data) {
            this.id = data.id;
            this.min_ggr = data.min_ggr;
            this.ggr_limit = data.ggr_limit;
            this.start_date = data.start_date;
            this.end_date = data.end_date;
            this.settlement_date = data.settlement_date;
            this.status_id = data.status_id;
            this.ggr_percent = data.ggr_percent;
            this.casino_game_ids = data.casino_game_ids;
            this.casino_provider_ids = data.casino_provider_ids;
            this.parent_id = data.parent_id;
            this.recurring = data.recurring;
            this.period = data.period;
        }
       
    }
}
export class GGRPreface extends BaseModel {
    public user_id: number;
    public stake: number;
    public won_amount: number;

    constructor(data: IGGRPreface) {
        super();
        this.user_id = data.user_id;
        this.stake = data.stake;
        this.won_amount = data.won_amount;
    }
}

export class CashBackableUser extends BaseModel implements ICashBackableUser {
    public static tableName = "cash_backable_users";
    public id?: number;
    public user_id: number;
    public cash_back_id: number;
    public periodic: boolean;
    public amount: number;
    public amount_usd: number;
    public total_stake: number;
    public total_stake_usd: number;
    public total_won_amount: number;
    public total_won_amount_usd: number;
    public settlement_date: Date;
    public ggr_percent: number;
    public settlement_status_id: SettlementStatusID;
    public date?: Date;
    public currency_id: number;

    constructor(data: ICashBackableUser) {
        super();
        this.id = data.id;
        this.user_id = data.user_id;
        this.cash_back_id = data.cash_back_id;
        this.periodic = data.periodic;
        this.amount = data.amount;
        this.amount_usd = data.amount_usd;
        this.total_stake = data.total_stake;
        this.total_stake_usd = data.total_stake_usd;
        this.total_won_amount = data.total_won_amount;
        this.total_won_amount_usd = data.total_won_amount_usd;
        this.settlement_date = data.settlement_date;
        this.ggr_percent = data.ggr_percent;
        this.settlement_status_id = data.settlement_status_id;
        this.date = data.date;
        this.currency_id = data.currency_id;
    }

    public static async Update(data: ICashBackableUserParameterData): Promise<CashBackableUser | undefined> {
        return CashBackableUser.update({ id: data.id, settlement_status_id: data.settlement_status_id });
    }
}

export class CashBackCount extends BaseModel {
    public static tableName = "cash_back";
    public full_count: number;

    constructor(data: CashBackCount) {
        super();
        this.full_count = Number(data.full_count);
    }
}

export class CashBackableUserCount extends BaseModel {
    public static tableName = "cash_backable_users";
    public full_count: number;

    constructor(data: CashBackCount) {
        super();
        this.full_count = Number(data.full_count);
    }
}
