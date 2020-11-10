import { IUser } from "../../../../../../CoreService/src/components/users/interfaces/user.interface";
import { CallbackAction, BetType } from "../enums/sg.enum";

export interface ISGGame {
    uuid: string;
    name: string;
    image: string;
    type: string;
    provider: string;
    technology: "HTML5" | "Flash" | "Flash/Html5";
    has_lobby: number;
    is_mobile: number;
}

export interface ISGMeta {
    currentPage: number;
    pageCount: number;
    perPage: number;
    totalCount: number;
}

export interface ISGLinks {
    last: ISGLink;
    next: ISGLink;
    self: ISGLink;
}

export interface ISGLink {
    href: string;
}

export interface ISGResponse {
    _links: ISGLinks;
    _meta: ISGMeta;
    items: ISGGame[];
}

export interface ISGStartGame {
    casino_game_id: number;
    user: IUser;
    api_id: string;
    api_key: string;
    token: string;
    settings: {
        exit_url: string;
    };
    demo: boolean;
}

export interface ISGCallbackBase {
    action: CallbackAction;
    player_id: string;
    currency: string;
    sign: string;
    merchant: string;
    timestamp: string;
    nonce: string;
}

export interface ISGCallbackBaseResponse {
    balance: number;
}

export interface ISGSessionCallback extends ISGCallbackBase {
    amount: number;
    amount_usd: number;
    game_uuid: string;
    transaction_id: string;
    session_id: string;
    freespin_id: number;
    quantity: number;
}

export interface ISGSessionCallbackResponse extends ISGCallbackBaseResponse {
    transaction_id: string;
}

export interface ISGBetCallback extends ISGSessionCallback {
    type: BetType;
}

export interface ISGWinCallback extends ISGSessionCallback {
    type: "win" | "jackpot" | "freespin";
}

export interface ISGRefundCallback extends ISGSessionCallback {
    bet_transaction_id: string;
}

export interface ISGRollbackCallback extends ISGSessionCallback {
    type: "rollback";
    bet_transaction_id: string;
    rollback_transactions: {
        transaction_id: string;
        action: "bet" | "win" | "refund";
        amount: number;
        type: "bet" | "tip" | "freespin" | "win" | "jackpot" | "freespin";
    }[];
    provider_round_id: string;
}

export interface ISGRollackResponse extends ISGSessionCallbackResponse {
    rollback_transactions: string[];
}

export interface ISGError {
    error_code: string;
    error_description: string;
}
