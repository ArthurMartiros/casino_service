import { ICasinoProvider, IStartGame, IGameLimit } from "../../../casino/interfaces/casino.interface";
import { DEFAULT_LANGUAGE } from "../../../../../../CommonJS/src/domain/constant";
import { IWebsiteCasinoModel } from "../../../website_casino/interfaces/website_casino.interface";
import { IRequestInfo } from "../../../../../../CommonJS/src/messaging/message.interface";
import { ErrorUtil, ErrorCodes } from "../../../../../../CommonJS/src/messaging/ErrorCodes";
import { CasinoGameModel } from "../../../casino_game/models/casino_game.model";
import { queueRequest } from "../../../../../../CommonJS/src/utils/http.util";
import { CONFIG } from "../../../../../../CommonJS/src/utils/utils";
import {
    IGameListResponse,
    IGame,
    IB2BData,
    IAuthRequest,
    IAuthResponse,
    IRequest,
    IDebitRequest,
    IDebitResponse,
    ICreditResponse,
    ICreditRequest,
    IResponse,
    IGetFeaturesRequest,
    IGetFeaturesResponse,
    IActivateFeaturesRequest,
    IActivateFeaturesResponse,
    IEndFeaturesRequest,
    IEndFeaturesResponse,
    IRollbackRequest,
    IRollbackResponse
} from "../interfaces/interfaces";
import { CasinoGameStatus } from "../../../casino_game/enums/casino_game_status.enum";
import { CasinoID } from "../../../casino/enums/casino.enum";
import { GameTechnology } from "../../../casino_game/enums/game_technology.enum";
import { CasinoGamesTranslationService } from "../../../casino_game_translation/services/casino_games_translation.service";
import { IStartGameRequest } from "../../../casino/interfaces/common.interface";
import { SessionModel } from "../../../session/models/session.model";
import { B2BCallbacks } from "../enums/enums";
import { IUser } from "../../../../../../CoreService/src/components/users/interfaces/user.interface";
import { CommunicationCodes } from "../../../../../../CommonJS/src/messaging/CommunicationCodes";
import { QueueType } from "../../../../../../CommonJS/src/messaging/QueueType";
import { broker } from "../../../../../../CommonJS/src/bll/services/ServiceBase";
import { CommonCasino } from "../../common_casino";
import { CasinoBetType } from "../../../casino_bet/enums/casino_bet.enum";
import { CasinoBet } from "../../../casino_bet/models/casino_bet.model";
import { v4 } from "uuid";
import { CasinoExtraSpin } from "../../../casino_extra_spin/models/casino_extra_spin.model";
import { BonusStatus } from "../../../../../../CoreService/src/components/bonuses/base/enums/bonus_status.enum";
import { WebsiteCasinoModel } from "../../../website_casino/models/website_casino.model";
import { CasinoCategoryType } from "../../../casino_category/enums/casino_category.enum";
export class B2BSlots implements ICasinoProvider {
    static B2BData: IB2BData = CONFIG().CasinoProviders.B2BSlots;

    private translationService = new CasinoGamesTranslationService();

