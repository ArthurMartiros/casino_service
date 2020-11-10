import { ICasinoProvider, IGameLimit, IStartGame, IGameLimitRequest } from "../../../casino/interfaces/casino.interface";
import { ErrorUtil, ErrorCodes } from "../../../../../../CommonJS/src/messaging/ErrorCodes";
import { IWebsiteCasinoModel } from "../../../website_casino/interfaces/website_casino.interface";
import { postFormDataRequest, getRequest, isSameSign } from "./utils";
import {
    ISGGame,
    ISGStartGame,
    ISGCallbackBase,
    ISGBetCallback,
    ISGWinCallback,
    ISGRefundCallback,
    ISGCallbackBaseResponse,
    ISGSessionCallbackResponse,
    ISGError,
    ISGSessionCallback
} from "../interfaces/sg_game.interface";
import { CasinoGameModel } from "../../../casino_game/models/casino_game.model";
import { each } from "bluebird";
import { isNotNumber } from "../../../../../../CommonJS/src/utils/validators";
import { CasinoGameStatus } from "../../../casino_game/enums/casino_game_status.enum";
import { CasinoGamesTranslationService } from "../../../casino_game_translation/services/casino_games_translation.service";
import { IRequestInfo } from "../../../../../../CommonJS/src/messaging/message.interface";
import { CurrencyModel } from "../../../../../../CoreService/src/components/currencies/models/currency.model";
import { User } from "../../../../../../CoreService/src/components/users/models/user.model";
import { GameTechnology } from "../../../casino_game/enums/game_technology.enum";
import { CasinoID } from "../../../casino/enums/casino.enum";
import { merge, toNumber, round } from "lodash";
import { CallbackAction, BetType } from "../enums/sg.enum";
import { SessionModel } from "../../../session/models/session.model";
import { broker } from "../../../../../../CommonJS/src/base/base.model";
import { CommunicationCodes } from "../../../../../../CommonJS/src/messaging/CommunicationCodes";
import { v4 } from "uuid";
import { QueueType } from "../../../../../../CommonJS/src/messaging/QueueType";
import { CasinoBetType, CasinoBetStatus } from "../../../casino_bet/enums/casino_bet.enum";
import { CasinoBet } from "../../../casino_bet/models/casino_bet.model";
import { CasinoExtraSpin } from "../../../casino_extra_spin/models/casino_extra_spin.model";
import { WebsiteCasinoModel } from "../../../website_casino/models/website_casino.model";
import { CONFIG } from "../../../../../../CommonJS/src/utils/utils";
import { IUser } from "../../../../../../CoreService/src/components/users/interfaces/user.interface";
import { ICurrencyModel } from "../../../../../../CoreService/src/components/currencies/interfaces/currency.interface";
import { ICasinoExtraSpin } from "../../../casino_extra_spin/interfaces/casino_extra_spin.interface";
import moment = require("moment");
import { CommonCasino, GetCasinoGameCategory } from "../../common_casino";
import { ITransactionModel } from "../../../../../../CoreService/src/components/transactions/interfaces/transaction.interface";

export class Slotegrator implements ICasinoProvider {
    private translationService = new CasinoGamesTranslationService();
    static BASE_URL: string = CONFIG().CasinoProviders.Slotegrator.URL;
    static async SelfValidate() {
        const websiteCasinoModel = await WebsiteCasinoModel.findOne({ casino_id: CasinoID.SLOTEGRATOR_AMATIC, website_id: 1 });
        if (!websiteCasinoModel) return;
        const gameURL = `${Slotegrator.BASE_URL}/self-validate`;
        const resp = await postFormDataRequest<IStartGame>(gameURL, {}, websiteCasinoModel.api_id, websiteCasinoModel.api_key);
        return resp;
    }

    async registerBonusSpin(data: ICasinoExtraSpin): Promise<void> {
        const casinoGame = await CasinoGameModel.findOne({ id: data.casino_game_id });
        if (!casinoGame) throw ErrorUtil.newError(ErrorCodes.CASINO_GAME_NOT_FOUND);

        const websiteCasino = await WebsiteCasinoModel.findOne({ casino_id: casinoGame.provider_id, website_id: data.website_id });
        if (!websiteCasino) throw ErrorUtil.newError(ErrorCodes.CASINO_GAME_NOT_FOUND);

        const user = await User.findOneById(data.user_id);
        const currency = await CurrencyModel.findOne({ id: user.currency_id });
        if (!currency) return;
        const link = `${Slotegrator.BASE_URL}/freespins/set`;
        const validTo = new Date();
        validTo.setDate(validTo.getDate() + 7);
        await postFormDataRequest<string>(
            link,
            {
                player_id: user.id,
                player_name: user.recipientInfo.name.replace(/ /g, ""),
                currency: currency.code,
                quantity: data.spins_total,
                valid_from: moment()
                    .utc()
                    .unix(),
                valid_until: moment(validTo)
                    .utc()
                    .unix(),
                freespin_id: data.id,
                bet_id: data.bet_id,
                denomination: data.denomination,
                game_uuid: casinoGame.game_id
            },
            websiteCasino.api_id as string,
            websiteCasino.api_key as string
        );
    }

