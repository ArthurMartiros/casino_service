import { IModelSaveWithLanguage, ISaveModelWithChannelType } from "../../../../../CommonJS/src/base/base.interface";
import { CasinoGameWeight } from "../../casino_game_order/enums/casino_weight.enum";
import { CasinoGameStatus } from "../enums/casino_game_status.enum";
import { GameTechnology } from "../enums/game_technology.enum";
import { CasinoID } from "../../casino/enums/casino.enum";
import { GameSort } from "../enums/casino_game_sort.enum";

export interface ICasinoGameModel {
    id?: number;
    game_id: string;
    provider_id: CasinoID;
    technology_id: GameTechnology;
    category?: number;
    name: string;
    thumb_url?: string;
    image_lg_url?: string;
    image_sm_url?: string;
    image_md_url?: string;
    data?;
    play_count?: number;
    status_id: CasinoGameStatus;
    free_spins_count?: number[];
    free_spins?: boolean;
    bonus_spins?: boolean;
    has_lobby?: boolean;
    is_mobile?: boolean;
    game_tags?: string[];

}

export interface ICasinoGamePublicModel {
    id: number;
    game_id: number;
    category: number;
    name: string;
    weight: CasinoGameWeight;
    position_x: number;
    position_y: number;
    image_lg_url?: string;
    image_md_url?: string;
    image_sm_url?: string;
    thumb_url?: string;
    play_count?: number;
    game_tags?: string[];
}

export interface ICasinoGameFilter extends ISaveModelWithChannelType, IModelSaveWithLanguage {
    id?: number;
    ids?: number[];
    game_ids?: number[];
    categories?: number[];
    category?: number;
    name?: string;
    absolute_games?: string[];
    unlimit?: boolean;
    page?: number;
    limit?: number;
    status_id?: CasinoGameStatus;
    is_admin: boolean;
    provider_id?: number;
    sort_by?: GameSort;
}
