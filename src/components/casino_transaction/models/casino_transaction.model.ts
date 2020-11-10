import { BaseModel } from "../../../../../CommonJS/src/base/base.model";
import { ICasinoTransaction } from "../interfaces/casino_transaction.interface";
import { round } from "lodash";
import { CasinoTransactionType } from "../enums/casino_transaction.type";

export class CasinoTransaction extends BaseModel implements ICasinoTransaction {
    public static tableName = "casino_transaction";
    public id?: number;
    public user_id: number;
    public bet_id: number;
    public bet_type_id: CasinoTransactionType;
    public wallet_id: number;
    public amount: number;
    public balance_after: number;
    public balance_before: number;
    public created: Date;

    constructor(data: ICasinoTransaction) {
        super();
        this.id = data.id;
        this.user_id = data.user_id;
        this.bet_id = data.bet_id;
        this.bet_type_id = data.bet_type_id;
        this.wallet_id = data.wallet_id;
        this.amount = round(data.amount, 2) || 0;
        this.balance_after = round(data.balance_after, 2);
        this.balance_before = round(data.balance_before, 2);
        this.created = data.created;
    }
}
