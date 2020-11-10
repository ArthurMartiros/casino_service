import { MethodGroupNames } from "../enums/common.enum";
import { MethodNames } from "../enums/game.enum";
import { IApiRequest, IEvoRequest, IEvoInitRequest } from "../interfaces/evoplay.interface";
import { ErrorCodes, ErrorUtil } from "../../../../../../CommonJS/src/messaging/ErrorCodes";
import { IGetUrlRequest, IGetListRequest, IGetListResponse, IGetGameInfoResponse, IGetAvailableBetsResponse } from "../interfaces/game.interface";
import { IRequestInfo } from "../../../../../../CommonJS/src/messaging/message.interface";
import { Host, HostName, Version } from "../../../website_casino/enums/website_casino.enum";
import { isNotNumber } from "../../../../../../CommonJS/src/utils/validators";
import { EvoplayUtilities, RequestUtilities } from "../utils/utils";
import { isUndefined } from "util";
import { CasinoGameModel } from "../../../casino_game/models/casino_game.model";
import { WebsiteCasinoModel } from "../../../website_casino/models/website_casino.model";
import { toNumber, min, round } from "lodash";
import { CurrencyModel } from "../../../../../../CoreService/src/components/currencies/models/currency.model";
import { ICasinoExtraSpin } from "../../../casino_extra_spin/interfaces/casino_extra_spin.interface";
import { CasinoExtraSpin } from "../../../casino_extra_spin/models/casino_extra_spin.model";
import { CasinoExtraSpinType } from "../../../casino_extra_spin/enums/casino_extra_spin.enum";
import { LanguageModel } from "../../../../../../CoreService/src/components/languages/models/language.model";
import { map } from "bluebird";
import { CasinoGameStatus } from "../../../casino_game/enums/casino_game_status.enum";
import { CasinoGamesTranslationService } from "../../../casino_game_translation/services/casino_games_translation.service";
import { IBetRequest, IWinRequest, IRefundRequest } from "../interfaces/callback.interface";
import { SessionName, ResponseStatus } from "../enums/casino.enum";
import { SessionModel } from "../../../session/models/session.model";
import { CasinoBetType } from "../../../casino_bet/enums/casino_bet.enum";
import { CasinoBet } from "../../../casino_bet/models/casino_bet.model";
import { SessionStatus } from "../../../session/enums/session.enum";
import { broker, QueryBuilder } from "../../../../../../CommonJS/src/base/base.model";
import { CasinoID } from "../../../casino/enums/casino.enum";
import { ICurrencyModel } from "../../../../../../CoreService/src/components/currencies/interfaces/currency.interface";
import { IGameLimitRequest, ICasinoProvider, IGameLimit, IStartGame } from "../../../casino/interfaces/casino.interface";
import * as qs from "querystring";
import * as md5 from "js-md5";
import { IWebsiteCasinoModel } from "../../../website_casino/interfaces/website_casino.interface";
import { CommunicationCodes } from "../../../../../../CommonJS/src/messaging/CommunicationCodes";
import { QueueType } from "../../../../../../CommonJS/src/messaging/QueueType";
import { GameTechnology } from "../../../casino_game/enums/game_technology.enum";
import { IUser } from "../../../../../../CoreService/src/components/users/interfaces/user.interface";
import * as moment from "moment";
import { EvoBonus } from "../enums/evo_bonus.enum";
import { CommonCasino } from "../../common_casino";
import { BonusStatus } from "../../../../../../CoreService/src/components/bonuses/base/enums/bonus_status.enum";
import { BonusWalletService } from "../../../bonus_wallet/services/bonus_wallet.service";

export class Evoplay implements ICasinoProvider {
    private translationService = new CasinoGamesTranslationService();

