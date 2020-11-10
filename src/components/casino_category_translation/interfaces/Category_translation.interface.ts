import { IModelSaveWithLanguage } from "../../../../../CommonJS/src/base/base.interface";

export interface ICasinoCategoryTranslation extends IModelSaveWithLanguage {
    id: number;
    name: string;
    casino_category_id: number;
}

export interface ICasinoCategoryTranslationFilter extends IModelSaveWithLanguage {
    casino_category_id?: number;
}
