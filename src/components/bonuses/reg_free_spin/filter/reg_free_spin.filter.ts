import { RegFreeSpinBonus } from "../models/reg_free_spin.model";
import { IRegFreeSpinBonus, IRegFreeSpinBonusFilter } from "../interfaces/reg_free_spin";
import { BaseBonusFilter } from "../../base/filter/bonus_base.filter";

export class RegFreeSpinBonusFilter extends BaseBonusFilter implements IRegFreeSpinBonusFilter {
    public static tableName = RegFreeSpinBonus.tableName;
    public casino_game_id?: number;
    public affiliate_reference?: string;
    constructor(data: IRegFreeSpinBonusFilter) {
        super(data);
        this.casino_game_id = data.casino_game_id;
        this.affiliate_reference = data.affiliate_reference;
    }

    public static find(filter: IRegFreeSpinBonusFilter): Promise<IRegFreeSpinBonus[]> {
        const query = this.getQuery(filter);
        if (filter.casino_game_id) query.where({ casino_game_id: filter.casino_game_id });
        if (filter.affiliate_reference) query.where({ affiliate_reference: filter.affiliate_reference });
        if (filter.website_id) query.where({ website_id: filter.website_id });
        return RegFreeSpinBonus.manyOrNone(query);
    }
}
