import * as jayson from "jayson/promise";
import { IMApiResponse } from "../interfaces/m_api_response";
import { MascotMethod } from "../enums/method.enum";
import { IMGame, IMGameListResponse } from "../interfaces/m_game.interface";
import {
    IMSessionCreateRequest,
    IMSessionCreateResponse,
    IMSessionCreateDemoRequest,
    IMSessionCloseRequest,
    IMSessionGetRequest,
    IMSessionGetResponse,
    IMSessionListRequest
} from "../interfaces/m_session.interface";
import {
    IMBonusSetRequest,
    IMPlayerBonusListRequest,
    IMPlayerBonusGetRequest,
    IMPlayerBonusGetResponse,
    IMPlayerBonusActivateRequest,
    IMPlayerBonusDeactivateRequest,
    IMPlayerBonusExecuteRequest,
    IMPlayerBonusExecuteResponse
} from "../interfaces/m_bonus.interface";
import { IMBalanceChangeRequest, IMBalanceChangeResponse } from "../interfaces/m_wallet.interface";
import { IMSessionSpinNotification, IMJackpotSetSlotsValue } from "../interfaces/m_notification.interface";
import { IMBankGroupSetRequest } from "../interfaces/m_bankgroup.interface";
import { IMPlayerSetRequest } from "../interfaces/m_player.interface";
import { IMSeamlessBalanceGetRequest, IMSeamlessBalanceGetResponse } from "../interfaces/m_seamless.interface";
import { CONFIG } from '../../../../../../CommonJS/src/utils/utils';

export class JsonRpcClient {
    static apiKey: string = CONFIG().CasinoProviders.Mascot.clientKey;
    private async request<T>(method: MascotMethod, projectId: number, params: Array<any> | object = {}): Promise<T> {
        try {
            const jsonClient = jayson.Client.https({
                hostname: "api.mascot.games",
                path: "/v1/",
                key: JsonRpcClient.apiKey,
                cert: JsonRpcClient.apiKey
            });

            const { result, error } = ((await jsonClient.request(method, params, projectId)) as any) as IMApiResponse<T>; // wrong jayson typings
            if (error) {
                console.log("error1", error);
                throw error;
            }

            return result;
        } catch (error) {
            console.log("error2", error);
            throw error;
        }
    }

    async gameList(projectId: number): Promise<IMGame[]> {
        try {
            const result = await this.request<IMGameListResponse>(MascotMethod.GAME_LIST, projectId);
            return result.Games;
        } catch (error) {
            throw error;
        }
    }

    async setBankGroup(projectId: number, request: IMBankGroupSetRequest): Promise<void> {
        try {
            await this.request<void>(MascotMethod.BANK_GROUP_SET, projectId, request);
        } catch (err) {
            throw err;
        }
    }

    async setPlayer(projectId: number, request: IMPlayerSetRequest): Promise<void> {
        try {
            await this.request<void>(MascotMethod.PLAYER_SET, projectId, request);
        } catch (err) {
            throw err;
        }
    }

    async createSession(projectId: number,request: IMSessionCreateRequest): Promise<IMSessionCreateResponse> {
        try {
            const result = await this.request<IMSessionCreateResponse>(MascotMethod.SESSION_CREATE, projectId, request);
            return result;
        } catch (err) {
            throw err;
        }
    }

    async createDemoSession(projectId: number,request: IMSessionCreateDemoRequest): Promise<IMSessionCreateResponse> {
        try {
            const result = await this.request<IMSessionCreateResponse>(MascotMethod.SESSION_CREATE_DEMO, projectId, request);
            return result;
        } catch (err) {
            throw err;
        }
    }

    async closeSession(projectId: number,request: IMSessionCloseRequest): Promise<void> {
        try {
            await this.request<void>(MascotMethod.SESSION_CLOSE, projectId, request);
        } catch (err) {
            throw err;
        }
    }

