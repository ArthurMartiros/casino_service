import { ISaveModelWithChannelType } from "../../../../../CommonJS/src/base/base.interface";

export interface ICasinoGameOrderFilter extends ISaveModelWithChannelType {
    casino_game_id?: number;
    page?: number;
}
