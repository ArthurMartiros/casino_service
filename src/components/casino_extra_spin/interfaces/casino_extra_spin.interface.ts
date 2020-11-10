import { CasinoExtraSpinType } from "../enums/casino_extra_spin.enum";
import { IBase } from "../../../../../CommonJS/src/base/base.interface";
import { BonusType } from "../../../../../CoreService/src/components/bonuses/base/enums/bonus_type.enum";
import { BonusStatus } from "../../../../../CoreService/src/components/bonuses/base/enums/bonus_status.enum";

export interface ICasinoExtraSpin extends IBase {
    id?: number;
    type_id: CasinoExtraSpinType;
    personal_id?: number;
    created: Date;
    user_id: number;
    bonus_type_id?: BonusType;
    bet_amount?: number;
    currency_id: number;
    spins_total: number;
    left_spins: number;
    casino_game_id: number;
    used: boolean;
    expire_date: Date;
    bet_per_line: number;
    lines: number;
    bet_id: number;
    denomination: number;
    denomination_value: number;
    wagering_turnover: number;
    days_to_expire_bonus?: number;
    days_to_expire_wallet?: number;
    status_id: BonusStatus;
    website_id: number;
    updateLeftSpin();
}

export interface ICasinoExtraSpinFilter {
    sort_by?: string;
    sort_order?: string;
    id?: number;
    date_from?: Date;
    date_to?: Date;
    type_id?: CasinoExtraSpinType;
    user_id?: number;
    bonus_type_id?: BonusType;
    bet_amount_from?: number;
    bet_amount_to?: number;
    currency_id?: number;
    personal_id?: number;
    casino_game_id?: number;
    include_won_amount?: boolean;
    include_count?: boolean;
    limit?: number;
    page?: number;
    website_id?: number;
}

export interface ICasinoExtraSpinPublic {
    id: number;
    type_id: CasinoExtraSpinType;
    personal_id?: number;
    created: Date;
    user_id: number;
    bonus_type_id?: BonusType;
    bet_amount: number;
    currency_code: string;
    spins_total: number;
    left_spins: number;
    casino_game_name: string;
    wagering_turnover: number;
    won_amount: number;
    expire_date: Date;
    status_id: BonusStatus;
}
