import { ICasinoProvider, IStartGame, IGameLimitRequest, IGameLimit } from "../../../casino/interfaces/casino.interface";
import { CasinoGamesTranslationService } from "../../../casino_game_translation/services/casino_games_translation.service";
import { CONFIG } from "../../../../../../CommonJS/src/utils/utils";
import { IWebsiteCasinoModel } from "../../../website_casino/interfaces/website_casino.interface";
import { ErrorUtil, ErrorCodes } from "../../../../../../CommonJS/src/messaging/ErrorCodes";
import { IRequestInfo } from "../../../../../../CommonJS/src/messaging/message.interface";
import { CasinoID } from "../../../casino/enums/casino.enum";
import { CasinoGameModel } from "../../../casino_game/models/casino_game.model";
import { CasinoGameStatus } from "../../../casino_game/enums/casino_game_status.enum";
import { GameTechnology } from "../../../casino_game/enums/game_technology.enum";
import { IMSessionCreateRequest, IMSessionCreateDemoRequest } from "../interfaces/m_session.interface";
import { JsonRpcClient } from "../utils/jsonRpcClient";
import { ICasinoExtraSpin } from "../../../casino_extra_spin/interfaces/casino_extra_spin.interface";
import { OperationType } from "../enums/operationType.enum";
import { SessionModel } from "../../../session/models/session.model";
import { IMError } from "../interfaces/m_api_response";
import { toNumber, round, isNil } from "lodash";
import { CasinoBetType } from "../../../casino_bet/enums/casino_bet.enum";
import { BetType } from "../enums/betType.enum";
import { CasinoBet } from "../../../casino_bet/models/casino_bet.model";
import { IMStartGame, IMInitData } from "../interfaces/m_game.interface";
import { IMPlayerSetRequest } from "../interfaces/m_player.interface";
import { IMBankGroupSetRequest } from "../interfaces/m_bankgroup.interface";
import { Currencies } from "../enums/currencies.enum";
import {
    IMBalanceChangeData,
    IMCallbackBase,
    IMBalanceGetData,
    IMBalanceChangeResponse,
    IMBalanceGetResponse,
    IMBonusWinData
} from "../interfaces/m_callback_interface";
import { MCallbackType } from "../enums/callbackType.enum";
import { CommonCasino, GetCasinoGameCategory } from "../../common_casino";
import { DEFAULT_LANGUAGE } from "../../../../../../CommonJS/src/domain/constant";
import { IMBonusSetRequest, IMPlayerBonusActivateRequest, IMPlayerBonusListRequest } from "../interfaces/m_bonus.interface";
import { BonusCounterType } from "../enums/bonusCounterType.enum";
import { CasinoExtraSpin } from "../../../casino_extra_spin/models/casino_extra_spin.model";
import { WebsiteCasinoModel } from "../../../website_casino/models/website_casino.model";
import { BonusOperationType } from "../enums/bonusOperationType.enum";
import { BonusAccountType } from "../enums/bonusAccountType.enum";
import { BonusStatus } from "../../../../../../CoreService/src/components/bonuses/base/enums/bonus_status.enum";

export class Mascot implements ICasinoProvider {
    private translationService = new CasinoGamesTranslationService();
    private jsonClient = new JsonRpcClient();
    static BASE_URL: string = CONFIG().CasinoProviders.Mascot.URL;

