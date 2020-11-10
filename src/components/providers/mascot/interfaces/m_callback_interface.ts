import { BetType } from "../enums/betType.enum";
import { WinType } from "../enums/winType.enum";
import { OperationType } from "../enums/operationType.enum";

export interface IMCallbackBase<T> {
    method: string;
    params: T;
    id: number;
}

export interface IMBalanceGetData {
    CasinoId: number;
    PlayerId: string;
    Context?: IGetContext;
}

interface IGetContext {
    GameId?: string;
    SessionId?: string;
    SessionAlternativeId?: string;
}

export interface IMBalanceChangeData {
    OPID: string;
    CasinoId: number;
    PlayerId: string;
    Context: IChangeContext;
    Operations: IOperation[];
}

export interface IMBonusWinData {
    OPID: string;
    CasinoId: number;
    PlayerId: string;
    Operations: IOperation[];
}

export interface IChangeContext {
    GameId: string;
    SessionId: string;
    SessionAlternativeId: string;
    BetType: BetType;
    WinType: WinType;
    EventId: number;
}

export interface IOperation {
    Id?: string;
    Type: OperationType;
    Amount: number;
    Reason?: string;
    EventId?: number;
}

export interface IMBalanceChangeResponse {
    BalanceBefore: number;
    BalanceAfter: number;
}

export interface IMBalanceGetResponse {
    Amount: number;
}