    public async startGame(data: IStartGameRequest): Promise<IStartGame> {
        const websiteCasino = await WebsiteCasinoModel.findOne({ casino_id: data.casino_id, website_id: data.website_id });
        if (!websiteCasino) throw ErrorUtil.newError(ErrorCodes.WEBSITE_NOT_FOUND);

        const casinoGame = await CasinoGameModel.findOne({ id: data.casino_game_id });
        if (casinoGame) {
            if (data.demo) {
                return {
                    url: ""
                };
            }

            const session = await SessionModel.findOne({ token: data.token });
            if (!session) throw ErrorUtil.newError(ErrorCodes.SESSION_NOT_FOUND);

            const launchUrl =
                `${B2BSlots.B2BData.URL}/games/${casinoGame.game_id}?` +
                `operator_id=${websiteCasino.api_id}&` +
                `user_id=${data.user.id}&auth_token=${data.token}&currency=${data.currency}`;

            return {
                url: launchUrl
            };
        } else {
            return {
                url: ""
            };
        }
    }
    public async refreshGames(websiteCasinoModel: IWebsiteCasinoModel, requestInfo: IRequestInfo): Promise<void> {
        if (!websiteCasinoModel) throw ErrorUtil.newError(ErrorCodes.NOT_FOUND);
        const providerGames = await this.getGames(String(websiteCasinoModel.api_id));
        if (!providerGames) throw this.error(`restApi is invalid`);

        const casinoGames = await CasinoGameModel.find({ provider_id: websiteCasinoModel.casino_id });
        providerGames.map(async game => {
            const oldGame = casinoGames.find(g => g.game_id === game.gm_title);
            if (!oldGame) {
                const largeIcon = game.icons[0] ? `${B2BSlots.B2BData.URL}/game/icons/${game.icons[0].ic_name}` : undefined;
                const mediumIcon = game.icons[1] ? `${B2BSlots.B2BData.URL}/game/icons/${game.icons[1].ic_name}` : undefined;
                const smallIcon = game.icons[2] ? `${B2BSlots.B2BData.URL}/game/icons/${game.icons[2].ic_name}` : undefined;
                const newGame = new CasinoGameModel({
                    name: game.gm_title,
                    game_id: game.gm_url,
                    status_id: CasinoGameStatus.INACTIVE,
                    provider_id: CasinoID.B2BSLOTS,
                    technology_id: GameTechnology.HTML5,
                    bonus_spins: true,
                    image_lg_url: largeIcon,
                    image_md_url: mediumIcon,
                    image_sm_url: smallIcon,
                    category: CasinoCategoryType.SLOTS
                });
                await newGame.saveWithID();

                await this.translationService.saveTranslation({
                    casino_game_id: <number>newGame.id,
                    name: newGame.name,
                    website_id: requestInfo.website_id,
                    channel_id: requestInfo.channel_id,
                    lang_id: DEFAULT_LANGUAGE
                });

                return newGame;
            }
            return oldGame;
        });
    }
    async getLimits(): Promise<any> {
        return <IGameLimit>{
            denominations: {
                1: [0.01, 0.1, 0.2, 0.3, 0.5, 0.7, 1, 2, 3, 5, 7.5, 10, 20, 30, 50, 75, 100]
            },
            bets: [
                {
                    bet_id: 0,
                    bet_per_line: 1,
                    lines: 1
                }
            ]
        };
    }
    callback(data: any) {
        try {
            console.log("b2bdata", data);
            switch (data.api) {
                case B2BCallbacks.AUTH: {
                    return this.authCallback(data);
                }
                case B2BCallbacks.DEBIT: {
                    return this.debitCallback(data);
                }
                case B2BCallbacks.CREDIT: {
                    return this.creditCallback(data);
                }
                case B2BCallbacks.ROLLBACK: {
                    return this.rollbackCallback(data);
                }
                case B2BCallbacks.GET_FEATURES: {
                    return this.getFeaturesCallback(data);
                }
                case B2BCallbacks.ACTIVATE_FEATURES: {
                    return this.activateFeaturesCallback(data);
                }
                case B2BCallbacks.END_FEATURES: {
                    return this.endFeaturesCallback(data);
                }
                default:
                    return {};
            }
        } catch (error) {
            throw this.error(error);
        }
    }
    registerBonusSpin() {
        return;
    }

    private async getGames(operator_id: string): Promise<IGame[]> {
        const url = `${B2BSlots.B2BData.URL}/frontendsrv/apihandler.api`;
        const query = `cmd={"api": "ls-games-by-operator-id-get", "operator_id": "${operator_id}"}`;
        const result = await queueRequest(`${url}?${query}`, {}, "GET");
        const gamesResult = JSON.parse(result) as IGameListResponse;
        const allGames: IGame[] = [];
        gamesResult.locator.groups.map(g => {
            allGames.push(...g.games);
        });
        return allGames;
    }

    private error(message: any, errorCode: ErrorCodes = ErrorCodes.BAD_REQUEST) {
        console.error(message);
        throw ErrorUtil.newError(errorCode);
    }

    private async authCallback(data: IRequest<IAuthRequest>): Promise<IResponse<IAuthResponse>> {
        const user = await this.getUser(Number(data.data.user_id));
        if (!user) throw ErrorUtil.newError(ErrorCodes.USER_NOT_FOUND);
        const gameSessionKey = v4();
        const session = await SessionModel.findByToken(data.data.user_auth_token);
        session.token = gameSessionKey;
        await session.update();
        return {
            api: data.api,
            success: true,
            answer: {
                operator_id: data.data.operator_id,
                user_id: data.data.user_id,
                user_nickname: String(user.username),
                balance: user.balance.toString(),
                bonus_balance: user.bonus_balance.toString(),
                auth_token: data.data.user_auth_token,
                game_token: gameSessionKey,
                error_code: 0,
                error_description: "ok",
                currency: data.data.currency,
                timestamp: Date.now().toString()
            }
        };
    }

