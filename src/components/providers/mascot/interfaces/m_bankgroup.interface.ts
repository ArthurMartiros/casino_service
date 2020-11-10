import { Currencies } from "../enums/currencies.enum";

export interface IMBankGroupSetRequest {
    Id: string;
    Currency: Currencies | string;
    SettingsPatch?: string;
}