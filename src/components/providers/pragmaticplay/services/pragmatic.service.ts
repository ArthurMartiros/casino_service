import { ICasinoProvider, IStartGame, IGameLimit, IGameLimitRequest } from "../../../casino/interfaces/casino.interface";
import { IWebsiteCasinoModel } from "../../../website_casino/interfaces/website_casino.interface";
import { IRequestInfo } from "../../../../../../CommonJS/src/messaging/message.interface";
import { ErrorUtil, ErrorCodes } from "../../../../../../CommonJS/src/messaging/ErrorCodes";
import { queueRequest } from "../../../../../../CommonJS/src/utils/http.util";
import { generateHash, generateQueryStr, gameUrl, demoGameUrl } from "../utils/utils";
import { CasinoGame, CasinoGameResponse } from "../interfaces/game.interface";
import { CasinoGameModel } from "../../../casino_game/models/casino_game.model";
import { DEFAULT_LANGUAGE } from "../../../../../../CommonJS/src/domain/constant";
import { CasinoGameStatus } from "../../../casino_game/enums/casino_game_status.enum";
import { CasinoID } from "../../../casino/enums/casino.enum";
import { GameTechnology } from "../../../casino_game/enums/game_technology.enum";
import { CasinoGamesTranslationService } from "../../../casino_game_translation/services/casino_games_translation.service";
import { SessionModel } from "../../../session/models/session.model";
import { CallbackMethods } from "../enums/callback_methods.enum";
import { broker } from "../../../../../../CommonJS/src/bll/services/ServiceBase";
import { IUser } from "../../../../../../CoreService/src/components/users/interfaces/user.interface";
import { CommunicationCodes } from "../../../../../../CommonJS/src/messaging/CommunicationCodes";
import { QueueType } from "../../../../../../CommonJS/src/messaging/QueueType";
import {
    AuthResponse,
    AuthRequest,
    BetRequest,
    BetResponse,
    RefundRequest,
    RefundResponse,
    BalanceResponse,
    ResultRequest,
    ResultResponse,
    BalanceRequest,
    JackpotWinRequest,
    BonusWinRequest,
    PromoWinRequest
} from "../interfaces/seamless.interface";
import { CasinoBetType, CasinoBetStatus } from "../../../casino_bet/enums/casino_bet.enum";
import { CommonCasino, GetCasinoGameCategory } from "../../common_casino";
import { CasinoBet } from "../../../casino_bet/models/casino_bet.model";
import { toNumber } from "lodash";
import { IStartGameRequest } from "../../../casino/interfaces/common.interface";
import { CasinoExtraSpin } from "../../../casino_extra_spin/models/casino_extra_spin.model";
import { WebsiteCasinoModel } from "../../../website_casino/models/website_casino.model";
import { CurrencyModel } from "../../../../../../CoreService/src/components/currencies/models/currency.model";
import { ICasinoExtraSpin } from "../../../casino_extra_spin/interfaces/casino_extra_spin.interface";
import { BonusWalletService } from "../../../bonus_wallet/services/bonus_wallet.service";
import { v4 } from "uuid";
import { map } from "bluebird";
import { toNumberIfExists, toBoolean } from "../../../../../../CommonJS/src/utils/validators";
import { ITransactionModel } from "../../../../../../CoreService/src/components/transactions/interfaces/transaction.interface";
import { MoneyType } from "../../../../../../CoreService/src/components/transactions/enums/money_type.enum";
import { TransactionType } from "../../../../../../CoreService/src/components/transactions/enums/transaction_type.enum";
import { ChannelType } from "../../../../../../CommonJS/src/enums/channel_type.enum";
import { SourceType } from "../../../../../../CommonJS/src/enums/source_type.enum";
import { TransactionStatus } from "../../../../../../CoreService/src/components/transactions/enums/transaction_status.enum";

export class Pragmatic implements ICasinoProvider {
    private translationService = new CasinoGamesTranslationService();

