import { BaseModel } from "../../../../../CommonJS/src/base/base.model";
import { ICasinoGamesTranslation } from "../interfaces/casino_games_translation.interface";
import { ChannelType } from "../../../../../CommonJS/src/enums/channel_type.enum";
import { DEFAULT_LANGUAGE, DEFAULT_WEB_SITE } from "../../../../../CommonJS/src/domain/constant";

export class CasinoGamesTranslationModel extends BaseModel implements ICasinoGamesTranslation {
    public static tableName = "casino_games_translation";

    public website_id: number;
    public channel_id: ChannelType;
    public lang_id: number;
    public casino_game_id: number;
    public name?: string;
    public alt_name?: string;
    public description?: string;

    constructor(data: ICasinoGamesTranslation) {
        super();

        this.website_id = data.website_id || DEFAULT_WEB_SITE;
        this.channel_id = data.channel_id || ChannelType.BACKEND;
        this.lang_id = data.lang_id || DEFAULT_LANGUAGE;
        this.casino_game_id = data.casino_game_id;

        this.name = data.name;
        this.alt_name = data.alt_name;
        this.description = data.description;
    }
}
