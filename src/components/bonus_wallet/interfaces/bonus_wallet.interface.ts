import { BonusType } from "../../../../../CoreService/src/components/bonuses/base/enums/bonus_type.enum";
import { BonusStatus } from "../../../../../CoreService/src/components/bonuses/base/enums/bonus_status.enum";

export interface IBonusWallet {
    id?: number;
    user_id: number;
    initial_balance: number;
    balance: number;
    bonus_id: number;
    bonus_type_id: BonusType;
    status_id: BonusStatus;
    wagering_turnover: number;
    expire_date?: Date;
    created: Date;
    days_to_expire: number;
}

export interface IBonusWalletPublic {
    initial_balance: number;
    balance: number;
    wager: number;
    stake_left_to_convert: number;
    stake_to_convert: number;
    expire_date?: Date;
    bonus_type_id: BonusType;
    given_date: Date;
}

export interface IBonusWalletFilter {
    user_id: number;
    limit: number;
    page: number;
}

export interface IListWithPagination {
    full_count: number;
    // tslint:disable-next-line:no-any
    data: any;
    // tslint:disable-next-line:no-any
}