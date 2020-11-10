import { Currency } from "../enums/common.enum";
import { IApiRequest, IEvoResponse } from "./evoplay.interface";

export interface IInitResponse extends IEvoResponse {
    // tslint:disable-next-line:no-any
    data: any;
}

export interface IBetRequest extends IApiRequest {
    round_id: number;
    amount: number;
    currency: Currency;
    balance: number;
    // json data
    details?: string;
}

export interface IWinRequest extends IApiRequest {
    round_id: number;
    amount: number;
    currency: Currency;
    // json data
    details?: string;
}

export interface IRefundRequest extends IApiRequest {
    refund_callback_id: number;
    refund_action_id: number;
    amount: number;
    currency: Currency;
    // json data
    details?: string;
}
