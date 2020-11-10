import { QueryBuilder } from "../../../../../CommonJS/src/base/base.model";
import { ICasinoCategoryTranslationFilter, ICasinoCategoryTranslation } from "../interfaces/Category_translation.interface";
import { CasinoCategoryTranslationModel } from "../models/category_translation.model";

export class CasinoCategoryTranslationFilter implements ICasinoCategoryTranslationFilter {
    public casino_category_id: number | undefined;
    public lang_id?: number;

    constructor(data: ICasinoCategoryTranslationFilter) {
        this.casino_category_id = data.casino_category_id;
        this.lang_id = data.lang_id;
    }

    public static async findList(filter: ICasinoCategoryTranslationFilter): Promise<ICasinoCategoryTranslation[]> {
        filter = new CasinoCategoryTranslationFilter(filter);
        const query = QueryBuilder(CasinoCategoryTranslationModel.tableName);
        if (filter.casino_category_id) query.where(`casino_category_id`, filter.casino_category_id);
        if (filter.lang_id) query.where(`lang_id`, filter.lang_id);
        return CasinoCategoryTranslationModel.manyOrNone(query);
    }
}
