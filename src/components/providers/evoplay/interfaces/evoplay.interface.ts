import { MethodGroupNames } from "../enums/common.enum";
import { MethodNames } from "../enums/game.enum";
import { CallbackType as EvoCallbackType } from "../enums/callback.enum";
import { Version } from "../../../website_casino/enums/website_casino.enum";
import { IUser } from "../../../../../../CoreService/src/components/users/interfaces/user.interface";

export interface IEvoRequest {
    user_id?: number;
    user?: IUser;
    casino_game_id?: number;
    currency_code?: string;
    website_id?: number;
    lang_id?: number;
    api_project: number;
    api_key: string;
    api_version: Version;
    api_host: number;
}
export interface IEvoResponse {
    status: "ok" | "error";
    // tslint:disable-next-line:no-any
    data?: any;
    error?: {
        code: number;
        scope: "user" | "internal";
        message: string;
        // tslint:disable-next-line:no-any
        info: any[];
    };
}

export interface IEvoplayApiRequestType {
    method: MethodGroupNames;
    action: MethodNames;
}

export interface IEvoApiResponse {
    data: IEvoResponse;
}

export interface IEvoCallbackRequest {
    type: EvoCallbackType;
    data: IEvoRequest;
}

export interface IEvoInitRequest {
    token: string;
}

export interface IEvoCallbackResponse {
    data: IEvoResponse;
}
export interface IApiRequest extends IEvoRequest {
    type: IEvoplayApiRequestType;
    token?: string;
    data?;
    name?: string;
}