    async startGame(data: ISGStartGame): Promise<IStartGame> {
        const casinoGame = <CasinoGameModel>await CasinoGameModel.findOne({ id: data.casino_game_id });
        if (casinoGame.has_lobby) {
        } else {
            let gameInfo = {
                game_uuid: casinoGame.game_id,
                return_url: data.settings.exit_url
            };
            if (!data.demo) {
                const currency = <CurrencyModel>await CurrencyModel.findOne({ id: data.user.currency_id });
                if (!currency) throw ErrorUtil.newError(ErrorCodes.CURRENCY_NOT_SUPPORTED);
                gameInfo = merge(gameInfo, {
                    player_id: data.user.id,
                    player_name: (new User(data.user).recipientInfo.name as string).replace(/ /g, ""),
                    currency: currency.code,
                    session_id: data.token
                });
            }
            const gameURL = data.demo ? `${Slotegrator.BASE_URL}/games/init-demo` : `${Slotegrator.BASE_URL}/games/init`;
            return postFormDataRequest<IStartGame>(gameURL, gameInfo, data.api_id, data.api_key);
        }
        return {
            url: ""
        };
    }

    async refreshGames(websiteCasinoModel: IWebsiteCasinoModel, requestInfo: IRequestInfo): Promise<void> {
        if (!websiteCasinoModel) throw ErrorUtil.newError(ErrorCodes.NOT_FOUND);
        const providerGames = await this.getGames(websiteCasinoModel);
        // compare games, save new ones
        await each(providerGames, async providerGame => {
            // get old game
            const provider = this.getProvider(providerGame.provider);
            const tech = this.getTechnology(providerGame.technology);
            let game = await CasinoGameModel.findOne({
                name: providerGame.name,
                provider_id: provider,
                is_mobile: Boolean(providerGame.is_mobile),
                technology_id: tech
            });
            if (tech === GameTechnology.HTML5) {
                await CasinoGameModel.delete({
                    is_mobile: Boolean(providerGame.is_mobile),
                    provider_id: provider,
                    name: providerGame.name,
                    technology_id: GameTechnology.FLASH
                });
            } else if (tech === GameTechnology.FLASH) {
                const sameGameWithAnotherTechnology = await CasinoGameModel.findOne({
                    is_mobile: Boolean(providerGame.is_mobile),
                    provider_id: provider,
                    name: providerGame.name,
                    technology_id: GameTechnology.HTML5
                });
                if (sameGameWithAnotherTechnology) return sameGameWithAnotherTechnology;
            }
            // return existing game if exists
            if (game) {
                game.has_lobby = Boolean(providerGame.has_lobby);
                game.is_mobile = Boolean(providerGame.is_mobile);
                game.game_id = providerGame.uuid;
                game.name = providerGame.name;
                game.provider_id = this.getProvider(providerGame.provider);
                game.technology_id = this.getTechnology(providerGame.technology);
                return game.update();
            }
            // if game does not exists save new one
            game = await new CasinoGameModel({
                name: providerGame.name,
                game_id: providerGame.uuid,
                status_id: CasinoGameStatus.INACTIVE,
                has_lobby: Boolean(providerGame.has_lobby),
                is_mobile: Boolean(providerGame.is_mobile),
                category: GetCasinoGameCategory(providerGame.type),
                image_lg_url: providerGame.image,
                image_md_url: providerGame.image,
                image_sm_url: providerGame.image,
                provider_id: this.getProvider(providerGame.provider),
                technology_id: this.getTechnology(providerGame.technology)
            }).saveWithID();
            await this.translationService.setList(<number>game.id, [
                Object.assign(requestInfo, {
                    casino_game_id: <number>game.id,
                    name: providerGame.name
                })
            ]);
            return game;
        }).catch(err => {
            console.error(err);
            throw err;
        });
    }

