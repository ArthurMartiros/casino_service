import { BaseModel } from "../../../../../CommonJS/src/base/base.model";
import { IWebsiteCasinoModel } from "../interfaces/website_casino.interface";
import { Version, Host } from "../enums/website_casino.enum";
import { isBoolean } from "lodash";

export class WebsiteCasinoModel extends BaseModel implements IWebsiteCasinoModel {
    public static tableName: string = "website_casino";
    public id?: number;
    public casino_id: number;
    public status_id: number;
    public test?: boolean;
    public website_id: number;
    public api_project?: number;
    public api_id?: string;
    public api_key?: string;
    public api_version?: Version;
    public api_host?: Host;
    public api_url?: string;
    public api_second_url?: string;
    public sandbox_url?: string;

    constructor(data: IWebsiteCasinoModel) {
        super();
        this.id = data.id;
        this.casino_id = data.casino_id;
        this.status_id = data.status_id;
        this.website_id = data.website_id;
        this.test = isBoolean(data.test) ? data.test : true;

        this.api_project = data.api_project;
        this.api_key = data.api_key;
        this.api_id = data.api_id;
        this.api_version = data.api_version;
        this.api_host = data.api_host;
        this.api_url = data.api_url;
        this.api_second_url = data.api_second_url;
        this.sandbox_url = data.sandbox_url;
    }
}
