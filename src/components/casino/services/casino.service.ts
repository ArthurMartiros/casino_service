import { ServiceWithRequestInfo } from "../../../../../CommonJS/src/components/service_with_request_info/service_with_request_info";
import { ErrorUtil, ErrorCodes } from "../../../../../CommonJS/src/messaging/ErrorCodes";
import { IGameLimitRequest, IStartGame, ICasinoList } from "../interfaces/casino.interface";
import { cloneDeep, isNumber, round } from "lodash";
import { CasinoGameModel } from "../../casino_game/models/casino_game.model";
import * as md5 from "md5";
import { isNotNumber, isRealString } from "../../../../../CommonJS/src/utils/validators";
import { QueryBuilder, broker } from "../../../../../CommonJS/src/base/base.model";
import { WebsiteCasinoModel } from "../../website_casino/models/website_casino.model";
import { CasinoExtraSpin } from "../../casino_extra_spin/models/casino_extra_spin.model";
import { CasinoExtraSpinType } from "../../casino_extra_spin/enums/casino_extra_spin.enum";
import { GamingStatus } from "../../../../../CoreService/src/components/users/enums/user.gaming_status.enum";
import { IStartGameRequest } from "../interfaces/common.interface";
import { SessionModel } from "../../session/models/session.model";
import { CasinoProvider } from "../factory/casino.factory";
import { WebsiteModel } from "../../../../../CoreService/src/components/website/models/website.model";
import { ExtractRootDomain } from "../../../../../CommonJS/src/utils/domain.util";
import { CasinoBet } from "../../casino_bet/models/casino_bet.model";
import { map } from "bluebird";
import { CurrencyModel } from "../../../../../CoreService/src/components/currencies/models/currency.model";
import { v4 } from "uuid";
import { queueRequest } from "../../../../../CommonJS/src/utils/http.util";
import { CommunicationCodes } from "../../../../../CommonJS/src/messaging/CommunicationCodes";
import { QueueType } from "../../../../../CommonJS/src/messaging/QueueType";
import { IUser } from "../../../../../CoreService/src/components/users/interfaces/user.interface";
import { CONFIG } from "../../../../../CommonJS/src/utils/utils";
import { BonusWalletService } from "../../bonus_wallet/services/bonus_wallet.service";
import { CommonCasino } from "../../providers/common_casino";
import { CasinoID } from "../enums/casino.enum";

const config = CONFIG();
export class CasinoService extends ServiceWithRequestInfo {
    public async startGame(request: IStartGameRequest, ip: string): Promise<IStartGame> {
        if (isNotNumber(request.casino_game_id)) throw ErrorUtil.newError(ErrorCodes.CASINO_GAME_NOT_FOUND);
        const requestInfo = cloneDeep(this.requestInfo);
        let website_id = requestInfo.website_id;
        let channel_id = requestInfo.channel_id;
        if (!request.token) request.token = "";

        // increment play count
        const casinoGame = await CasinoGameModel.oneOrNone(
            QueryBuilder.table(CasinoGameModel.tableName)
                .increment("play_count")
                .where({ id: request.casino_game_id })
                .returning("*")
        );
        if (!casinoGame) throw ErrorUtil.newError(ErrorCodes.CASINO_GAME_NOT_FOUND);
        if (request.user && !request.demo) {
            const user = request.user;
            const currency = await CurrencyModel.findOne({ id: user.currency_id });
            if (!currency) throw ErrorUtil.newError(ErrorCodes.INVALID_CURRENCY);
            request.currency = currency.code;
            // if casino game not found return
            if (user.gaming_status === GamingStatus.BLOCKED) throw ErrorUtil.newError(ErrorCodes.GAMING_BLOCKED);
            // check for bonus spin
            const extraSpin = await CasinoExtraSpin.oneOrNone(`
            select * from ${CasinoExtraSpin.tableName} 
            where user_id = ${user.id} 
            and left_spins > 0
            and type_id in (${CasinoExtraSpinType.FREE_SPIN}, ${CasinoExtraSpinType.BONUS_SPIN})
            and casino_game_id = ${request.casino_game_id} order by id desc limit 1`);
            // get bonus balance
            const bonusBalance = await BonusWalletService.GetBonusBalance(user.id);
            // if no bonus spin and balance throw exception
            if (bonusBalance <= 0 && user.balance <= 0 && !extraSpin && !request.demo) throw ErrorUtil.newError(ErrorCodes.INSUFFICIENT_BALANCE);
            if (!user.currency_id) throw ErrorUtil.newError(ErrorCodes.INVALID_CURRENCY);
            const session = new SessionModel();
            await session.createStartSession(user.id, currency.id as number, currency.code, <number>casinoGame.id, request.token, ip, channel_id, website_id);
            if (request.token === "") {
                session.token = md5(session.id);
                request.token = session.token;
                await session.update();
            }
        }

        const websiteCasino = await WebsiteCasinoModel.findOne({ website_id, casino_id: casinoGame.provider_id });
        if (!websiteCasino) throw ErrorUtil.newError(ErrorCodes.CASINO_GAME_NOT_FOUND);
        // if exit url not found set website domain
        if ((!request.exit_url || !request.exit_url.length) && isNumber(requestInfo.website_id)) {
            const website = await WebsiteModel.findOne({ id: requestInfo.website_id });
            if (website) request.exit_url = "https://www." + ExtractRootDomain(website.domain);
        }

        return CasinoProvider(websiteCasino.casino_id).startGame({
            ...websiteCasino,
            ...requestInfo,
            casino_game_id: request.casino_game_id,
            user: request.user,
            user_id: request.user ? request.user.id : 0,
            settings: {
                exit_url: request.exit_url,
                https: 1
            },
            exit_url: request.exit_url,
            demo: request.demo,
            token: request.token,
            currency: request.currency,
            casinoGame: casinoGame
        });
    }

