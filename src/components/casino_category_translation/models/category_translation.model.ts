import { BaseModel } from "../../../../../CommonJS/src/base/base.model";
import { ICasinoCategoryTranslation } from "../interfaces/Category_translation.interface";
import { DEFAULT_LANGUAGE } from "../../../../../CommonJS/src/domain/constant";

export class CasinoCategoryTranslationModel extends BaseModel implements ICasinoCategoryTranslation {
    public static tableName = "casino_category_translation";

    public casino_category_id: number;
    public lang_id: number;
    public name: string;
    public id: number;

    constructor(data: ICasinoCategoryTranslation) {
        super();
        this.casino_category_id = data.casino_category_id;
        this.lang_id = data.lang_id || DEFAULT_LANGUAGE;
        this.id = data.id;
        this.name = data.name;
    }
}
