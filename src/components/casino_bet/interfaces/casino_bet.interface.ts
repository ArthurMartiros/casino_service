import { IBase } from "../../../../../CommonJS/src/base/base.interface";
import { ChannelType } from "../../../../../CommonJS/src/enums/channel_type.enum";
import { CasinoBetStatus, CasinoBetType } from "../enums/casino_bet.enum";
import { MoneyType } from "../../../../../CoreService/src/components/transactions/enums/money_type.enum";

export interface ICasinoBet extends IBase {
    id?: number;
    user_id: number;
    bet_type_id: CasinoBetType;
    money_type_id: MoneyType;
    stake: number;
    stake_usd: number;
    balance_after: number;
    balance_after_usd: number;
    balance_after_result: number;
    balance_after_result_usd: number;
    balance_before: number;
    balance_before_usd: number;
    won_amount: number;
    won_amount_usd: number;
    channel_id: ChannelType;
    website_id: number;
    currency_id: number;
    casino_game_id: number;
    provider_id: number;
    ip: string;
    ip_country: string;
    status_id: CasinoBetStatus;
    external_action_id: string;
    created?: Date;
    updated?: Date;
    bet_number: number;
    bonus_stake: number;
    bonus_won_amount: number;
    real_stake: number;
    real_stake_usd: number;
    real_won_amount: number;
    real_won_amount_usd: number;
    session_id: number;
    date: Date;
    hash: string;
    bonus_id: number;
    assignBetNumber();
}

export interface ICasinoBetFilter {}