    public async getCasinoGameLimits(request: IGameLimitRequest) {
        const game = await CasinoGameModel.findOne({ id: request.casino_game_id });
        if (!game) throw ErrorUtil.newError(ErrorCodes.NOT_FOUND);
        const casinoProvider = CasinoProvider(game.provider_id as number);
        return casinoProvider.getLimits(request);
    }

    static async SendGGR(date_from?: Date, date_to?: Date) {
        if (process.env.NODE_ENV !== "production") return;
        const toDate = new Date(date_to || new Date());
        toDate.setDate(toDate.getDate() - 1);
        toDate.setUTCHours(23, 59, 59, 999);

        const fromDate = new Date(date_from || new Date());
        fromDate.setDate(fromDate.getDate() - 1);
        fromDate.setUTCHours(0, 0, 0, 0);
        const query = `select sum(casino_bet.real_stake - casino_bet.real_won_amount) as won_amount, casino_bet.user_id, casino_bet.date 
        from casino_bet 
        where casino_bet.date between '${fromDate.toISOString()}' and '${toDate.toISOString()}'
        group by casino_bet.user_id, casino_bet.date;`;
        const ggrs = await CasinoBet.manyOrNone(query);
        await map(
            ggrs,
            async ggr => {
                if (!ggr.won_amount) return;
                const user = await broker.sendRequest<IUser>(CommunicationCodes.GET_USER, { id: ggr.user_id }, QueueType.CORE_SERVICE);
                if (isRealString(user.affiliate_reference)) {
                    const currency = await CurrencyModel.findOne({ id: user.currency_id });
                    if (!currency) {
                        console.log(`currency not found: from ${user.currency_id}, to:1`);
                        return;
                    }
                    const rate = await CommonCasino.GetRate(user.currency_id);
                    if (!rate) {
                        console.log(`rate not found: from ${currency.id}, to:1`);
                        return;
                    }

                    const ggrDate = new Date(ggr.date || new Date());
                    ggrDate.setHours(23, 59, 59, 59);
                    const data = {
                        request_uuid: v4(),
                        campaign: user.affiliate_reference,
                        user_info: (user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username) || user.email,
                        datetime: ggrDate.toISOString(),
                        currency: currency.code,
                        player_id: user.id,
                        amount_raw: round(ggr.won_amount, 2),
                        amount_usd: round(rate.rate * ggr.won_amount, 2),
                        postback_type: "netgaming-rake-ggr",
                        clickid: user.clickid,
                        subid: user.subid
                    };
                    queueRequest(
                        config.Affiliate.URL,
                        {
                            Authorization: "Bearer 667d5de2-988e-47cf-b804-b49097cb4da2"
                        },
                        "POST",
                        data
                    )
                        .then(data => {
                            broker.publishMessage(JSON.stringify(data), "affiliate_response");
                        })
                        .catch(err => {
                            broker.publishMessage(
                                JSON.stringify({
                                    id: data.request_uuid,
                                    error: err
                                }),
                                "affiliate_exception"
                            );
                        });
                    //
                    broker.publishMessage(JSON.stringify(data), "affiliate");
                }
            },
            { concurrency: 1 }
        );
    }

