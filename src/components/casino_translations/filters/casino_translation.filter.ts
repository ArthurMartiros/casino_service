import { DEFAULT_LANGUAGE, DEFAULT_WEB_SITE } from "../../../../../CommonJS/src/domain/constant";
import { ChannelType } from "../../../../../CommonJS/src/enums/channel_type.enum";
import { QueryBuilder } from "../../../../../CommonJS/src/base/base.model";
import { ICasinoTranslation } from "../interfaces/casino_translation.interface";
import { CasinoTranslationModel } from "../models/casino_translation.model";
import { ICasinoTranslationFilter } from "../interfaces/casino_translation_filter.interface";

export class CasinoTranslationFilter implements ICasinoTranslationFilter {
    public casino_id: number;

    public website_id: number;
    public channel_id: ChannelType;
    public lang_id: number;

    constructor(data: ICasinoTranslationFilter) {
        this.casino_id = data.casino_id;
        this.website_id = data.website_id || DEFAULT_WEB_SITE;
        this.channel_id = data.channel_id || ChannelType.BACKEND;
        this.lang_id = data.lang_id || DEFAULT_LANGUAGE;
    }

    public async findList(): Promise<ICasinoTranslation[]> {
        const query = QueryBuilder(CasinoTranslationModel.tableName)
            .where(`casino_id`, this.casino_id)
            .where(`website_id`, this.website_id)
            .where(`lang_id`, this.lang_id);
        return CasinoTranslationModel.manyOrNone(query);
    }
}