    async getSession(projectId: number,request: IMSessionGetRequest): Promise<IMSessionGetResponse> {
        try {
            const result = await this.request<IMSessionGetResponse>(MascotMethod.SESSION_GET, projectId, request);
            return result;
        } catch (err) {
            throw err;
        }
    }

    async sessionList(projectId: number,request: IMSessionListRequest): Promise<any> {
        // no documentation for response
        try {
            const result = await this.request<any>(MascotMethod.SESSION_LIST, projectId, request);
            return result;
        } catch (err) {
            throw err;
        }
    }

    async setBonus(projectId: number,request: IMBonusSetRequest): Promise<void> {
        try {
            await this.request<void>(MascotMethod.BONUS_SET, projectId, request);
        } catch (err) {
            throw err;
        }
    }

    // export const bonusList

    async playerBonusList(projectId: number,request: IMPlayerBonusListRequest): Promise<any> {
        // no documentation for response
        try {
            const result = await this.request<any>(MascotMethod.PLAYER_BONUS_LIST, projectId, request);
            return result;
        } catch (err) {
            throw err;
        }
    }

    async getPlayerBonus(projectId: number,request: IMPlayerBonusGetRequest): Promise<IMPlayerBonusGetResponse> {
        try {
            const result = await this.request<IMPlayerBonusGetResponse>(MascotMethod.PLAYER_BONUS_GET, projectId, request);
            return result;
        } catch (err) {
            throw err;
        }
    }

    async activatePlayerBonus(projectId: number,request: IMPlayerBonusActivateRequest): Promise<void> {
        try {
            await this.request<void>(MascotMethod.PLAYER_BONUS_ACTIVATE, projectId, request);
        } catch (err) {
            throw err;
        }
    }

    async deactivatePlayerBonus(projectId: number,request: IMPlayerBonusDeactivateRequest): Promise<void> {
        try {
            await this.request<void>(MascotMethod.PLAYER_BONUS_DEACTIVATE, projectId, request);
        } catch (err) {
            throw err;
        }
    }

    async executePlayerBonus(projectId: number,request: IMPlayerBonusExecuteRequest): Promise<IMPlayerBonusExecuteResponse> {
        try {
            const result = await this.request<IMPlayerBonusExecuteResponse>(MascotMethod.PLAYER_BONUS_EXECUTE, projectId, request);
            return result;
        } catch (err) {
            throw err;
        }
    }

    async getBalance(projectId: number,request: IMSeamlessBalanceGetRequest): Promise<IMSeamlessBalanceGetResponse> {
        try {
            const result = await this.request<IMSeamlessBalanceGetResponse>(MascotMethod.BALANCE_GET, projectId, request);
            return result;
        } catch (err) {
            throw err;
        }
    }

    async changeBalance(projectId: number,request: IMBalanceChangeRequest): Promise<IMBalanceChangeResponse> {
        try {
            const result = await this.request<IMBalanceChangeResponse>(MascotMethod.BALANCE_CHANGE, projectId, request);
            return result;
        } catch (err) {
            throw err;
        }
    }

    async spinSession(projectId: number,request: IMSessionSpinNotification): Promise<void> {
        try {
            await this.request<void>(MascotMethod.SESSION_SPIN, projectId, request);
        } catch (err) {
            throw err;
        }
    }

    async setJackpotSlots(projectId: number,request: IMJackpotSetSlotsValue): Promise<void> {
        try {
            await this.request<void>(MascotMethod.JACKPOT_SET_SLOTS_VALUE, projectId, request);
        } catch (err) {
            throw err;
        }
    }

    async sendSeamlessGetBalance(projectId: number,request: IMSeamlessBalanceGetRequest): Promise<IMSeamlessBalanceGetResponse> {
        try {
            const result = await this.request<IMSeamlessBalanceGetResponse>(MascotMethod.BALANCE_GET, projectId, request);
            return result;
        } catch (err) {
            throw err;
        }
    }
}