    public async list(): Promise<ICasinoList[]> {
        return [
            {
                id: CasinoID.EVOPLAY,
                name: CasinoID[CasinoID.EVOPLAY]
            },
            {
                id: CasinoID.SLOTEGRATOR_BETGAMES,
                name: CasinoID[CasinoID.SLOTEGRATOR_BETGAMES]
            },
            {
                id: CasinoID.SLOTEGRATOR_BETSOFT,
                name: CasinoID[CasinoID.SLOTEGRATOR_BETSOFT]
            },
            {
                id: CasinoID.SLOTEGRATOR_PLAYSON,
                name: CasinoID[CasinoID.SLOTEGRATOR_PLAYSON]
            },
            {
                id: CasinoID.SLOTEGRATOR_SPINOMENAL,
                name: CasinoID[CasinoID.SLOTEGRATOR_SPINOMENAL]
            },
            {
                id: CasinoID.SLOTEGRATOR_IGROSOFT,
                name: CasinoID[CasinoID.SLOTEGRATOR_IGROSOFT]
            },
            {
                id: CasinoID.SLOTEGRATOR_REDRAKE,
                name: CasinoID[CasinoID.SLOTEGRATOR_REDRAKE]
            },
            {
                id: CasinoID.SLOTEGRATOR_GAMEART,
                name: CasinoID[CasinoID.SLOTEGRATOR_GAMEART]
            },
            {
                id: CasinoID.SLOTEGRATOR_HABANERO,
                name: CasinoID[CasinoID.SLOTEGRATOR_HABANERO]
            },
            {
                id: CasinoID.SLOTEGRATOR_PLATIPUS,
                name: CasinoID[CasinoID.SLOTEGRATOR_PLATIPUS]
            },
            {
                id: CasinoID.SLOTEGRATOR_VIVOGAMING,
                name: CasinoID[CasinoID.SLOTEGRATOR_VIVOGAMING]
            },
            {
                id: CasinoID.SLOTEGRATOR_TOMHORN,
                name: CasinoID[CasinoID.SLOTEGRATOR_TOMHORN]
            },
            {
                id: CasinoID.SLOTEGRATOR_ENDORPHINA,
                name: CasinoID[CasinoID.SLOTEGRATOR_ENDORPHINA]
            },
            {
                id: CasinoID.SLOTEGRATOR_AMATIC,
                name: CasinoID[CasinoID.SLOTEGRATOR_AMATIC]
            },
            {
                id: CasinoID.SLOTEGRATOR_BOOONGO,
                name: CasinoID[CasinoID.SLOTEGRATOR_BOOONGO]
            },
            {
                id: CasinoID.SLOTEGRATOR_MICROGAMING,
                name: CasinoID[CasinoID.SLOTEGRATOR_MICROGAMING]
            },
            {
                id: CasinoID.SLOTEGRATOR_BIG_TIME_GAMING,
                name: CasinoID[CasinoID.SLOTEGRATOR_BIG_TIME_GAMING]
            },
            {
                id: CasinoID.GAMSHY,
                name: CasinoID[CasinoID.GAMSHY]
            },
            {
                id: CasinoID.MASCOT,
                name: CasinoID[CasinoID.MASCOT]
            },
            {
                id: CasinoID.PRAGMATIC,
                name: CasinoID[CasinoID.PRAGMATIC]
            },
            {
                id: CasinoID.SLOTEGRATOR_DLV,
                name: CasinoID[CasinoID.SLOTEGRATOR_DLV]
            },
            {
                id: CasinoID.B2BSLOTS,
                name: CasinoID[CasinoID.B2BSLOTS]
            }
        ];
    }
}
