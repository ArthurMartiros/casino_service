import { IModelSaveWithLanguage, ISaveModelWithChannelType } from "../../../../../CommonJS/src/base/base.interface";

export interface ICasinoGamesTranslation extends ISaveModelWithChannelType, IModelSaveWithLanguage {
    casino_game_id: number;
    name?: string;
    alt_name?: string;
    description?: string;
}
