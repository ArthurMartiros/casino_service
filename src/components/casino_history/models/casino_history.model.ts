import { ICasinoBetPublic, ICasinoBetCount } from "../interfaces/casino_history.interface";
import { BaseModel } from "../../../../../CommonJS/src/base/base.model";
import { CasinoBetStatus } from "../../casino_bet/enums/casino_bet.enum";
import { MoneyType } from "../../../../../CoreService/src/components/transactions/enums/money_type.enum";

export class CasinoBetPublic extends BaseModel implements ICasinoBetPublic {
    public static tableName = "casino_bet";
    public id: number;
    public user_id: number;
    public money_type_id: MoneyType;
    public amount: number;
    public won_amount: number;
    public game_id: number;
    public game_name?: string; //  use join table casino_games
    public status_id: CasinoBetStatus;
    public created: Date;

    constructor(data: ICasinoBetPublic) {
        super();
        this.id = Number(data.id);
        this.user_id = Number(data.user_id);
        this.money_type_id = Number(data.money_type_id);
        this.amount = Number(data.amount);
        this.won_amount = Number(data.won_amount || 0);
        this.game_id = Number(data.game_id);
        this.game_name = String(data.game_name);
        this.status_id = Number(data.status_id);
        this.created = new Date(data.created || new Date());
    }
}

export class CasinoBetCount extends BaseModel implements ICasinoBetCount {
    public static tableName = "casino_bet";
    public full_count: number;

    constructor(data: CasinoBetCount) {
        super();
        this.full_count = Number(data.full_count);
    }
}
