import { IModelSaveWithLanguage, ISaveModelWithChannelType } from "../../../../../CommonJS/src/base/base.interface";

export interface ICasinoTranslation extends ISaveModelWithChannelType, IModelSaveWithLanguage {
    casino_id: number;
    name: string;
    alt_name?: string;
    description?: string;
}
