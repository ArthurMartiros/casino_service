export interface IB2BData {
    URL: string;
    provider_id: number;
}

export interface IGameListResponse {
    locator: {
        groups: IGroup[];
    }
}

interface IGroup {
    games: IGame[];
}

export interface IGame {
    gm_title: string;
    gm_url: string;
    icons: IGameIcons[];
}

interface IGameIcons {
    ic_name: string;
    ic_h: number;
    ic_w: number;
}

export interface IOpenGameUrl {
    game_name: string;
    operator_id: number;
    user_id: string;
    auth_token: string;
    currency: string;
}

export interface IRequest<T> {
    api: string;
    data: T;
}


export interface IResponse<T> {
    api: string;
    success: boolean;
    answer: T;
}

export interface IAuthRequest {
    user_id: string;
    user_ip: string;
    user_auth_token: string;
    currency: string;
    operator_id: number;
}

export interface IAuthResponse {
    operator_id: number;
    user_id: string;
    user_nickname: string;
    balance: string;
    bonus_balance: string;
    auth_token: string;
    game_token: string;
    error_code: number;
    error_description: string;
    currency: string;
    timestamp: string;
}

export interface IDebitRequest {
    user_id: string;
    user_ip: string;
    user_game_token: string;
    currency: string;
    turn_id: number;
    transaction_id: string;
    game_code: number;
    game_name: string;
    debit_amount: string;
    operator_id: number;
}

export interface IDebitResponse {
    operator_id: number;
    transaction_id: string;
    user_id: string;
    user_nickname: string;
    balance: string;
    bonus_balance: string;
    bonus_amount: string;
    game_token: string;
    error_code: number;
    error_description: string;
    currency: string;
    timestamp: string;
}

export interface ICreditRequest {
    user_id: string;
    user_ip: string;
    user_game_token: string;
    currency: string;
    turn_id: number;
    transaction_id: string;
    game_code: number;
    game_name: string;
    credit_amount: string;
    operator_id: number;
}

export interface ICreditResponse {
    operator_id: number;
    transaction_id: string;
    user_id: string;
    user_nickname: string;
    balance: string;
    bonus_balance: string;
    bonus_amount: string;
    game_token: string;
    error_code: number;
    error_description: string;
    currency: string;
    timestamp: string;
}

export interface IRollbackRequest {
    user_id: string;
    user_ip: string;
    user_game_token: string;
    currency: string;
    turn_id: number;
    transaction_id: string;
    game_code: number;
    game_name: string;
    rollback_amount: string;
    operator_id: number;
}

export interface IRollbackResponse {
    operator_id: number;
    transaction_id: string;
    user_id: string;
    user_nickname: string;
    balance: string;
    bonus_balance: string;
    game_token: string;
    error_code: number;
    error_description: string;
    currency: string;
    timestamp: string;
}

export interface IGetFeaturesRequest {
    user_id: string;
    user_ip: string;
    user_game_token: string;
    currency: string;
    game_code: number;
    operator_id: number;
}

export interface IGetFeaturesResponse {
    operator_id: number;
    user_id: string;
    user_nickname: string;
    balance: string;
    bonus_balance: string;
    game_token: string;
    error_code: number;
    error_description: string;
    currency: string;
    timestamp: string;
    free_rounds: IFreeRound;
}

interface IFreeRound {
    id: number;
    count: number;
    bet: number;
    lines: number;
    mpl: number;
    cp: number;
}

export interface IActivateFeaturesRequest {
    user_id: string;
    user_ip: string;
    user_game_token: string;
    currency: string;
    game_code: number;
    free_rounds: {
        id: number;
        win: number;
    };
    operator_id: number;
}

export interface IActivateFeaturesResponse {
    operator_id: number;
    user_id: string;
    user_nickname: string;
    balance: string;
    bonus_balance: string;
    game_token: string;
    error_code: number;
    error_description: string;
    currency: string;
    timestamp: string;
}

export interface IEndFeaturesRequest {
    user_id: string;
    user_ip: string;
    user_game_token: string;
    currency: string;
    game_code: number;
    free_rounds: {
        id: number;
        win: number;
    };
    operator_id: number;
}

export interface IEndFeaturesResponse {
    operator_id: number;
    user_id: string;
    user_nickname: string;
    balance: string;
    bonus_balance: string;
    game_token: string;
    error_code: number;
    error_description: string;
    currency: string;
    timestamp: string;
}