    private async betApi(request: IBetRequest) {
        const session = await SessionModel.findOne({ token: request.token });
        if (!session) throw ErrorUtil.newError(ErrorCodes.SESSION_NOT_FOUND);
        // save casino bet
        let bonus: ICasinoExtraSpin | undefined;
        const details = JSON.parse(request.data.details);
        if (details.extrabonus_type === EvoBonus.BONUS_SPIN)
            bonus = await this.getBonus(session.user_id, session.casino_game_id, CasinoExtraSpinType.BONUS_SPIN);
        else if (details.extrabonus_type === EvoBonus.START_FREE_SPIN)
            bonus = await this.getBonus(session.user_id, session.casino_game_id, CasinoExtraSpinType.FREE_SPIN);
        const oldBetWithSameRoundId = await CasinoBet.findOne({ external_action_id: request.data.round_id });
        // update left spin
        if (bonus && !oldBetWithSameRoundId) await bonus.updateLeftSpin();
        const bet =
            oldBetWithSameRoundId ||
            (await CommonCasino.PlaceBet(
                bonus ? 0 : request.data.amount,
                session,
                this.getBetType(details.game),
                request.data.round_id,
                undefined,
                bonus ? bonus.id : undefined
            ));
        bet.setLost();
        return {
            status: ResponseStatus.Ok,
            data: {
                balance: await CommonCasino.GetUserBalance(session.user_id),
                currency: session.currency_code
            }
        };
    }

    private async getBonus(user_id: number, casino_game_id: number, type: CasinoExtraSpinType) {
        return CasinoExtraSpin.oneOrNone(
            QueryBuilder(CasinoExtraSpin.tableName)
                .where({
                    user_id,
                    used: true,
                    type_id: type,
                    casino_game_id
                })
                .where("left_spins", ">", 0)
                .orderBy("id", "desc")
                .limit(1)
        );
    }

    private async initApi(request: IEvoInitRequest) {
        const session = await SessionModel.findOne({
            token: request.token,
            status: SessionStatus.OPEN
        });
        if (!session) throw ErrorUtil.newError(ErrorCodes.SESSION_NOT_FOUND);
        // find user
        const user = await broker.sendRequest<IUser>(CommunicationCodes.GET_USER, { id: session.user_id }, QueueType.CORE_SERVICE);
        if (!user) throw ErrorUtil.newError(ErrorCodes.USER_NOT_FOUND);
        const bonus = await BonusWalletService.GetBonusBalance(session.user_id);
        // find currency
        return {
            status: ResponseStatus.Ok,
            data: {
                balance: round(user.balance + bonus, 2),
                currency: session.currency_code
            }
        };
    }

    private async winApi(request: IWinRequest) {
        const session = await SessionModel.findOne({ token: request.token });
        if (!session) throw ErrorUtil.newError(ErrorCodes.SESSION_NOT_FOUND);

        const casinoBet = await CasinoBet.findOne({ external_action_id: request.data.round_id });
        if (!casinoBet) throw ErrorUtil.newError(ErrorCodes.NOT_FOUND);
        const balance = await CommonCasino.ProcessWin(casinoBet, toNumber(request.data.amount), CasinoID.EVOPLAY, request.data.action_id);
        return {
            status: ResponseStatus.Ok,
            data: {
                balance: round(balance, 2),
                currency: session.currency_code
            }
        };
    }

    private async refundApi(request: IRefundRequest) {
        const session = await SessionModel.findOne({ token: request.token });
        if (!session) throw ErrorUtil.newError(ErrorCodes.SESSION_NOT_FOUND);

        // update casino bet
        const casinoBet = await CasinoBet.findOne({ external_action_id: request.data.refund_round_id });
        if (!casinoBet) {
            return {
                status: ResponseStatus.Ok,
                data: {
                    balance: await CommonCasino.GetUserBalance(session.user_id),
                    currency: session.currency_code
                }
            };
        }
        await CommonCasino.BetReverse(casinoBet, CasinoID.EVOPLAY, request.data.refund_round_id);

        return {
            status: ResponseStatus.Ok,
            data: {
                balance: await CommonCasino.GetUserBalance(casinoBet.user_id),
                currency: session.currency_code
            }
        };
    }

