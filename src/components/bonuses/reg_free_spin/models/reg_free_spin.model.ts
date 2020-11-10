import { IRegFreeSpinBonus } from "../interfaces/reg_free_spin";
import { BaseBonus } from "../../base/models/bonus_base.model";
import { CasinoExtraSpinType } from "../../../casino_extra_spin/enums/casino_extra_spin.enum";
import { IUser } from "../../../../../../CoreService/src/components/users/interfaces/user.interface";

export class RegFreeSpinBonus extends BaseBonus implements IRegFreeSpinBonus {
    public static tableName: string = "reg_free_spin_bonus";
    public casino_game_id: number;
    public spins_total: number;
    public type_id: CasinoExtraSpinType;
    public affiliate_reference?: string;
    public bet_per_line: number;
    public lines: number;
    public bet_id: number;
    public denomination: number;
    public denomination_value: number;
    public wagering_turnover: number;

    constructor(data: IRegFreeSpinBonus, source?: IUser) {
        super(data, source);
        this.casino_game_id = data.casino_game_id;
        this.spins_total = data.spins_total;
        this.type_id = data.type_id;
        this.affiliate_reference = data.affiliate_reference;
        this.bet_per_line = data.bet_per_line;
        this.lines = data.lines;
        this.bet_id = data.bet_id;
        this.denomination = data.denomination;
        this.denomination_value = data.denomination_value;
        this.wagering_turnover = data.wagering_turnover;
    }
}
