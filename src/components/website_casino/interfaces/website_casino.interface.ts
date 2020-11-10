import { IBase } from "../../../../../CommonJS/src/base/base.interface";
import { Status, Version, Host } from "../enums/website_casino.enum";
import { CasinoID } from "../../casino/enums/casino.enum";

export interface IWebsiteCasinoModel extends IBase {
    id?: number;
    casino_id: CasinoID;
    status_id: Status;
    test?: boolean;
    website_id: number;
    api_project?: number;
    api_id?: string;
    api_key?: string;
    api_version?: Version;
    api_host?: Host;
    api_url?: string;
    api_second_url?: string;
    sandbox_url?: string;
}

export interface IWebsiteCasinoFilter {
    id?: number;
    casino_id?: number;
    status_id?: Status;
    test?: boolean;
    website_id?: number;
    unlimited?: boolean;
    page?: number;
    limit?: number;
}