    private getBetType(game): CasinoBetType {
        switch (game.action) {
            case "extrabonusspin":
                return CasinoBetType.BONUS_SPIN;
            case "freespin":
                return CasinoBetType.FREE_SPIN;
            case "spin":
                return CasinoBetType.SPIN;
            case "respin":
                return CasinoBetType.RE_SPIN;
            case "freerespin":
                return CasinoBetType.FREE_RE_SPIN;
            case "bonus":
                return CasinoBetType.TIP;
        }
        if (game.freespin) return CasinoBetType.FREE_SPIN;
        return CasinoBetType.SPIN;
    }

    private getHost(api_host?: Host): string {
        let host;
        if (isNotNumber(api_host)) throw ErrorUtil.newError(ErrorCodes.BAD_REQUEST);
        switch (api_host) {
            case Host.Europe:
                host = HostName.Europe;
                break;
            case Host.Asia:
                host = HostName.Asia;
                break;
            default:
                throw ErrorUtil.newError(ErrorCodes.BAD_REQUEST);
        }
        return `http://api.${host}`;
    }

    /**
     * @description Returns list of all available games.
     * @returns array list of available games
     */
    private async getList(request: IGetListRequest): Promise<IGetListResponse> {
        let response;
        const url = this.getHost(request.api_host);
        try {
            const signature: string = EvoplayUtilities.generateSignature(<number>request.api_project, <number>request.api_version, {}, <string>request.api_key);
            // tslint:disable-next-line:no-any
            const query: any = {
                project: request.api_project,
                version: request.api_version,
                signature: signature
            };
            if (!isUndefined(request.need_extra_data)) {
                query.need_extra_data = 1;
            }
            response = await RequestUtilities.get(`${url}/${MethodGroupNames.GAME}/${MethodNames.GET_LIST}`, { query });
            response = JSON.parse(response.body);
        } catch (error) {
            throw error;
        }
        return response;
    }

    private async getGameInfo(request: IEvoRequest): Promise<IGetGameInfoResponse> {
        if (isNotNumber(request.casino_game_id)) throw ErrorUtil.newError(ErrorCodes.CASINO_GAME_NOT_FOUND);
        let response;
        const url = this.getHost(request.api_host);
        try {
            const signature: string = EvoplayUtilities.generateSignature(
                request.api_project,
                request.api_version,
                { [request.casino_game_id]: undefined },
                request.api_key
            );
            // tslint:disable-next-line:no-any
            const query: any = {
                project: request.api_project,
                version: request.api_version,
                signature: signature,
                game: request.casino_game_id
            };
            response = await RequestUtilities.get(`${url}/${MethodGroupNames.GAME}/${MethodNames.GET_GAME_INFO}`, { query });
            response = JSON.parse(response.body);
        } catch (error) {
            throw error;
        }
        return response;
    }

    private async getAvailableBets(request: IEvoRequest): Promise<IGetAvailableBetsResponse> {
        if (isNotNumber(request.casino_game_id)) throw ErrorUtil.newError(ErrorCodes.CASINO_GAME_NOT_FOUND);
        let response;
        const url = this.getHost(request.api_host);
        try {
            const signature: string = EvoplayUtilities.generateSignature(
                request.api_project,
                request.api_version,
                {
                    [request.casino_game_id]: undefined,
                    [<string>request.currency_code]: undefined
                },
                request.api_key
            );
            // tslint:disable-next-line:no-any
            const query: any = {
                project: request.api_project,
                version: request.api_version,
                signature: signature,
                game: request.casino_game_id,
                currency: request.currency_code
            };
            response = await RequestUtilities.get(`${url}/${MethodGroupNames.GAME}/${MethodNames.GET_AVAILABLE_BETS}`, { query });
            response = JSON.parse(response.body);
        } catch (error) {
            throw error;
        }
        return response;
    }

    private error(message, errorCode: ErrorCodes = ErrorCodes.BAD_REQUEST) {
        console.error(message);
        throw ErrorUtil.newError(errorCode);
    }

    public async callback(request: IApiRequest) {
        console.log(request.name);
        const data = await this.process(request);
        console.log(request.name, data);
        return data;
    }

