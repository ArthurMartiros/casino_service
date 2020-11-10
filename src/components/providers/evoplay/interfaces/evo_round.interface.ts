import { EvoBonus } from "../enums/evo_bonus.enum";

export interface IEvoRound {
    id: number;
    extrabonus_type?: EvoBonus;
    bonus_id?: number;
}
