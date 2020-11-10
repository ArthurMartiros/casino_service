import { BaseModel } from "../../../../../CommonJS/src/base/base.model";
import { ICasinoTranslation } from "../interfaces/casino_translation.interface";
import { toNumber } from "lodash";
import { DEFAULT_LANGUAGE, DEFAULT_WEB_SITE } from "../../../../../CommonJS/src/domain/constant";
import { ChannelType } from "../../../../../CommonJS/src/enums/channel_type.enum";

export class CasinoTranslationModel extends BaseModel implements ICasinoTranslation {
    public static tableName = `casino_translation`;

    public casino_id: number;
    public website_id: number;
    public channel_id: ChannelType;
    public lang_id: number;
    public name: string;
    public alt_name?: string;
    public description?: string;

    constructor(data: ICasinoTranslation) {
        super();
        this.casino_id = toNumber(data.casino_id);
        this.website_id = toNumber(data.website_id) || DEFAULT_WEB_SITE;
        this.channel_id = toNumber(data.channel_id) || ChannelType.BACKEND;
        this.lang_id = toNumber(data.lang_id) || DEFAULT_LANGUAGE;

        this.name = data.name;
        this.alt_name = data.alt_name;
        this.description = data.description;
    }
}
