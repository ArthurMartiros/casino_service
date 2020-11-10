import { IBonus, IBaseBonusFilter } from "../../base/interfaces/bonus.interface";
import { CasinoExtraSpinType } from "../../../casino_extra_spin/enums/casino_extra_spin.enum";

export interface IRegFreeSpinBonus extends IBonus {
    casino_game_id: number;
    spins_total: number;
    type_id: CasinoExtraSpinType;
    affiliate_reference?: string;
    bet_per_line: number;
    lines: number;
    bet_id: number;
    denomination: number;
    denomination_value: number;
    wagering_turnover: number;
}

export interface IRegFreeSpinBonusFilter extends IBaseBonusFilter {
    casino_game_id?: number;
    affiliate_reference?: string;
    website_id?: number;
}
