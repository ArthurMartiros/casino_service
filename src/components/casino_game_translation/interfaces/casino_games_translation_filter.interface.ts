import { IModelSaveWithLanguage, ISaveModelWithChannelType } from "../../../../../CommonJS/src/base/base.interface";

export interface ICasinoGamesTranslationFilter extends IModelSaveWithLanguage, ISaveModelWithChannelType {
    casino_game_id: number;
}