    private process(request: IApiRequest) {
        switch (request.name) {
            case SessionName.Init:
                return this.initApi(<IEvoInitRequest>request);
            case SessionName.Bet:
                return this.betApi(<IBetRequest>request);
            case SessionName.Win:
                return this.winApi(<IWinRequest>request);
            case SessionName.Refund:
                return this.refundApi(<IRefundRequest>request);
            default:
                console.log(request.name);
                throw ErrorUtil.newError();
        }
    }

    public async startGame(request: IGetUrlRequest): Promise<IStartGame> {
        request.currency = "USD";
        request.return_url_info = 1;
        if (request.demo) request.token = "demo";
        const user = request.user;
        if (user && !request.demo) {
            const currency = await CurrencyModel.findOne({ id: user.currency_id });
            if (!currency) throw ErrorUtil.newError(ErrorCodes.INVALID_CURRENCY);
            request.currency = currency.code || "USD";
        }
        const casinoGame = await CasinoGameModel.findOne({ id: request.casino_game_id });
        if (!casinoGame) throw ErrorUtil.newError(ErrorCodes.CASINO_GAME_NOT_FOUND);

        request.callback_version = 2;
        const info = await this.getAvailableBets({
            api_project: request.api_project as number,
            api_version: request.api_version as Version,
            api_key: request.api_key as string,
            casino_game_id: toNumber(casinoGame.game_id),
            api_host: request.api_host as Host,
            currency_code: request.currency
        });
        if (!info.data) throw ErrorUtil.newError(ErrorCodes.BAD_REQUEST);
        request.denomination = min(Object.keys(info.data).map(i => toNumber(i))) || 1;
        const url = this.getHost(request.api_host);
        // get user bonuses
        let bonuses: ICasinoExtraSpin[] = [];
        if (request.user_id) {
            bonuses = await CasinoExtraSpin.manyOrNone(
                QueryBuilder(CasinoExtraSpin.tableName).where({
                    user_id: request.user_id,
                    used: false,
                    casino_game_id: casinoGame.id,
                    status_id: BonusStatus.ACTIVE
                })
            );
        }

        request.settings.extra_bonuses = {};
        let activeBonusSpin: ICasinoExtraSpin | undefined;
        let activeFreeSpin: ICasinoExtraSpin | undefined;
        if (bonuses.length) {
            // free spins
            activeFreeSpin = bonuses.find(b => b.type_id === CasinoExtraSpinType.FREE_SPIN);
            if (activeFreeSpin) {
                request.settings.extra_bonuses.freespins_on_start = {
                    freespins_count: activeFreeSpin.spins_total,
                    bet_in_money:
                        activeFreeSpin.bet_amount ||
                        round(
                            toNumber(activeFreeSpin.denomination) *
                                toNumber(activeFreeSpin.denomination_value) *
                                toNumber(activeFreeSpin.lines) *
                                toNumber(activeFreeSpin.bet_per_line),
                            2
                        )
                };

                if (activeFreeSpin.expire_date) {
                    request.settings.extra_bonuses_settings = {
                        expire: moment(activeFreeSpin.expire_date)
                            .utc(false)
                            .format("YYYY-MM-DD HH:mm:ss")
                    };
                }
            }
            // bonus spins
            activeBonusSpin = bonuses.find(b => b.type_id === CasinoExtraSpinType.BONUS_SPIN);
            if (activeBonusSpin) {
                request.settings.extra_bonuses.bonus_spins = {
                    spins_count: activeBonusSpin.spins_total,
                    bet_in_money:
                        activeBonusSpin.bet_amount ||
                        round(
                            toNumber(activeBonusSpin.denomination) *
                                toNumber(activeBonusSpin.denomination_value) *
                                toNumber(activeBonusSpin.lines) *
                                toNumber(activeBonusSpin.bet_per_line),
                            2
                        )
                };
                if (activeBonusSpin.expire_date) {
                    request.settings.extra_bonuses_settings = {
                        expire: moment(activeBonusSpin.expire_date)
                            .utc(false)
                            .format("YYYY-MM-DD HH:mm:ss")
                    };
                }
            }
        }
        //
        request.settings.language = LanguageModel.GetLanguageLocalization(request.lang_id);

        const bonusSpinArg = request.settings.extra_bonuses.bonus_spins
            ? `:${request.settings.extra_bonuses.bonus_spins.spins_count}` + `:${request.settings.extra_bonuses.bonus_spins.bet_in_money}`
            : ``;
        const freeSpinArg = request.settings.extra_bonuses.freespins_on_start
            ? `:${request.settings.extra_bonuses.freespins_on_start.freespins_count}` + `:${request.settings.extra_bonuses.freespins_on_start.bet_in_money}`
            : ``;

        const args =
            `${request.api_project}` +
            `*${request.api_version}` +
            `*${request.token.toString()}` +
            `*${casinoGame.game_id}` +
            `*${request.user_id}:${request.settings.exit_url}:${request.settings.language}:${request.settings.https}` +
            bonusSpinArg +
            freeSpinArg +
            `*${request.denomination}` +
            `*${request.currency}` +
            `*${request.return_url_info}` +
            `*${request.callback_version}` +
            `*${request.api_key}`;
        const signature = md5(args);

        let query = {
            project: request.api_project,
            version: request.api_version,
            signature: signature,
            token: request.token,
            game: casinoGame.game_id,
            settings: request.settings,
            denomination: request.denomination,
            currency: request.currency,
            return_url_info: request.return_url_info,
            callback_version: request.callback_version
        };

        const bonusSpin = request.settings.extra_bonuses.bonus_spins
            ? `&settings[extra_bonuses][bonus_spins][spins_count]=${request.settings.extra_bonuses.bonus_spins.spins_count}` +
              `&settings[extra_bonuses][bonus_spins][bet_in_money]=${request.settings.extra_bonuses.bonus_spins.bet_in_money}`
            : "";
        const freeSpin = request.settings.extra_bonuses.freespins_on_start
            ? `&settings[extra_bonuses][freespins_on_start][freespins_count]=${request.settings.extra_bonuses.freespins_on_start.freespins_count}` +
              `&settings[extra_bonuses][freespins_on_start][bet_in_money]=${request.settings.extra_bonuses.freespins_on_start.bet_in_money}`
            : "";

        const settings =
            `&settings[user_id]=${request.user_id}` +
            `&settings[exit_url]=${request.settings.exit_url}` +
            `&settings[language]=${request.settings.language}` +
            `&settings[https]=${request.settings.https}` +
            bonusSpin +
            freeSpin +
            `&denomination=${request.denomination}` +
            `&currency=${request.currency}` +
            `&return_url_info=${request.return_url_info}` +
            `&callback_version=${request.callback_version}`;
        const queryString = qs.stringify(query).replace("&settings=", settings);
        const response = await RequestUtilities.get(`${url}/${MethodGroupNames.GAME}/${MethodNames.GET_URL}?${queryString}`, {});
        const game = JSON.parse(response.body);
        if (game.status === "ok") {
            if (activeBonusSpin) {
                activeBonusSpin.used = true;
                await activeBonusSpin.update();
            }
            if (activeFreeSpin) {
                activeFreeSpin.used = true;
                await activeFreeSpin.update();
            }
        }
        return {
            url: game.data.link
        };
    }

