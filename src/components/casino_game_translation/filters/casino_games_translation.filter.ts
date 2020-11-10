import { ChannelType } from "../../../../../CommonJS/src/enums/channel_type.enum";
import { DEFAULT_LANGUAGE, DEFAULT_WEB_SITE } from "../../../../../CommonJS/src/domain/constant";
import { QueryBuilder } from "../../../../../CommonJS/src/base/base.model";
import { ICasinoGamesTranslationFilter } from "../interfaces/casino_games_translation_filter.interface";
import { CasinoGamesTranslationModel } from "../models/casino_games_translation.model";
import { ICasinoGamesTranslation } from "../interfaces/casino_games_translation.interface";

export class CasinoGamesTranslationFilter implements ICasinoGamesTranslationFilter {
    public casino_game_id: number;

    public website_id: number;
    public channel_id: ChannelType;
    public lang_id: number;

    constructor(data: ICasinoGamesTranslationFilter) {
        this.casino_game_id = data.casino_game_id;
        this.website_id = data.website_id || DEFAULT_WEB_SITE;
        this.channel_id = data.channel_id || ChannelType.BACKEND;
        this.lang_id = data.lang_id || DEFAULT_LANGUAGE;
    }

    public async findList(): Promise<ICasinoGamesTranslation[]> {
        const query = QueryBuilder(CasinoGamesTranslationModel.tableName)
            .where(`casino_game_id`, this.casino_game_id)
            .where(`website_id`, this.website_id)
            .where(`lang_id`, this.lang_id);
        return CasinoGamesTranslationModel.manyOrNone(query);
    }
}