    async getLimits(request: IGameLimitRequest): Promise<IGameLimit | undefined> {
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
        const link = `${Slotegrator.BASE_URL}/freespins/bets?game_uuid=${casinoGame.game_id}&currency=${currency.code}`;
        const data = await getRequest<string>(
            link,
            { game_uuid: casinoGame.game_id, currency: currency.code },
            websiteCasino.api_id as string,
            websiteCasino.api_key as string
        ).catch(async () => {
            casinoGame.free_spins = false;
            casinoGame.bonus_spins = false;
            await casinoGame.update();
            throw ErrorUtil.newError(ErrorCodes.FREE_SPINS_NOT_AVAILABLE_FOR_THIS_GAME);
        });
        if (!data) return;
        const games = JSON.parse(data) as {
            denominations: number[];
            bets: {
                bet_id: number;
                bet_per_line: number;
                lines: number;
            }[];
        };
        const limits = {
            denominations: { 1: [1] },
            bets: games.bets
        };

        games.denominations.map(d => (limits.denominations[d] = [1]));
        if (!Object.keys(limits.denominations).length) limits.denominations = { 1: [1] };
        return limits;
    }

    async callback(args: ISGSessionCallback): Promise<ISGCallbackBaseResponse | ISGError> {
        try {
            console.log(args);
            if (args.sign) {
                const websiteCasino = await WebsiteCasinoModel.findOne({ api_id: args.merchant });
                if (!websiteCasino) return this.sendResponse();
                if (!isSameSign(args, websiteCasino.api_key)) throw ErrorUtil.newError(ErrorCodes.BAD_REQUEST);
            }
            let data;
            switch (args.action) {
                case CallbackAction.BALANCE:
                    data = await this.balanceCallback(args);
                    break;
                case CallbackAction.BET:
                    data = await this.betCallback(args as ISGBetCallback);
                    break;
                case CallbackAction.WIN:
                    data = await this.winCallback(args as ISGWinCallback);
                    break;
                case CallbackAction.REFUND:
                    data = await this.refundCallback(args as ISGRefundCallback);
                    break;
                // case CallbackAction.ROLLBACK:
                // data = await this.rollbackCallback(args as ISGRollbackCallback);
                // break;
                default:
                    data = {
                        balance: 0
                    };
            }
            return data;
        } catch (err) {
            console.error(args.action, args.action);
            console.error(err);
            throw err;
        }
    }

    private async balanceCallback(data: ISGCallbackBase): Promise<ISGCallbackBaseResponse> {
        if (isNotNumber(data.player_id)) throw ErrorUtil.newError(ErrorCodes.BAD_REQUEST);
        const balance = await CommonCasino.GetUserBalance(toNumber(data.player_id));
        return {
            balance: balance
        };
    }

    private async betCallback(data: ISGBetCallback): Promise<ISGSessionCallbackResponse | ISGError> {
        const session = await SessionModel.findByToken(data.session_id).catch();
        if (!session) return this.sendResponse();
        // find for processed transaction
        const processed = await this.getProcessedTransaction(data.transaction_id);
        if (processed) return processed;
        // find currency
        const betType = this.getBetType(data.type);
        const bet = await CommonCasino.PlaceBet(
            data.amount,
            session,
            data.freespin_id ? CasinoBetType.BONUS_SPIN : betType,
            data.transaction_id,
            undefined,
            data.freespin_id
        ).then(
            data => data,
            err => {
                if (err === "INSUFFICIENT_BALANCE") {
                    return <ISGError>{
                        error_code: "INSUFFICIENT_FUNDS",
                        error_description: "Not enough money to continue playing"
                    };
                }
                console.error("error during bet");
                console.error(err);
                throw err;
            }
        );

        if ((bet as ISGError).error_code) return bet as ISGError;

        if (data.freespin_id) {
            const bonus = await CasinoExtraSpin.findOne({ id: data.freespin_id });
            if (bonus) await bonus.updateLeftSpin(data.quantity);
        }

        return this.sendResponse(await CommonCasino.GetUserBalance(session.user_id), v4());
    }

    private async winCallback(data: ISGWinCallback): Promise<ISGSessionCallbackResponse> {
        // find for processed transaction
        const processed = await this.getProcessedTransaction(data.transaction_id);
        if (processed) return processed;
        const casinoBet = await CommonCasino.GetLastBetByUserAndGame(toNumber(data.player_id), data.game_uuid);
        if (!casinoBet) return this.sendResponse();

        // find currency
        if (toNumber(data.amount) === 0 && data.type === "win") {
            let balance = await CommonCasino.GetUserBalance(casinoBet.user_id);
            casinoBet.setLostImmediate();
            return this.sendResponse(balance);
        }
        // update casino bet
        await CommonCasino.ProcessWin(casinoBet, data.amount, casinoBet.provider_id, data.transaction_id);
        let balance = await CommonCasino.GetUserBalance(casinoBet.user_id);
        // return user new balance
        return this.sendResponse(balance, v4());
    }

