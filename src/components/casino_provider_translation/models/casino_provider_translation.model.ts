import { ICasinoProviderTranslation } from "../interfaces/casino_provider_translation.interface";
import { CasinoID } from "../../casino/enums/casino.enum";
import { BaseModel } from "../../../../../CommonJS/src/base/base.model";

export class CasinoProviderTranslation extends BaseModel implements ICasinoProviderTranslation {
    static tableName = "casino_provider_translation";
    provider_id: CasinoID;
    lang_id: number;
    name: string;

    constructor(data: ICasinoProviderTranslation) {
        super();
        this.provider_id = data.provider_id;
        this.lang_id = data.lang_id;
        this.name = data.name;
    }
}