    public async getLimits(request: IGameLimitRequest): Promise<IGameLimit> {
        const casinoGame = await CasinoGameModel.findOne({ id: request.casino_game_id });
        if (!casinoGame) throw ErrorUtil.newError(ErrorCodes.CASINO_GAME_NOT_FOUND);

        const websiteCasino = await WebsiteCasinoModel.findOne({ casino_id: casinoGame.provider_id, website_id: request.website_id });
        if (!websiteCasino) throw ErrorUtil.newError(ErrorCodes.CASINO_GAME_NOT_FOUND);

        // check currency
        let currency: ICurrencyModel | undefined = undefined;
        if (request.currency_code) {
            currency = await CurrencyModel.findOne({ code: request.currency_code });
        } else if (request.user_id) {
            const user = await broker.sendRequest<IUser>(CommunicationCodes.GET_USER, { id: request.user_id }, QueueType.CORE_SERVICE);
            currency = await CurrencyModel.findOne({ id: user.currency_id });
        }
        if (!currency) throw ErrorUtil.newError(ErrorCodes.INVALID_CURRENCY);
        const api = this;
        const betInfo = await api.getAvailableBets({
            api_project: <number>websiteCasino.api_project,
            api_host: <Host>websiteCasino.api_host,
            api_version: <Version>websiteCasino.api_version,
            api_key: <string>websiteCasino.api_key,
            casino_game_id: toNumber(casinoGame.game_id),
            currency_code: currency.code
        });

        const info = await api.getGameInfo({
            api_project: <number>websiteCasino.api_project,
            api_host: <Host>websiteCasino.api_host,
            api_version: <Version>websiteCasino.api_version,
            api_key: <string>websiteCasino.api_key,
            casino_game_id: toNumber(casinoGame.game_id)
        });
        const data = info.data;
        if (!data) throw ErrorUtil.newError(ErrorCodes.BAD_REQUEST);
        return <IGameLimit>{
            denominations: betInfo.data,
            bets: [
                {
                    bet_id: 0,
                    bet_per_line: 1,
                    lines: 1
                }
            ]
        };
    }

