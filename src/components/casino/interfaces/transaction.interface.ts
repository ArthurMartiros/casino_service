import { ITransactionModel } from "../../../../../CoreService/src/components/transactions/interfaces/transaction.interface";

export interface ITransaction extends ITransactionModel {}

export interface ITransactionRequest {}

export interface ITransactionResponse {}

export interface ITransactionCreateRequest extends ITransactionRequest {
    user_id: number;
    action_id: string;
    amount: number;
    currency: string;
    details?: string;
}

export interface ITransactionCreateResponse extends ITransactionResponse {
    status: "error" | "ok";
    data?: {
        balance: number;
        currency: string;
    };
    error?: {
        scope: "user";
        no_refund: 0 | 1;
        message: string;
    };
}
