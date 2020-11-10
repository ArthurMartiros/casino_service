import { IUserFinancialModel, IUserFinancialSupportQuery } from "../interfaces/user.financial.interface";
import { BaseModel } from "../../../../../CommonJS/src/base/base.model";

export class UserFinancialModel extends BaseModel implements IUserFinancialModel {
    public profitability: number;
    public profitability_grade: number;
    public open_bets_amount: number;
    public open_bets_sum: number;
    public payout: number;
    public stake_amount: number;
    public stake_count: number;

    constructor(params: IUserFinancialModel) {
        super();
        this.profitability = params.profitability;
        this.profitability_grade = params.profitability_grade;
        this.open_bets_amount = params.open_bets_amount;
        this.open_bets_sum = params.open_bets_sum;
        this.payout = params.payout;
        this.stake_amount = params.stake_amount;
        this.stake_count = params.stake_count;
    }
}

export class UserFinancialSupportQuery extends BaseModel implements IUserFinancialSupportQuery {
    public stake: number;
    public status_id: number;

    constructor(params: IUserFinancialSupportQuery) {
        super();
        this.stake = params.stake;
        this.status_id = params.status_id;
    }
}
