import { IUser } from "../../../../../../CoreService/src/components/users/interfaces/user.interface";
import { Currencies } from "../enums/currencies.enum";
import { ICasinoGameModel } from "../../../casino_game/interfaces/casino_game.interface";

export interface IMGame {
    Id: string;
    Name: string;
    Description: string;
    SessionId: string;
    Type: string;
    Format: "html";
}

export interface IMGameListResponse {
    Games: IMGame[];
}

export interface IMSessionCallbackResponse extends IMCallbackBaseResponse {
    transaction_id: string;
}

export interface IMCallbackBaseResponse {
    balance: number;
}

export interface IMStartGame {
    casino_game_id: number;
    user: IUser;
    user_id: number;
    currency: Currencies;
    demo: boolean;
    token: string;
    api_project: number;

    casinoGame: ICasinoGameModel;
}

export interface IMInitData {
    userId: number | string;
    currency: Currencies | string;
    projectId: number;
}
