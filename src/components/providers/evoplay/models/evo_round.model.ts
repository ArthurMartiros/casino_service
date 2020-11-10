import { BaseModel } from "../../../../../../CommonJS/src/base/base.model";
import { IEvoRound } from "../interfaces/evo_round.interface";
import { EvoBonus } from "../enums/evo_bonus.enum";

export class EvoRound extends BaseModel implements IEvoRound {
    public static tableName = "evo_round";
    public id: number;
    public extrabonus_type?: EvoBonus;
    public bonus_id?: number;
    constructor(data: IEvoRound) {
        super();
        this.id = data.id;
        this.extrabonus_type = data.extrabonus_type;
        this.bonus_id = data.bonus_id;
    }
}