    public async refreshGames(websiteCasinoModel: IWebsiteCasinoModel, requestInfo: IRequestInfo) {
        if (!websiteCasinoModel) throw ErrorUtil.newError(ErrorCodes.NOT_FOUND);
        const getListOfGameRequest = await this.getList({
            api_project: websiteCasinoModel.api_project as number,
            api_host: websiteCasinoModel.api_host as number,
            api_version: websiteCasinoModel.api_version as number,
            api_key: websiteCasinoModel.api_key as string
        });
        if (!getListOfGameRequest || !getListOfGameRequest.data) throw this.error(`restApi is invalid`);

        const restCasinoGames = getListOfGameRequest.data;
        //
        const gamesId = Object.keys(restCasinoGames).map(k => toNumber(k));
        // get all games of casino for website
        const casinoGames = await CasinoGameModel.find({ provider_id: websiteCasinoModel.casino_id });
        // compare games, save new ones
        await map(gamesId, async game_id => {
            const restCasinoGame = restCasinoGames[game_id];
            // get old game
            let game = casinoGames.find(g => g.game_id === game_id.toString());
            // return existing game if exists
            if (game) {
                const info = await this.getGameInfo(<IEvoRequest>{
                    api_project: <number>websiteCasinoModel.api_project,
                    api_host: <Host>websiteCasinoModel.api_host,
                    api_version: <Version>websiteCasinoModel.api_version,
                    api_key: <string>websiteCasinoModel.api_key,
                    casino_game_id: toNumber(game.game_id)
                });
                if (info.data && Object.values(info.data.extra_bonuses_types).length) {
                    const oldGame = JSON.stringify(game);
                    const freeSpins = Object.values(info.data.extra_bonuses_types);
                    if (freeSpins.includes("freespins_on_start")) {
                        game.free_spins = true;
                        game.free_spins_count = info.data.available_freespins_count;
                    }
                    if (freeSpins.includes("bonus_spins")) {
                        game.bonus_spins = true;
                    }
                    if (oldGame !== JSON.stringify(game)) return game.update();
                }
                game.name = restCasinoGame.name;
                game.provider_id = CasinoID.EVOPLAY;
                return game;
            }
            // if game does not exists save new one
            game = await new CasinoGameModel({
                name: restCasinoGame.name,
                game_id: game_id.toString(),
                status_id: CasinoGameStatus.INACTIVE,
                provider_id: CasinoID.EVOPLAY,
                technology_id: GameTechnology.HTML5
            }).saveWithID();
            await this.translationService.setList(<number>game.id, [
                Object.assign(requestInfo, {
                    casino_game_id: <number>game.id,
                    name: restCasinoGame.name
                })
            ]);
            return game;
        });
    }

    async registerBonusSpin(): Promise<void> {}
}
