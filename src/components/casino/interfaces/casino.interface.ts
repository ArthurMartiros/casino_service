import { IModelSaveWithLanguage, ISaveModelWithChannelType } from "../../../../../CommonJS/src/base/base.interface";
import { CasinoID } from "../enums/casino.enum";

export interface ICasinoList {
    id?: number;
    name: string;
}

export interface ICasinoFilter extends ISaveModelWithChannelType, IModelSaveWithLanguage {
    ids?: number[];
    names?: string[];
    providers?: CasinoID[];
    logo_urls?: string[];
}
export interface IGameLimitRequest {
    casino_game_id: number;
    currency_code: string;
    user_id: number;
    website_id: number;
}

export interface ICasinoProvider {
    startGame(...args): Promise<IStartGame>;
    refreshGames(...args): Promise<void>;
    getLimits(...args): Promise<IGameLimit | undefined>;
    callback(...args);
    registerBonusSpin(...args);
}

export interface IGameLimit {
    denominations: { [key: number]: number[] };
    bets: {
        bet_id: number;
        bet_per_line: number;
        lines: number;
    }[];
}

export interface IStartGame {
    url: string;
}
