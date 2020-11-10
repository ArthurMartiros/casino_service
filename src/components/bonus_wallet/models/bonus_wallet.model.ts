import { BaseModel } from "../../../../../CommonJS/src/base/base.model";
import { IBonusWallet } from "../interfaces/bonus_wallet.interface";
import { BonusType } from "../../../../../CoreService/src/components/bonuses/base/enums/bonus_type.enum";
import { round } from "lodash";
import { BonusStatus } from "../../../../../CoreService/src/components/bonuses/base/enums/bonus_status.enum";
import { isNil } from "lodash";

export class BonusWallet extends BaseModel implements IBonusWallet {
    public static tableName = "bonus_wallet";
    public id?: number;
    public user_id: number;
    public initial_balance: number;
    public balance: number;
    public bonus_id: number;
    public bonus_type_id: BonusType;
    public status_id: BonusStatus;
    public wagering_turnover: number;
    public expire_date?: Date;
    public created: Date;
    public days_to_expire: number;

    constructor(data: IBonusWallet) {
        super();
        this.id = data.id;
        this.user_id = data.user_id;
        this.initial_balance = round(data.initial_balance, 2) || 0;
        this.balance = round(data.balance, 2) || 0;
        this.bonus_id = data.bonus_id;
        this.bonus_type_id = data.bonus_type_id;
        this.status_id = data.status_id;
        this.wagering_turnover = data.wagering_turnover;
        if (!isNil(data.expire_date)) this.expire_date = new Date(data.expire_date);
        this.created = new Date(data.created);
        this.days_to_expire = data.days_to_expire || 0;
    }
}
