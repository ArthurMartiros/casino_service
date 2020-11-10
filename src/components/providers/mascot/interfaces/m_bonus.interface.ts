import { BonusCounterType } from "../enums/bonusCounterType.enum";
import { BonusAccountType } from "../enums/bonusAccountType.enum";
import { BonusOperationType } from "../enums/bonusOperationType.enum";

export interface IMBonusSetRequest {
    Id: string;
    FsType: string;
    CounterType: BonusCounterType;
    SharedParams?: ISharedParams;
    SeparateParams?: ISeparateParams;
}

export interface IMPlayerBonusListRequest {
    PlayerId: string;
}

export interface IMPlayerBonusGetRequest {
    PlayerId: string;
    BonusId: string;
}

export interface IMPlayerBonusGetResponse {
    Shared: ISharedObject;
    Separate: ISeparateObject;
}

export interface IMPlayerBonusActivateRequest {
    PlayerId: string;
    BonusId: string;
}

export interface IMPlayerBonusDeactivateRequest {
    PlayerId: string;
    BonusId: string;
}

export interface IMPlayerBonusExecuteRequest {
    PlayerId: string;
    BonusId: string;
    Operations: IOperation[];
}

export interface IMPlayerBonusExecuteResponse {
    Results: IOperationResult[];
}

interface IOperation {
    Id?: string;
    Type: BonusOperationType;
    BonusAccount: IBonusAccount;
    Transfer?: ITransfer;
    Change?: IChange;
    Set?: ISet
}

interface IBonusAccount {
    Type: BonusAccountType;
    GameId?: string;
}

interface ITransfer {
    Amount?: number;
    All?: boolean;
}

interface IChange {
    FsCount?: number;
    Balance?: number;
}

interface ISet {
    FsCount?: number;
    Balance?: number;
}

interface ISharedParams {
    FsCount: number;
}

interface ISeparateParams {
    Games: object;
}

interface ISharedObject {
    FsCount: number;
    Balance: number;
}

interface ISeparateObject {
    Games: ISharedObject
}

interface IOperationResult {
    Id: string[];
    BonusAccount: IBonusAccount;
    BalanceChange?: number;
    BalanceAfter?: number;
    FsCountChange?: number;
    FsCountAfter?: number;
}