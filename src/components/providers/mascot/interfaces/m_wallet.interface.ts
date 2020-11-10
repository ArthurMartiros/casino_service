export interface IMBalanceGetRequest {
    PlayerId: string;
}

export interface IMBalanceGetResponse {
    Amount: number;
}

export interface IMBalanceChangeRequest {
    PlayerId: string;
    Amount: number;
}

export interface IMBalanceChangeResponse {
    BalanceBefore: number;
    BalanceAfter: number;
}