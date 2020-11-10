import { CasinoID } from "../../casino/enums/casino.enum";

export interface ICasinoProviderTranslation {
    provider_id: CasinoID;
    lang_id: number;
    name: string;
}
