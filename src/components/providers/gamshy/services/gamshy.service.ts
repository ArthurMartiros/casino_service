import { ICasinoProvider, IGameLimit, IStartGame, IGameLimitRequest } from "../../../casino/interfaces/casino.interface";
import { ErrorUtil, ErrorCodes } from "../../../../../../CommonJS/src/messaging/ErrorCodes";
import { CasinoGameModel } from "../../../casino_game/models/casino_game.model";
import {
    IGamshyStartGame,
    IGamshyGame,
    IGamshyLoginCallback,
    IGamshyWithdrawCallback,
    IGamshyDepositCallback,
    IGamshyLogoutCallback,
    IGamshyRollbackCallback,
    IGamshyCallbackResponse
} from "../interfaces/gamshy_game.interface";
import { CONFIG } from "../../../../../../CommonJS/src/utils/utils";
import { postBodyRequest, getRequest } from "../utils/utils";
import { User } from "../../../../../../CoreService/src/components/users/models/user.model";
import { ICasinoExtraSpin } from "../../../casino_extra_spin/interfaces/casino_extra_spin.interface";
import { IWebsiteCasinoModel } from "../../../website_casino/interfaces/website_casino.interface";
import { IRequestInfo } from "../../../../../../CommonJS/src/messaging/message.interface";
import { toNumber, round } from "lodash";
import { each } from "bluebird";
import { CasinoGamesTranslationService } from "../../../casino_game_translation/services/casino_games_translation.service";
import { CallbackAction, BetType } from "../enums/gamshy.enum";
import { broker } from "../../../../../../CommonJS/src/base/base.model";
import { IUser } from "../../../../../../CoreService/src/components/users/interfaces/user.interface";
import { CommunicationCodes } from "../../../../../../CommonJS/src/messaging/CommunicationCodes";
import { QueueType } from "../../../../../../CommonJS/src/messaging/QueueType";
import { SessionModel } from "../../../session/models/session.model";
import { ITransactionModel } from "../../../../../../CoreService/src/components/transactions/interfaces/transaction.interface";
import { CasinoBetType, CasinoBetStatus } from "../../../casino_bet/enums/casino_bet.enum";
import { CasinoID } from "../../../casino/enums/casino.enum";
import { CommonCasino } from "../../common_casino";
import { CasinoBet } from "../../../casino_bet/models/casino_bet.model";
import { LanguageModel } from "../../../../../../CoreService/src/components/languages/models/language.model";
import { BonusWalletService } from "../../../bonus_wallet/services/bonus_wallet.service";

export class Gamshy implements ICasinoProvider {
    static BASE_URL: string = CONFIG().CasinoProviders.Gamshy.URL;
    private translationService = new CasinoGamesTranslationService();

    async startGame(data: IGamshyStartGame): Promise<IStartGame> {
        if (!data.casinoGame.has_lobby) {
            const requestData = {
                game: {
                    id: toNumber(data.casinoGame.game_id),
                    forFun: true,
                    languageIetfCode: LanguageModel.GetLanguageLocalization(data.user.language_id as number)
                },
                wallet: {
                    currencyIsoCode: data.currency || "USD"
                },
                user: {},
                customState: {}
            };
            if (!data.demo) {
                const user = {
                    id: <number>data.user.id,
                    nick: (new User(data.user).recipientInfo.name as string).replace(/ /g, "")
                };

                const customState = {
                    session_id: data.token
                };
                requestData.game.forFun = false;
                requestData.user = user;
                requestData.customState = customState;
            }
            const gameURL = `${Gamshy.BASE_URL}/game-link/get`;
            return postBodyRequest<IStartGame>(gameURL, requestData, data.api_id, data.api_key);
        }
        return {
            url: ""
        };
    }

    async callback(args: any): Promise<any> {
        try {
            let data;
            switch (args.sign) {
                case CallbackAction.LOGIN:
                    data = await this.loginCallback(args as IGamshyLoginCallback);
                    break;
                case CallbackAction.WITHDRAW:
                    data = await this.withdrawCallback(args as IGamshyWithdrawCallback);
                    break;
                case CallbackAction.DEPOSIT:
                    data = await this.depositCallback(args as IGamshyDepositCallback);
                    break;
                case CallbackAction.ROLLBACK:
                    data = await this.rollbackCallback(args as IGamshyRollbackCallback);
                    break;
                case CallbackAction.GETBALANCE:
                    data = await this.getBalanceCallback(args as IGamshyLoginCallback);
                    break;
                case CallbackAction.LOGOUT:
                    data = await this.logoutCallback(args as IGamshyLogoutCallback);
                    break;
                default:
                    data = {};
            }
            return data;
        } catch (err) {
            console.error(args.action, args.action);
            console.error(err);
            throw err;
        }
    }

    async loginCallback(data: IGamshyLoginCallback): Promise<IGamshyCallbackResponse> {
        const user = await broker.sendRequest<IUser>(CommunicationCodes.GET_USER, { id: data.user.id }, QueueType.CORE_SERVICE);
        if (!user) return this.sendResponse();
        // get session and change token to provder game session id
        const session = await SessionModel.findByToken(data.customState.session_id);
        if (!session) return this.sendResponse();
        session.token = data.game.sessionId;
        await session.update();
        const bonus = await BonusWalletService.GetBonusBalance(toNumber(data.user.id));
        // return user current balance
        return this.sendResponse(user.balance + bonus);
    }

