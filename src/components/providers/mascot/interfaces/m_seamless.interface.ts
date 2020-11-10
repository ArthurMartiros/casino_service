import { BetType } from "../enums/betType.enum";
import { WinType } from "../enums/winType.enum";
import { OperationType } from "../enums/operationType.enum";

export interface IMSeamlessBalanceGetRequest {
    CasinoId: number;
    PlayerId: string;
    Context?: IGetContext;
}

export interface IMSeamlessBalanceGetResponse {
    Amount: number;
}

export interface IMSeamlessBalanceChangeRequest {
    OPID?: string;
    CasinoId: number
    PlayerId: string;
    Context?: IChangeContext;
    Operations: IOperation[];
}

export interface IMSeamlessBalanceChangeResponse {
    BalanceBefore?: number;
    BalanceAfter: number;
}

interface IGetContext {
    GameId?: string;
    SessionId?: string;
}

interface IChangeContext {
    GameId?: string;
    SessionId?: string;
    BetType?: BetType;
    WinType?: WinType;
    EventId?: number;
}

interface IOperation {
    Id?: string;
    Type: OperationType;
    Amount: number;
    Reason?: string;
    EventId: number;
}