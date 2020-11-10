import { ICashBack } from './cash_back.interface';
import {CashBackStatusID, SettlementStatusID} from "../enums/cash_back_status.enum";

export interface ICashBack {
    id: number;
    ggr_limit: number;
    min_ggr: number;
    start_date: Date;
    end_date: Date;
    settlement_date: Date;
    status_id: CashBackStatusID;
    ggr_percent: number;     
    casino_game_ids: Array<number>;
    casino_provider_ids: Array<number>;
    parent_id?: number;
    sub_cash_backs?: ICashBack[];
    recurring: boolean;
    period: number;
}

export interface ICashBackFilter {
    id?: number;
    status_id?: CashBackStatusID;
    start_date_from?: Date;
    start_date_to?: Date;
    end_date_from?: Date;
    end_date_to?: Date;
    recurring?: boolean;
    settlement_date_from?: Date;
    settlement_date_to?: Date;
    ggr_percent_from?: number;     
    ggr_percent_to?: number;     
    casino_game_ids?: string;
    casino_provider_ids?: string;
    page: number;
    limit: number;
}

export interface IGGRPreface {
    user_id: number;
    stake: number;
    won_amount: number;
}

export interface ICashBackableUser {
    id?: number;
    user_id: number;
    cash_back_id: number;
    periodic: boolean;
    amount: number;
    amount_usd: number;
    total_stake: number;
    total_stake_usd: number;
    total_won_amount: number;
    total_won_amount_usd: number;
    settlement_date: Date;
    ggr_percent: number;
    settlement_status_id: SettlementStatusID; 
    currency_id: number;
    date?: Date;
}

export interface ICashBackableUserFilter {
    id?: number;
    user_id: number;
    cash_back_id: number;
    periodic: boolean;
    amount_from: number;
    amount_to: number;
    amount_usd_from: number;
    amount_usd_to: number;
    total_stake_from: number;
    total_stake_to: number;
    total_stake_usd_from: number;
    total_stake_usd_to: number;
    total_won_amount_from: number;
    total_won_amount_to: number;
    total_won_amount_usd_from: number;
    total_won_amount_usd_to: number;
    settlement_date_from: Date;
    settlement_date_to: Date;
    ggr_percent_from: number;
    ggr_percent_to: number;
    settlement_status_id: SettlementStatusID; 
    currency_id: number;
    date_from?: Date;
    date_to?: Date;
    page: number;
    limit: number;
}
export interface ICashBackableUserParameterData {
    id: number;
    settlement_status_id: SettlementStatusID;
}