    async withdrawCallback(data: IGamshyWithdrawCallback): Promise<IGamshyCallbackResponse> {
        const session = await SessionModel.findByToken(data.game.sessionId);
        if (!session) return this.sendResponse();
        // find for processed transaction
        const processed = await this.getProcessedTransaction(data.game.transactionId);
        if (processed) return processed;
        // get bet type
        const betType = this.getBetType(BetType.BET);
        // new casino bet
        let bet: CasinoBet;
        bet = await CommonCasino.PlaceBet(data.wallet.withdrawal, session, betType, data.game.roundId);
        // set lost automaticaly
        bet.setLost();
        return this.sendResponse(round(bet.balance_after, 5), data.game.roundId);
    }

    async depositCallback(data: IGamshyDepositCallback): Promise<IGamshyCallbackResponse> {
        const session = await SessionModel.findByToken(data.game.sessionId);
        if (!session) return this.sendResponse();
        // find for processed transaction
        const processed = await this.getProcessedTransaction(data.game.transactionId);
        if (processed) return processed;
        // find casino bet
        const casinoBet = await CasinoBet.findOne({ casino_game_id: session.casino_game_id, user_id: session.user_id, external_action_id: data.game.roundId });
        if (!casinoBet) return this.sendResponse();
        // get balance after bet
        const balance = await CommonCasino.ProcessWin(casinoBet, data.wallet.deposit, CasinoID.GAMSHY, data.game.transactionId);
        // return user new balance
        return this.sendResponse(round(balance, 5));
    }

    async rollbackCallback(data: IGamshyRollbackCallback): Promise<IGamshyCallbackResponse> {
        const session = await SessionModel.findByToken(data.game.sessionId);
        if (!session) return this.sendResponse();
        // find bet
        const casinoBet = await CasinoBet.findOne({ external_action_id: data.customState.roundId });
        if (!casinoBet || casinoBet.status_id === CasinoBetStatus.BET_REVERSE) return this.sendResponse(await CommonCasino.GetUserBalance(session.user_id));
        // return user new balance
        await CommonCasino.BetReverse(casinoBet, CasinoID.GAMSHY, data.customState.roundId as string);
        return this.sendResponse(await CommonCasino.GetUserBalance(session.user_id));
    }

    async logoutCallback(data: IGamshyLogoutCallback): Promise<object> {
        console.log("logoutCallback---", data);
        return {};
    }

    async getBalanceCallback(data: IGamshyLoginCallback): Promise<any> {
        const session = await SessionModel.findByToken(data.game.sessionId);
        if (!session) return this.sendResponse();
        const user = await broker.sendRequest<IUser>(CommunicationCodes.GET_USER, { id: session.user_id }, QueueType.CORE_SERVICE);
        if (!user) return this.sendResponse();

        const bonus = await BonusWalletService.GetBonusBalance(toNumber(data.user.id));
        // return user current balance
        return this.sendResponse(user.balance + bonus);
    }

    private async getProcessedTransaction(external_reference_number: string): Promise<IGamshyCallbackResponse | undefined> {
        const oldTransction = await broker.sendRequest<ITransactionModel>(
            CommunicationCodes.GET_TRANSACTION,
            { external_reference_number },
            QueueType.CORE_SERVICE
        );
        if (!oldTransction) return;
        else {
            return this.sendResponse(round(<number>oldTransction.balance_after, 5));
        }
    }

    private sendResponse(balance: number = 0, roundId: string = ""): IGamshyCallbackResponse {
        let resp = {
            wallet: {
                cash: balance
            },
            customState: {
                roundId: roundId
            }
        };
        return resp;
    }

    async getLimits(request: IGameLimitRequest): Promise<IGameLimit | undefined> {
        console.log("getLimits request-----", request);
        return undefined;
    }

    async registerBonusSpin(data: ICasinoExtraSpin): Promise<void> {
        console.log("registerBonusSpin", data);
        return undefined;
    }

    async refreshGames(websiteCasinoModel: IWebsiteCasinoModel, requestInfo: IRequestInfo): Promise<void> {
        if (!websiteCasinoModel) throw ErrorUtil.newError(ErrorCodes.NOT_FOUND);
        if (!websiteCasinoModel.api_id || !websiteCasinoModel.api_key) return;
        const providerGames = await this.getGames(websiteCasinoModel);

        // compare games, save new ones
        await each(providerGames, async providerGame => {
            // get old game

            let game = await CasinoGameModel.findOne({ name: providerGame.description, provider_id: websiteCasinoModel.id });
            // return existing game if exists
            if (game) {
                game.game_id = providerGame.id;
                game.name = providerGame.description;
                return game.update();
            }
            // if game does not exists save new one
            game = await new CasinoGameModel({
                name: providerGame.description,
                game_id: providerGame.id,
                status_id: 1,
                has_lobby: false,
                category: 4,
                provider_id: websiteCasinoModel.id as number,
                technology_id: 1
            }).saveWithID();
            await this.translationService.setList(<number>game.id, [
                Object.assign(requestInfo, {
                    casino_game_id: <number>game.id,
                    name: providerGame.description
                })
            ]);
            return game;
        }).catch(err => {
            console.error(err);
            throw err;
        });
    }

    private async getGames(
        websiteCasinoModel: IWebsiteCasinoModel,
        // page: number = 1,
        link: string = `${Gamshy.BASE_URL}/game-list`,
        allGames: IGamshyGame[] = []
    ): Promise<IGamshyGame[]> {
        const data = await getRequest<string>(link, websiteCasinoModel.api_id as string, websiteCasinoModel.api_key as string);
        const games = JSON.parse(data);
        allGames = allGames.concat(games);
        return allGames;
    }

    private getBetType(game: BetType): CasinoBetType {
        switch (game) {
            case BetType.BET:
                return CasinoBetType.SPIN;
            case BetType.FREESPIN:
                return CasinoBetType.FREE_SPIN;
            case BetType.TIP:
                return CasinoBetType.TIP;
        }
        return CasinoBetType.SPIN;
    }
}