    async refreshGames(websiteCasinoModel: IWebsiteCasinoModel, requestInfo: IRequestInfo): Promise<void> {
        if (!websiteCasinoModel) throw ErrorUtil.newError(ErrorCodes.NOT_FOUND);
        if (!websiteCasinoModel.api_project) return;
        const providerGames = await this.jsonClient.gameList(toNumber(websiteCasinoModel.api_project));
        if (!providerGames) throw ErrorUtil.newError(ErrorCodes.BAD_REQUEST);

        const casinoGames = await CasinoGameModel.find({ provider_id: websiteCasinoModel.casino_id });
        providerGames.map(async game => {
            const oldGame = casinoGames.find(g => g.game_id === game.Id);
            if (!oldGame) {
                const newGame = new CasinoGameModel({
                    name: game.Name,
                    game_id: game.Id,
                    status_id: CasinoGameStatus.INACTIVE,
                    provider_id: CasinoID.MASCOT,
                    technology_id: GameTechnology.HTML5,
                    bonus_spins: true,
                    category: GetCasinoGameCategory(game.Type)
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
                oldGame.category = GetCasinoGameCategory(game.Type);
                oldGame.is_mobile = true;
                await oldGame.update();
            }
            return oldGame;
        });
    }

    async startGame(data: IMStartGame): Promise<IStartGame> {
        if (!data.casinoGame.has_lobby) {
            if (data.demo) {
                // demo mode

                const initData: IMInitData = {
                    userId: data.user_id,
                    currency: Currencies.USD,
                    projectId: data.api_project
                };

                await this.initApi(initData);

                const gameInfo: IMSessionCreateDemoRequest = {
                    GameId: data.casinoGame.game_id,
                    BankGroupId: data.user_id.toString()
                };

                const result = await this.jsonClient.createDemoSession(initData.projectId, gameInfo);

                return {
                    url: result.SessionUrl
                };
            } else {
                // normal mode
                await this.initApi({
                    userId: data.user_id,
                    currency: data.currency,
                    projectId: data.api_project
                });

                const gameInfo: IMSessionCreateRequest = {
                    PlayerId: data.user_id.toString(),
                    GameId: data.casinoGame.game_id,
                    AlternativeId: data.token
                };

                await this.applyBonuesToSessions(data.user_id, data.api_project, data.casinoGame.game_id, gameInfo);
                const result = await this.jsonClient.createSession(data.api_project, gameInfo);
                console.log(result);
                return {
                    url: result.SessionUrl
                };
            }
        }
        return {
            url: ""
        };
    }

    private async applyBonuesToSessions(user_id: number, projectId: number, gameId: string, gameInfo: IMSessionCreateRequest) {
        const bonusListRequest: IMPlayerBonusListRequest = {
            PlayerId: user_id.toString()
        };
        const playerBonusListResult = (await this.jsonClient.playerBonusList(projectId, bonusListRequest)) as {
            PlayerBonuses: Array<{
                BonusId: string;
            }>;
        };
        for (let i = 0; i < playerBonusListResult.PlayerBonuses.length; i++) {
            const bonus = playerBonusListResult.PlayerBonuses[i];
            const bonusInfo = await this.jsonClient.getPlayerBonus(projectId, {
                BonusId: bonus.BonusId,
                PlayerId: user_id.toString()
            });
            const freeSpin = await CasinoExtraSpin.findOne({ id: Number(bonus.BonusId) });
            if (bonusInfo && bonusInfo.Shared.FsCount === 0) {
                if (bonusInfo.Shared.Balance > 0) {
                    await this.jsonClient.executePlayerBonus(projectId, {
                        BonusId: bonus.BonusId,
                        PlayerId: user_id.toString(),
                        Operations: [
                            {
                                Type: BonusOperationType.TRANSFER,
                                BonusAccount: {
                                    Type: BonusAccountType.SHARED,
                                    GameId: gameId
                                },
                                Transfer: {
                                    All: true
                                }
                            }
                        ]
                    });
                }

                await this.jsonClient.deactivatePlayerBonus(projectId, {
                    BonusId: bonus.BonusId,
                    PlayerId: user_id.toString()
                });

                if (freeSpin && freeSpin.status_id === BonusStatus.ACTIVE) {
                    freeSpin.updateLeftSpin(0);
                }
            }
            if (bonusInfo && bonusInfo.Shared.FsCount > 0) {
                if (freeSpin && freeSpin.status_id !== BonusStatus.ACTIVE) {
                    await this.jsonClient.deactivatePlayerBonus(projectId, {
                        BonusId: bonus.BonusId,
                        PlayerId: user_id.toString()
                    });
                }
                if (freeSpin && freeSpin.status_id === BonusStatus.ACTIVE) {
                    gameInfo.BonusId = bonus.BonusId;
                    gameInfo.Params = {
                        freeround_bet: freeSpin.bet_amount,
                        freeround_denomination: freeSpin.denomination
                    };
                }
            }
        }
    }

    async getLimits(_request: IGameLimitRequest): Promise<IGameLimit> {
        return <IGameLimit>{
            denominations: {
                1: [0.1, 0.2, 0.3, 0.5, 0.7, 1, 2, 3, 5, 7.5, 10, 20, 30, 50, 75, 100]
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

    async registerBonusSpin(data: ICasinoExtraSpin): Promise<void> {
        const casinoGame = await CasinoGameModel.findOne({ id: data.casino_game_id });
        if (!casinoGame) throw ErrorUtil.newError(ErrorCodes.CASINO_GAME_NOT_FOUND);

        const websiteCasino = await WebsiteCasinoModel.findOne({ casino_id: casinoGame.provider_id, website_id: data.website_id });
        if (!websiteCasino) throw ErrorUtil.newError(ErrorCodes.CASINO_GAME_NOT_FOUND);

        const bonusSetRequest: IMBonusSetRequest = {
            Id: (data.id as number).toString(),
            FsType: "original",
            CounterType: BonusCounterType.SHARED,
            SharedParams: {
                FsCount: data.left_spins
            }
        };
        await this.jsonClient.setBonus(Number(websiteCasino.api_id), bonusSetRequest);

        const bonusActivateRequest: IMPlayerBonusActivateRequest = {
            BonusId: (data.id as number).toString(),
            PlayerId: data.user_id.toString()
        };
        await this.jsonClient.activatePlayerBonus(Number(websiteCasino.api_id), bonusActivateRequest);
    }

    async callback(args: IMCallbackBase<IMBalanceChangeData | IMBalanceGetData>): Promise<IMBalanceGetResponse | IMBalanceChangeResponse> {
        try {
            switch (args.method) {
                case MCallbackType.BalanceGet: {
                    return this.balanceCallback(args.params as IMBalanceGetData);
                }
                case MCallbackType.BalanceChange: {
                    if (!args.params.Context) {
                        // In case of bonus win
                        return this.proceedBonusWin(args.params as IMBonusWinData);
                    }
                    return this.betCallback(args.params as IMBalanceChangeData);
                }
                default: {
                    console.log("undefined method", args.method);
                    return {
                        Amount: 0
                    };
                }
            }
        } catch (err) {
            console.error(err);
            throw err;
        }
    }

    private async initApi(data: IMInitData) {
        const bankGroupRequest: IMBankGroupSetRequest = {
            Id: data.userId.toString(),
            Currency: data.currency ? data.currency : Currencies.USD
        };

        await this.jsonClient.setBankGroup(data.projectId, bankGroupRequest);

        const setPlayerRequest: IMPlayerSetRequest = {
            Id: data.userId.toString(),
            BankGroupId: data.userId.toString()
        };

        await this.jsonClient.setPlayer(data.projectId, setPlayerRequest);
    }

    private async balanceCallback(data: IMBalanceGetData): Promise<IMBalanceGetResponse> {
        let amount = await CommonCasino.GetUserBalance(toNumber(data.PlayerId));
        amount = round(amount * 100);
        return {
            Amount: amount
        };
    }

    private async betCallback(data: IMBalanceChangeData): Promise<IMBalanceChangeResponse> {
        try {
            const betOperation = data.Operations.find(i => i.Type === OperationType.BET);
            const winOperation = data.Operations.find(i => i.Type === OperationType.WIN || i.Type === OperationType.WIN_LOWER);
            const betType = this.getBetType(data.Context.BetType);
            const session = await SessionModel.findByToken(data.Context.SessionAlternativeId);
            if (!session) throw ErrorUtil.newError(ErrorCodes.SESSION_NOT_FOUND);

            if (betOperation) {
                // place bet
                const betResponse = await this.processBet(betOperation.Amount, session, data.Context.EventId, betType, isNil(winOperation));
                // if there is win process win for that bet
                return winOperation ? this.processWin(winOperation.Amount, data.Context.EventId) : betResponse;
            } else if (!betOperation && winOperation) {
                // free spin won
                // get last bet in this game by this user and apply all free spin won on that bet
                const bet = await CommonCasino.GetLastBetByUserAndGame(toNumber(data.PlayerId), data.Context.GameId);
                if (!bet) throw ErrorUtil.newError(ErrorCodes.CASINO_BET_NOT_FOUND);
                return this.processWin(winOperation.Amount, toNumber(bet.external_action_id));
            } else {
                const balance = await CommonCasino.GetUserBalance(session.user_id);
                return this.balanceResponse(balance, balance);
            }
        } catch (err) {
            if (toNumber(err) === ErrorCodes.INSUFFICIENT_BALANCE) {
                throw <IMError>{
                    code: ErrorCodes.INSUFFICIENT_BALANCE,
                    message: "Not enough money to continue playing"
                };
            }
            throw err;
        }
    }

    private async proceedBonusWin(data: IMBonusWinData) {
        // const winOperation = data.Operations.find(i => i.Type === OperationType.WIN || i.Type === OperationType.WIN_LOWER);
        const balance = await CommonCasino.GetUserBalance(Number(data.PlayerId));
        return this.balanceResponse(balance, balance);
    }

    private async processBet(amount: number, session: SessionModel, eventId: number, betType: CasinoBetType, isLostBet: boolean) {
        const bet = await CommonCasino.PlaceBet(round(amount / 100, 2), session, betType, eventId.toString());
        if (isLostBet) await bet.setLostImmediate();
        return this.balanceResponse(bet.balance_before, bet.balance_after);
    }

    private async processWin(amount: number, eventId: number) {
        const winAmt = round(amount / 100, 2);
        const casinoBet = await CasinoBet.findOne({ external_action_id: eventId.toString() });
        if (!casinoBet) throw ErrorUtil.newError(ErrorCodes.CASINO_BET_NOT_FOUND);
        const balanceBefore = await CommonCasino.GetUserBalance(casinoBet.user_id);
        await CommonCasino.ProcessWin(casinoBet, winAmt, CasinoID.MASCOT, eventId.toString());
        const balanceAfter = await CommonCasino.GetUserBalance(casinoBet.user_id);
        return this.balanceResponse(balanceBefore, balanceAfter);
    }

    private balanceResponse(before: number, after: number) {
        return { BalanceBefore: round(before * 100), BalanceAfter: round(after * 100) };
    }

    private getBetType(game: BetType): CasinoBetType {
        switch (game) {
            case BetType.SPIN:
                return CasinoBetType.SPIN;
            case BetType.FREESPIN:
                return CasinoBetType.FREE_SPIN;
            case BetType.RESPIN:
                return CasinoBetType.RE_SPIN;
            case BetType.BONUS:
            case BetType.BONUSACTION:
                return CasinoBetType.BONUS_SPIN;
            default:
                return CasinoBetType.SPIN;
        }
    }
}