    private async refundCallback(data: ISGRefundCallback): Promise<ISGSessionCallbackResponse> {
        const session = await SessionModel.findByToken(data.session_id).catch(() => {});
        if (!session) return this.sendResponse();
        // find for processed transaction
        const processed = await this.getProcessedTransaction(data.transaction_id);
        if (processed) return processed;
        // update casino bet
        const casinoBet = await CasinoBet.findOne({ external_action_id: data.bet_transaction_id });
        if (!casinoBet) {
            const balance = await CommonCasino.GetUserBalance(session.user_id);
            return this.sendResponse(balance);
        }

        if (casinoBet.status_id === CasinoBetStatus.BET_REVERSE) {
            const balance = await CommonCasino.GetUserBalance(session.user_id);
            return this.sendResponse(balance);
        }
        await CommonCasino.BetReverse(casinoBet, casinoBet.provider_id, data.transaction_id);
        const balance = await CommonCasino.GetUserBalance(session.user_id);
        return this.sendResponse(round(balance, 2), v4());
    }

    private sendResponse(balance: number = 0, transaction_id: string = v4()): ISGSessionCallbackResponse {
        return {
            balance,
            transaction_id
        };
    }

    private async getProcessedTransaction(external_reference_number: string): Promise<ISGSessionCallbackResponse | undefined> {
        const oldTransction = await broker.sendRequest<ITransactionModel>(
            CommunicationCodes.GET_TRANSACTION,
            { external_reference_number, include_user: false },
            QueueType.CORE_SERVICE
        );
        if (!oldTransction) return;
        else {
            return this.sendResponse(<number>oldTransction.balance_after, oldTransction.code);
        }
    }

    private async getGames(
        websiteCasinoModel: IWebsiteCasinoModel,
        page: number = 1,
        link: string = `${Slotegrator.BASE_URL}/games/index?page=1`,
        allGames: ISGGame[] = []
    ): Promise<ISGGame[]> {
        const data = await getRequest<string>(link, { page }, websiteCasinoModel.api_id as string, websiteCasinoModel.api_key as string);
        const games = JSON.parse(data);
        allGames = allGames.concat(games.items);
        let currentPage = games._meta.currentPage;
        if (currentPage !== games._meta.pageCount) return this.getGames(websiteCasinoModel, currentPage + 1, games._links.next.href, allGames);
        return allGames;
    }

    private getTechnology(technology: string): GameTechnology {
        switch (technology.toLowerCase()) {
            case "flash":
                return GameTechnology.FLASH;
            case "html5":
                return GameTechnology.HTML5;
            case "html5/flash":
                return GameTechnology.BOTH;
        }
        return GameTechnology.HTML5;
    }

    private getProvider(provider: string): CasinoID {
        switch (provider) {
            case "Amatic":
                return CasinoID.SLOTEGRATOR_AMATIC;
            case "Endorphina":
                return CasinoID.SLOTEGRATOR_ENDORPHINA;
            case "Tomhorn":
                return CasinoID.SLOTEGRATOR_TOMHORN;
            case "Vivogaming":
                return CasinoID.SLOTEGRATOR_VIVOGAMING;
            case "Platipus":
                return CasinoID.SLOTEGRATOR_PLATIPUS;
            case "Habanero":
                return CasinoID.SLOTEGRATOR_HABANERO;
            case "GameArt":
                return CasinoID.SLOTEGRATOR_GAMEART;
            case "RedRake":
                return CasinoID.SLOTEGRATOR_REDRAKE;
            case "Igrosoft":
                return CasinoID.SLOTEGRATOR_IGROSOFT;
            case "Spinomenal":
                return CasinoID.SLOTEGRATOR_SPINOMENAL;
            case "Playson":
                return CasinoID.SLOTEGRATOR_PLAYSON;
            case "Betsoft":
                return CasinoID.SLOTEGRATOR_BETSOFT;
            case "Betgames":
                return CasinoID.SLOTEGRATOR_BETGAMES;
            case "Booongo":
                return CasinoID.SLOTEGRATOR_BOOONGO;
            case "Microgaming":
            case "Microgaming Branded":
                return CasinoID.SLOTEGRATOR_MICROGAMING;
            case "Big Time Gaming":
                return CasinoID.SLOTEGRATOR_BIG_TIME_GAMING;
            case "Dlv":
                return CasinoID.SLOTEGRATOR_DLV;
        }
        console.log("NEW PROVIDER:", provider);
        throw ErrorUtil.newError(ErrorCodes.UNKNOWN_PROVIDER);
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
