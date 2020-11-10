import { BaseModel } from "../../../../../CommonJS/src/base/base.model";
import { ICasinoWinner } from '../interfaces/casino_winner.interface';

export class CasinoWinner extends BaseModel implements ICasinoWinner {
    public static tableName: string = "casino_winner";

    public casino_game_id: number;
    public currency_id: number;
    public user_name: string;
    public currency_code: string;
    public won_amount: number;
    public name: string;
    public thumb_url: string;

    constructor(data: CasinoWinner) {
        super();
        this.casino_game_id = data.casino_game_id;
        this.currency_id = data.currency_id;
        this.user_name = data.user_name;
        this.currency_code = data.currency_code;
        this.won_amount = data.won_amount;
        this.name = data.name;
        this.thumb_url = data.thumb_url;
    }
}