    private async debitCallback(data: IRequest<IDebitRequest>): Promise<IResponse<IDebitResponse>> {
        const user = await this.getUser(Number(data.data.user_id));
        if (!user) throw ErrorUtil.newError(ErrorCodes.USER_NOT_FOUND);
        const session = await SessionModel.findOne({ token: data.data.user_game_token });
        if (!session) throw ErrorUtil.newError(ErrorCodes.SESSION_NOT_FOUND);
        const bet = (await CommonCasino.PlaceBet(
            Number(data.data.debit_amount),
            session,
            CasinoBetType.SPIN,
            data.data.user_game_token + "-" + data.data.turn_id
        )) as CasinoBet;
        bet.setLost();
        const result = {
            api: data.api,
            success: true,
            answer: {
                operator_id: data.data.operator_id,
                transaction_id: data.data.transaction_id,
                user_id: data.data.user_id,
                user_nickname: String(user.username),
                balance: bet.balance_after.toString(),
                bonus_balance: user.bonus_balance.toString(),
                bonus_amount: bet.bonus_won_amount.toString(),
                game_token: data.data.user_game_token,
                error_code: 0,
                error_description: "ok",
                currency: data.data.currency,
                timestamp: Date.now().toString()
            }
        };
        return result;
    }

    private async creditCallback(data: IRequest<ICreditRequest>): Promise<IResponse<ICreditResponse>> {
        const user = await this.getUser(Number(data.data.user_id));
        if (!user) throw ErrorUtil.newError(ErrorCodes.USER_NOT_FOUND);
        const session = await SessionModel.findOne({ token: data.data.user_game_token });
        if (!session) throw ErrorUtil.newError(ErrorCodes.SESSION_NOT_FOUND);

        let balanceAfter = 0;
        const prevTurn = data.data.turn_id - 1;
        const oldBet = await CasinoBet.findOne({ external_action_id: data.data.user_game_token + "-" + prevTurn, provider_id: CasinoID.B2BSLOTS });
        if (oldBet) {
            console.log("oldBet", oldBet);
            balanceAfter = await CommonCasino.ProcessWin(oldBet, Number(data.data.credit_amount), CasinoID.B2BSLOTS, data.data.transaction_id);
        } else {
            console.log("newBet");
            const bet = (await CommonCasino.PlaceBet(0, session, CasinoBetType.SPIN, data.data.transaction_id)) as CasinoBet;
            balanceAfter = await CommonCasino.ProcessWin(bet, Number(data.data.credit_amount), CasinoID.B2BSLOTS, data.data.transaction_id);
        }

        const result = {
            api: data.api,
            success: true,
            answer: {
                operator_id: data.data.operator_id,
                transaction_id: data.data.transaction_id,
                user_id: data.data.user_id,
                user_nickname: String(user.username),
                balance: balanceAfter.toString(),
                bonus_balance: user.bonus_balance.toString(),
                bonus_amount: "0",
                game_token: data.data.user_game_token,
                error_code: 0,
                error_description: "ok",
                currency: data.data.currency,
                timestamp: Date.now().toString()
            }
        };
        console.log("creditCallback", result);
        return result;
    }

    private async getFeaturesCallback(data: IRequest<IGetFeaturesRequest>): Promise<IResponse<IGetFeaturesResponse>> {
        const user = await this.getUser(Number(data.data.user_id));
        if (!user) throw ErrorUtil.newError(ErrorCodes.USER_NOT_FOUND);
        const session = await SessionModel.findOne({ token: data.data.user_game_token });
        if (!session) throw ErrorUtil.newError(ErrorCodes.SESSION_NOT_FOUND);

        const extraSpins = await CasinoExtraSpin.findOne({
            user_id: user.id,
            casino_game_id: session.casino_game_id,
            status_id: BonusStatus.ACTIVE,
            used: false
        });

        return {
            api: data.api,
            success: true,
            answer: {
                operator_id: data.data.operator_id,
                user_id: data.data.user_id,
                user_nickname: String(user.username),
                balance: user.balance.toString(),
                bonus_balance: user.bonus_balance.toString(),
                game_token: data.data.user_game_token,
                error_code: 0,
                error_description: "ok",
                currency: data.data.currency,
                timestamp: Date.now().toString(),
                free_rounds: {
                    id: extraSpins ? Number(extraSpins.id) : 0,
                    count: extraSpins ? extraSpins.left_spins : 0,
                    bet: 0,
                    lines: 0,
                    mpl: 0,
                    cp: 0
                }
            }
        };
    }