    public async refreshGames(websiteCasinoModel: IWebsiteCasinoModel, requestInfo: IRequestInfo): Promise<void> {
        if (!websiteCasinoModel || !websiteCasinoModel.api_id || !websiteCasinoModel.api_key) throw ErrorUtil.newError(ErrorCodes.NOT_FOUND);
        const url = `https://${websiteCasinoModel.api_second_url}/IntegrationService/v3/http/CasinoGameAPI/getCasinoGames/`;
        const providerGames = await this.getGames(websiteCasinoModel.api_id, url, websiteCasinoModel.api_key);

        if (!providerGames) throw this.error(`restApi is invalid`);

        const games = providerGames.filter(g => g.platform.includes("WEB") || g.platform.includes("MOBILE"));
        const casinoGames = await CasinoGameModel.find({ provider_id: websiteCasinoModel.casino_id });
        await map(games, async game => {
            const oldGame = casinoGames.find(g => g.game_id === game.gameID);
            if (!oldGame) {
                const newGame = new CasinoGameModel({
                    name: game.gameName,
                    game_id: game.gameID,
                    status_id: CasinoGameStatus.INACTIVE,
                    provider_id: CasinoID.PRAGMATIC,
                    technology_id: GameTechnology.HTML5,
                    is_mobile: game.platform.includes("MOBILE") ? true : false,
                    bonus_spins: toBoolean(game.variableFrbAvailable || game.frbAvailable),
                    category: GetCasinoGameCategory(game.typeDescription)
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
            } else {
                oldGame.is_mobile = game.platform.includes("MOBILE") ? true : false;
                oldGame.bonus_spins = toBoolean(game.variableFrbAvailable || game.frbAvailable);
                oldGame.category = GetCasinoGameCategory(game.typeDescription);
                await oldGame.update();
            }
            return oldGame;
        });
    }

    public async startGame(data: IStartGameRequest): Promise<IStartGame> {
        const casinoGame = await CasinoGameModel.findOne({ id: data.casino_game_id });
        if (casinoGame) {
            if (data.demo) {
                const demoUrl = demoGameUrl(data.sandbox_url as string, casinoGame.game_id);
                return {
                    url: demoUrl
                };
            }

            const session = await SessionModel.findOne({ token: data.token });
            if (!session) throw ErrorUtil.newError(ErrorCodes.SESSION_NOT_FOUND);

            const token = session.token;
            const technology = "F";
            const platform = "WEB";
            const language = "en";
            const cashierUrl = "";
            const lobbyUrl = data.exit_url;

            const launchUrl = gameUrl(
                data.api_url as string,
                String(token),
                casinoGame.game_id,
                technology,
                platform,
                language,
                cashierUrl,
                lobbyUrl,
                data.api_id as string
            );
            return {
                url: launchUrl
            };
        } else {
            return {
                url: ""
            };
        }
    }

    public async callback(
        data: AuthRequest | BetRequest | RefundRequest | BalanceRequest | ResultRequest | JackpotWinRequest | BonusWinRequest | PromoWinRequest
    ) {
        try {
            switch (data.method) {
                case CallbackMethods.Authenticate:
                    return this.authCallback(data as AuthRequest);
                case CallbackMethods.Bet:
                    return this.betCallback(data as BetRequest);
                case CallbackMethods.Refund:
                    return this.refundCallback(data as RefundRequest);
                case CallbackMethods.Balance:
                    return this.balanceCallback(data as BalanceRequest);
                case CallbackMethods.Result:
                    return this.winCallback(data as ResultRequest);
                case CallbackMethods.JackpotWin:
                    return this.winCallback(data as JackpotWinRequest);
                case CallbackMethods.BonusWin:
                    return this.winCallback(data as BonusWinRequest);
                case CallbackMethods.PromoWin:
                    return this.promoWinCallback(data as PromoWinRequest);
                default:
                    return {};
            }
        } catch (error) {
            throw this.error(error);
        }
    }

    private async authCallback(data: AuthRequest): Promise<AuthResponse> {
        const session = await this.getSession(data.token);

        return Object.assign(
            {
                token: data.token,
                userId: session.user_id,
                currency: session.currency_code,
                error: 0,
                description: "Success"
            },
            await this.GetUserBalance(session.user_id)
        );
    }

    private async betCallback(data: BetRequest): Promise<BetResponse> {
        const session = await this.getSession(data.token);
        const oldBet = await CasinoBet.findOne({ hash: data.reference });
        if (oldBet) {
            return Object.assign(
                {
                    transactionId: Number(oldBet.id),
                    currency: session.currency_code,
                    usedPromo: 0
                },
                await this.GetUserBalance(session.user_id)
            );
        }

        if (data.bonusCode) {
            const activeBonus = await CasinoExtraSpin.findOne({ id: Number(data.bonusCode) });
            if (activeBonus) await activeBonus.updateLeftSpin();
        }
        const bet = (await CommonCasino.PlaceBet(
            Number(data.amount),
            session,
            CasinoBetType.SPIN,
            data.roundId,
            data.reference,
            toNumberIfExists(data.bonusCode)
        )) as CasinoBet;
        bet.setLost();
        return Object.assign(
            {
                transactionId: bet.id as number,
                currency: session.currency_code,
                usedPromo: bet.bonus_stake
            },
            await this.GetUserBalance(session.user_id)
        );
    }

    private async refundCallback(data: RefundRequest): Promise<RefundResponse> {
        // update casino bet
        const casinoBet = await CasinoBet.findOne({ hash: data.reference });
        if (!casinoBet) {
            return {
                error: 0,
                transactionId: v4()
            };
        }
        await CommonCasino.BetReverse(casinoBet, CasinoID.PRAGMATIC, data.reference);
        return { transactionId: casinoBet.id };
    }

    private async balanceCallback(data: BalanceRequest): Promise<BalanceResponse> {
        const session = await this.getSession(data.token);
        return Object.assign(
            {
                currency: session.currency_code
            },
            await this.GetUserBalance(session.user_id)
        );
    }

    private async winCallback(data: ResultRequest | JackpotWinRequest | BonusWinRequest): Promise<ResultResponse> {
        const session = await this.getSession(data.token);
        if (data.method === CallbackMethods.BonusWin) {
            return Object.assign(
                {
                    transactionId: 0,
                    currency: session.currency_code
                },
                await this.GetUserBalance(session.user_id)
            );
        }
        const casinoBet = await CasinoBet.findOne({ external_action_id: data.roundId });
        if (!casinoBet) throw ErrorUtil.newError(ErrorCodes.NOT_FOUND);

        if (casinoBet.status_id === CasinoBetStatus.WON) {
            return Object.assign(
                {
                    transactionId: Number(casinoBet.id),
                    currency: session.currency_code
                },
                await this.GetUserBalance(session.user_id)
            );
        }

        const promoWin = toNumber((data as ResultRequest).promoWinAmount) || 0;
        await CommonCasino.ProcessWin(casinoBet, Number(data.amount) + promoWin, CasinoID.PRAGMATIC, data.reference);

        return Object.assign(
            {
                transactionId: Number(casinoBet.id),
                currency: session.currency_code
            },
            await this.GetUserBalance(session.user_id)
        );
    }

    private async promoWinCallback(data: PromoWinRequest): Promise<ResultResponse> {
        let trans = await broker.sendRequest<ITransactionModel | undefined>(
            CommunicationCodes.GET_TRANSACTION,
            { external_reference_number: data.reference },
            QueueType.CORE_SERVICE
        );
        const currency = await CurrencyModel.findOne({ code: data.currency.toUpperCase() });
        if (!currency) throw ErrorUtil.newError(ErrorCodes.INVALID_CURRENCY);
        if (!trans) {
            trans = await broker.sendRequest<ITransactionModel>(
                CommunicationCodes.UPDATE_USER_BALANCE,
                <ITransactionModel>{
                    amount: data.amount,
                    money_type_id: MoneyType.REAL,
                    user_id: data.userId,
                    currency_id: currency.id,
                    product_id: CasinoID.PRAGMATIC,
                    type_id: TransactionType.BONUS,
                    channel_id: ChannelType.BACKEND,
                    source_id: CasinoID.PRAGMATIC,
                    source_type_id: SourceType.CASINO,
                    status_id: TransactionStatus.SUCCESS,
                    code: v4(),
                    external_reference_number: data.reference
                },
                QueueType.CORE_SERVICE
            );
        }

        return Object.assign(
            {
                transactionId: Number(trans.id),
                currency: currency.code
            },
            await this.GetUserBalance(data.userId)
        );
    }

    async getLimits(_request: IGameLimitRequest): Promise<IGameLimit> {
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

    async registerBonusSpin(extraSpinData: ICasinoExtraSpin): Promise<void> {
        const casinoGame = await CasinoGameModel.findOne({ id: extraSpinData.casino_game_id });
        if (!casinoGame) throw ErrorUtil.newError(ErrorCodes.CASINO_GAME_NOT_FOUND);

        const websiteCasino = await WebsiteCasinoModel.findOne({ casino_id: casinoGame.provider_id, website_id: extraSpinData.website_id });
        if (!websiteCasino) throw ErrorUtil.newError(ErrorCodes.CASINO_GAME_NOT_FOUND);

        const currency = await CurrencyModel.findOne({ id: extraSpinData.currency_id });
        if (!currency) return;

        const url = `https://${websiteCasino.api_second_url}/IntegrationService/v3/http/FreeRoundsBonusAPI/v2/bonus/create`;
        const headers = {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache"
        };
        const symbol = casinoGame.game_id;
        const gameList = [
            {
                gameId: symbol,
                betValues: [
                    {
                        betPerLine: extraSpinData.bet_amount,
                        currency: currency.code
                    }
                ]
            }
        ];
        const data = {
            bonusCode: extraSpinData.id,
            expirationDate: Math.floor(extraSpinData.expire_date.getTime() / 1000),
            rounds: extraSpinData.left_spins,
            secureLogin: websiteCasino.api_id,
            startDate: Math.floor(Date.now() / 1000)
        };
        const hash = generateHash(data, websiteCasino.api_key as string);
        data["hash"] = hash;
        const query = generateQueryStr(data);
        const result = await queueRequest(`${url}?${query}`, headers, "POST", { gameList: gameList });
        if ((result.error = "0" || result.error == "5")) {
            const userUrl = `https://${websiteCasino.api_second_url}/IntegrationService/v3/http/FreeRoundsBonusAPI/v2/players/add`;
            const userData = {
                bonusCode: extraSpinData.id,
                secureLogin: websiteCasino.api_id
            };
            const userHash = generateHash(userData, websiteCasino.api_key as string);
            userData["hash"] = userHash;
            const userQuery = generateQueryStr(userData);
            await queueRequest(`${userUrl}?${userQuery}`, headers, "POST", { playerList: [extraSpinData.user_id.toString()] });
        }
    }

    private async getGames(api_id: string, url: string, key: string): Promise<CasinoGame[]> {
        const headers = {
            "Content-Type": "application/x-www-form-urlencoded"
        };
        const data = {
            options: "GetFrbDetails",
            secureLogin: api_id
        };
        const hash = generateHash(data, key);
        data["hash"] = hash;
        const query = generateQueryStr(data);
        const result = await queueRequest(`${url}?${query}`, headers, "POST");
        const games = JSON.parse(result) as CasinoGameResponse;
        return games.gameList;
    }

    private async getSession(token: string): Promise<SessionModel> {
        const session = await SessionModel.findByToken(token);
        if (!session) throw ErrorUtil.newError(ErrorCodes.SESSION_NOT_FOUND);
        return session;
    }

    private error(message: any, errorCode: ErrorCodes = ErrorCodes.BAD_REQUEST) {
        console.error(message);
        throw ErrorUtil.newError(errorCode);
    }

    private async GetUserBalance(user_id: number) {
        const user = await broker.sendRequest<IUser>(CommunicationCodes.GET_USER, { id: user_id }, QueueType.CORE_SERVICE);
        const bonus = await BonusWalletService.GetBonusBalance(toNumber(user_id));
        return {
            cash: user.balance,
            bonus
        };
    }
}
