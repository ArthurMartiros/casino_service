import { SessionRestorePolicy } from "../enums/sessionRestorePolicy.enum";
import { SessionLanguage } from "../enums/sessionLanguage.enum";
import { SessionListStatus } from "../enums/sessionListStatus.enum";
export interface IMSessionCreateRequest {
    PlayerId: string;
    GameId: string;
    RestorePolicy?: SessionRestorePolicy;
    StaticHost?: string;
    Params?: IMSessionCreateRequestParams;
    BonusId?: string;
    AlternativeId?: string;
}

export interface IMSessionCreateDemoRequest {
    GameId: string;
    BankGroupId: string;
    StartBalance?: number;
    StaticHost?: string;
    AlternativeId?: string;
}

export interface IMSessionCreateResponse {
    SessionId: string;
    SessionUrl: string;
}

export interface IMSessionCloseRequest {
    SessionId: string;
}

export interface IMSessionGetRequest {
    SessionId: string;
}

export interface IMSessionGetResponse {
    SessionId: string;
    AlternativeId: string;
    PlayerId: string;
    GameId: string;
    BankGroupId: string;
    CreateTime: Date;
    CloseTime: Date;
    Status: string
}

export interface IMSessionListRequest {
    CreateTimeFrom: Date;
    CreateTimeTo: Date;
    CloseTimeFrom: Date;
    CloseTimeTo: Date;
    Status: SessionListStatus;
    PlayerIds: string[];
    BankGroupIds: string[];
}

interface IMSessionCreateRequestParams {
    language?: SessionLanguage;
    freeround_bet?: number;
    freeround_denomination?: number;
}