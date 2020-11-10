import { CasinoTransactionType } from "../enums/casino_transaction.type";

export interface ICasinoTransaction {
    id?: number;
    user_id: number;
    bet_id: number;
    bet_type_id: CasinoTransactionType;
    wallet_id: number;
    amount: number;
    balance_after: number;
    balance_before: number;
    created: Date;
}
