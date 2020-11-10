import { CasinoBetStatus } from "../../casino_bet/enums/casino_bet.enum";
import { IBase } from "../../../../../CommonJS/src/base/base.interface";
import { MoneyType } from "../../../../../CoreService/src/components/transactions/enums/money_type.enum";

export interface ICasinoBetPublic extends IBase {
    id: number;
    user_id: number;
    money_type_id: MoneyType;
    amount: number;
    won_amount: number;
    game_id: number;
    game_name?: string;
    status_id: CasinoBetStatus;
    created?: Date;
}

export interface ICasinoBetPublicFilter {
    place_date_from: Date;
    place_date_to: Date;
    user_id: number;
    page: number;
    limit: number;
    website_id: number;
    lang_id: number;
}

export interface ICasinoBetCount {
    full_count: number;
}
