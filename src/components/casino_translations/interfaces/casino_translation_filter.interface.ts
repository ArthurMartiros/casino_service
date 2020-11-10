import { IModelSaveWithLanguage, ISaveModelWithChannelType } from "../../../../../CommonJS/src/base/base.interface";

export interface ICasinoTranslationFilter extends IModelSaveWithLanguage, ISaveModelWithChannelType {
    casino_id: number;
}