    private async activateFeaturesCallback(data: IRequest<IActivateFeaturesRequest>): Promise<IResponse<IActivateFeaturesResponse>> {
        const user = await this.getUser(Number(data.data.user_id));
        if (!user) throw ErrorUtil.newError(ErrorCodes.USER_NOT_FOUND);
        const session = await SessionModel.findOne({ token: data.data.user_game_token });
        if (!session) throw ErrorUtil.newError(ErrorCodes.SESSION_NOT_FOUND);

        return {
            api: data.api,
            success: true,
            answer: {
                operator_id: data.data.operator_id,
                user_id: data.data.user_id,
                user_nickname: String(user.username),
                balance: user.balance.toString(),
                bonus_balance: user.bonus_balance.toString(),
                game_token: data.data.user_game_token,
                error_code: 0,
                error_description: "ok",
                currency: data.data.currency,
                timestamp: Date.now().toString()
            }
        };
    }

    private async endFeaturesCallback(data: IRequest<IEndFeaturesRequest>): Promise<IResponse<IEndFeaturesResponse>> {
        const user = await this.getUser(Number(data.data.user_id));
        if (!user) throw ErrorUtil.newError(ErrorCodes.USER_NOT_FOUND);
        const session = await SessionModel.findOne({ token: data.data.user_game_token });
        if (!session) throw ErrorUtil.newError(ErrorCodes.SESSION_NOT_FOUND);

        const extraSpin = await CasinoExtraSpin.findOne({ id: data.data.free_rounds.id });
        if (!extraSpin) throw ErrorUtil.newError(ErrorCodes.BONUS_NOT_FOUND);

        await extraSpin.updateLeftSpin(0);
        const trxId = v4();
        const bet = await CommonCasino.PlaceBet(0, session, CasinoBetType.BONUS_SPIN, trxId, data.data.user_game_token, data.data.free_rounds.id);
        const balanceAfter = await CommonCasino.ProcessWin(bet, Number(data.data.free_rounds.win), CasinoID.B2BSLOTS, trxId);

        return {
            api: data.api,
            success: true,
            answer: {
                operator_id: data.data.operator_id,
                user_id: data.data.user_id,
                user_nickname: String(user.username),
                balance: balanceAfter.toString(),
                bonus_balance: user.bonus_balance.toString(),
                game_token: data.data.user_game_token,
                error_code: 0,
                error_description: "ok",
                currency: data.data.currency,
                timestamp: Date.now().toString()
            }
        };
    }

    private async rollbackCallback(data: IRequest<IRollbackRequest>): Promise<IResponse<IRollbackResponse>> {
        const prevTurn = data.data.turn_id - 1;
        const casinoBet = await CasinoBet.findOne({ external_action_id: data.data.user_game_token + "-" + prevTurn, provider_id: CasinoID.B2BSLOTS });
        if (!casinoBet) throw ErrorUtil.newError(ErrorCodes.CASINO_BET_NOT_FOUND);
        await CommonCasino.BetReverse(casinoBet, CasinoID.B2BSLOTS, data.data.user_game_token + "-" + prevTurn);

        const user = await this.getUser(Number(data.data.user_id));
        if (!user) throw ErrorUtil.newError(ErrorCodes.USER_NOT_FOUND);

        return {
            api: data.api,
            success: true,
            answer: {
                operator_id: data.data.operator_id,
                transaction_id: v4(),
                user_id: data.data.user_id,
                user_nickname: String(user.username),
                balance: user.balance.toString(),
                bonus_balance: user.bonus_balance.toString(),
                game_token: data.data.user_game_token,
                error_code: 0,
                error_description: "ok",
                currency: data.data.currency,
                timestamp: Date.now().toString()
            }
        };
    }

    private async getUser(userId: number): Promise<IUser> {
        const user = await broker.sendRequest<IUser>(CommunicationCodes.GET_USER, { id: userId }, QueueType.CORE_SERVICE);
        if (!user) throw ErrorUtil.newError(ErrorCodes.USER_NOT_FOUND);
        return user;
    }
}
