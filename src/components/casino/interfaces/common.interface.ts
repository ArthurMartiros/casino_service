import { Version } from "../../website_casino/enums/website_casino.enum";
import { IUser } from "../../../../../CoreService/src/components/users/interfaces/user.interface";
export interface IStartGameRequest {
    token?: string;
    casino_game_id: number;
    user: IUser;
    amount: number;
    currency: string;
    exit_url: string;
    api_key: string;
    api_project: number;
    api_version: Version;
    api_id?: string;
    api_url?: string;
    sandbox_url?: string;
    demo: boolean;
    casino_id: number;
    website_id: number;
}

export interface IEndGameRequest {
    casino_game_id: number;
    user_id: number;
    token: string;
}
