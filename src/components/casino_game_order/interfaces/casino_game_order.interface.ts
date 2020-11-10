import { ISaveModelWithChannelType } from "../../../../../CommonJS/src/base/base.interface";
import { CasinoGameWeight } from "../enums/casino_weight.enum";

export interface ICasinoGameOrder extends ISaveModelWithChannelType {
    casino_game_id: number;
    position_x: number;
    position_y: number;
    weight: CasinoGameWeight;
    page: number;
}
