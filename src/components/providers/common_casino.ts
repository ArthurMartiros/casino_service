import { CasinoBet } from "../casino_bet/models/casino_bet.model";
import { ITransactionModel } from "../../../../CoreService/src/components/transactions/interfaces/transaction.interface";
import { CommunicationCodes } from "../../../../CommonJS/src/messaging/CommunicationCodes";
import { broker, QueryBuilder } from "../../../../CommonJS/src/base/base.model";
import { MoneyType } from "../../../../CoreService/src/components/transactions/enums/money_type.enum";
import { TransactionType } from "../../../../CoreService/src/components/transactions/enums/transaction_type.enum";
import { SourceType } from "../../../../CommonJS/src/enums/source_type.enum";
import { TransactionStatus } from "../../../../CoreService/src/components/transactions/enums/transaction_status.enum";
import { v4 } from "uuid";
import { QueueType } from "../../../../CommonJS/src/messaging/QueueType";
import { CasinoBetStatus, CasinoBetType } from "../casino_bet/enums/casino_bet.enum";
import { ExchangeRateFilter } from "../../../../CoreService/src/components/exchange_rate/filters/exchange_rate.filter";
import { ErrorUtil, ErrorCodes } from "../../../../CommonJS/src/messaging/ErrorCodes";
import { round } from "lodash";
import { IUser } from "../../../../CoreService/src/components/users/interfaces/user.interface";
import { CasinoID } from "../casino/enums/casino.enum";
import { BonusWalletService } from "../bonus_wallet/services/bonus_wallet.service";
import { DEFAULT_CURRENCY } from "../../../../CommonJS/src/domain/constant";
import { ICasinoBet } from "../casino_bet/interfaces/casino_bet.interface";
import { ISessionModel } from "../session/interfaces/session.interface";
import { BonusWallet } from "../bonus_wallet/models/bonus_wallet.model";
import { BonusStatus } from "../../../../CoreService/src/components/bonuses/base/enums/bonus_status.enum";
import { IBonusWallet } from "../bonus_wallet/interfaces/bonus_wallet.interface";
import { each } from "bluebird";
import { CasinoTransaction } from "../casino_transaction/models/casino_transaction.model";
import { CasinoTransactionType } from "../casino_transaction/enums/casino_transaction.type";
import { ICasinoTransaction } from "../casino_transaction/interfaces/casino_transaction.interface";
import { CasinoGameModel } from "../casino_game/models/casino_game.model";
import { CasinoCategoryType } from "../casino_category/enums/casino_category.enum";
import { Transactional, trx } from "../../../../CommonJS/src/decorators/transaction.decorator";
import { User } from "../../../../CoreService/src/components/users/models/user.model";
import { UserStatus } from "../../../../CoreService/src/components/users/enums/user.status.enum";

export class CommonCasino {
    public static async ProcessWin(casinoBet: CasinoBet, wonAmount: number, casino_id: CasinoID, external_reference_number: string): Promise<number> {
        if (casinoBet.bonus_id) return CommonCasino.ProcessBonusWin(wonAmount, casinoBet);
        else return CommonCasino.ProcessRegularWin(casinoBet, wonAmount, casino_id, external_reference_number);
    }

    private static async ProcessRegularWin(casinoBet: CasinoBet, wonAmount: number, casino_id: CasinoID, external_reference_number: string): Promise<number> {
        if (!casinoBet.bonus_stake) {
            const trans = await broker.sendRequest<ITransactionModel>(
                CommunicationCodes.UPDATE_USER_BALANCE,
                <ITransactionModel>{
                    amount: wonAmount,
                    money_type_id: MoneyType.REAL,
                    user_id: casinoBet.user_id,
                    currency_id: casinoBet.currency_id,
                    type_id: TransactionType.WON,
                    product_id: casinoBet.casino_game_id,
                    channel_id: casinoBet.channel_id,
                    source_id: casino_id,
                    source_type_id: SourceType.CASINO,
                    status_id: TransactionStatus.SUCCESS,
                    code: v4(),
                    ip: casinoBet.ip,
                    ip_country: casinoBet.ip_country,
                    external_reference_number
                },
                QueueType.CORE_SERVICE
            );
            casinoBet.status_id = CasinoBetStatus.WON;
            casinoBet.won_amount += wonAmount;
            casinoBet.won_amount_usd += trans.amount_usd as number;
            casinoBet.real_won_amount = casinoBet.won_amount;
            casinoBet.real_won_amount_usd = casinoBet.won_amount_usd;
            casinoBet.balance_after_result = trans.balance_after as number;
            casinoBet.balance_after = trans.balance_after as number;
            casinoBet.balance_after_usd = trans.balance_after_usd as number;

            casinoBet.updated = new Date();
            await casinoBet.update();
            casinoBet.sendUpdateNotification();
            // return user new balance
            return trans.balance_after as number;
        } else {
            const rate = await CommonCasino.GetRate(casinoBet.currency_id);
            // apply bonus
            const bonusWonAmount = await BonusWalletService.UpdateWalletsWonAmounts(wonAmount, casinoBet);
            const realWonAmount = round((wonAmount * casinoBet.real_stake) / (casinoBet.real_stake + casinoBet.bonus_stake), 2);
            if (casinoBet.real_stake) {
                await broker.sendRequest<ITransactionModel>(
                    CommunicationCodes.UPDATE_USER_BALANCE,
                    <ITransactionModel>{
                        amount: realWonAmount,
                        money_type_id: MoneyType.REAL,
                        user_id: casinoBet.user_id,
                        currency_id: casinoBet.currency_id,
                        type_id: TransactionType.WON,
                        product_id: casinoBet.casino_game_id,
                        channel_id: casinoBet.channel_id,
                        source_id: casino_id,
                        source_type_id: SourceType.CASINO,
                        status_id: TransactionStatus.SUCCESS,
                        code: v4(),
                        ip: casinoBet.ip,
                        ip_country: casinoBet.ip_country,
                        external_reference_number
                    },
                    QueueType.CORE_SERVICE
                );
            }
            const user = await broker.sendRequest<IUser>(CommunicationCodes.GET_USER, { id: casinoBet.user_id }, QueueType.CORE_SERVICE);
            const bonusBalance = await BonusWalletService.GetBonusBalance(casinoBet.user_id);

            casinoBet.status_id = CasinoBetStatus.WON;
            casinoBet.bonus_won_amount += bonusWonAmount;
            casinoBet.real_won_amount += realWonAmount;
            casinoBet.real_won_amount_usd += round(realWonAmount * rate.rate, 2);
            casinoBet.won_amount += wonAmount;
            casinoBet.won_amount_usd += round(wonAmount * rate.rate, 2);
            casinoBet.balance_after_result = user.balance + bonusBalance;
            await casinoBet.update();
            BonusWalletService.UpdateBonusBalance(casinoBet.user_id, bonusBalance);
            return casinoBet.balance_after_result;
        }
    }

    private static async ProcessBonusWin(wonAmount: number, casinoBet: CasinoBet) {
        const rate = await CommonCasino.GetRate(casinoBet.currency_id);
        await BonusWalletService.UpdateWalletBalanceByBonusId(casinoBet.bonus_id, wonAmount);
        const balance = await CommonCasino.GetUserBalance(casinoBet.user_id);
        casinoBet.status_id = CasinoBetStatus.WON;
        casinoBet.bonus_won_amount += wonAmount;
        casinoBet.won_amount += wonAmount;
        casinoBet.won_amount_usd += round(wonAmount * rate.rate, 2);
        casinoBet.balance_after = balance;
        casinoBet.balance_after_result = balance;
        await casinoBet.update();
        return casinoBet.balance_after_result;
    }

    static async PlaceBet(
        amount: number,
        session: ISessionModel,
        betType: CasinoBetType,
        round_id: string,
        hash?: string,
        bonus_id?: number
    ): Promise<CasinoBet> {
        const blocked_user = await User.findOne({ id: session.user_id, status_id: UserStatus.BLOCKED });
        if (blocked_user) throw ErrorUtil.newError(ErrorCodes.BLOCKED_USER);
        const rate = await CommonCasino.GetRate(session.currency_id);
        const casinoGame = await CasinoGameModel.findOneById(session.casino_game_id);
        const bet = new CasinoBet(<ICasinoBet>{
            user_id: session.user_id,
            currency_id: session.currency_id,
            money_type_id: MoneyType.REAL,
            channel_id: session.channel_id,
            status_id: CasinoBetStatus.ACTIVE,
            ip: session.ip,
            ip_country: session.ip_country,
            provider_id: casinoGame.provider_id,
            external_action_id: round_id,
            casino_game_id: session.casino_game_id,
            created: new Date(),
            stake: round(amount, 2),
            stake_usd: round(amount * rate.rate, 2),
            won_amount: 0,
            won_amount_usd: 0,
            website_id: session.website_id,
            bet_type_id: betType,
            session_id: session.id,
            balance_before: await CommonCasino.GetUserBalance(session.user_id),
            hash,
            bonus_id
        });

        let missingAmount = round(amount, 2);
        let bonusBalance,
            balance = 0;
        const wallets = await this.getWalletsForUpdate(session.user_id);
        // calculate initial bonus balance
        bonusBalance = wallets.map(w => w.balance).reduce((a, b) => a + b, 0);
        let bonusStake = round(amount, 2);
        let realStake = amount - bonusBalance;
        if (realStake > 0) bonusStake = bonusBalance;
        else realStake = 0;
        bet.real_stake = realStake;
        bet.real_stake_usd = round(realStake * rate.rate, 2);
        bet.bonus_stake = bonusStake;
        // save bet
        await bet.saveWithID();
        // update wallets and save casino transactions
        let amountFromWallet: number = 0;
        await each(wallets, async wallet => {
            if (!missingAmount) return;
            ({ missingAmount, amountFromWallet } = this.calculateAmount(missingAmount, wallet, amountFromWallet));
            await BonusWalletService.UpdateWalletBalance(wallet.id as number, -1 * amountFromWallet);
            await this.saveCasinoTransaction(amountFromWallet, wallet, bet.id as number, session);
        });
        // calc bonus balance
        bonusBalance -= bonusStake;
        // if bonus is not enough take from real balance
        if (missingAmount > 0) {
            const trans = await this.createTransaction(missingAmount, session);
            await this.updateCasinoBetWithRealStake(trans, bet.id as number);
            balance = trans.balance_after as number;
        } else {
            const user = await broker.sendRequest<IUser>(CommunicationCodes.GET_USER, { id: session.user_id }, QueueType.CORE_SERVICE);
            balance = bonusBalance + user.balance;
        }
        await bet.update({ balance_after: balance });
        // if everything went well convert money
        await BonusWalletService.ConvertToReal(session.user_id, session.channel_id);
        await BonusWalletService.UpdateBonusBalance(session.user_id, bonusBalance);
        // return bet
        return bet;
    }

    public static async BetReverse(casinoBet: CasinoBet, casino_id: CasinoID, external_reference_number: string): Promise<void> {
        // rollback bonus
        if (casinoBet.status_id === CasinoBetStatus.BET_REVERSE) return;
        casinoBet.status_id = CasinoBetStatus.BET_REVERSE;
        casinoBet.updated = new Date();
        await casinoBet.update();

        await BonusWalletService.RollbackBet(casinoBet.id as number, casinoBet.bonus_stake, casinoBet.bonus_won_amount);

        if (casinoBet.real_won_amount) {
            await broker.sendRequest<ITransactionModel>(
                CommunicationCodes.UPDATE_USER_BALANCE,
                <ITransactionModel>{
                    amount: casinoBet.real_won_amount,
                    money_type_id: MoneyType.REAL,
                    user_id: casinoBet.user_id,
                    currency_id: casinoBet.currency_id,
                    type_id: TransactionType.WON_REVERSE,
                    channel_id: casinoBet.channel_id,
                    product_id: casinoBet.casino_game_id,
                    source_id: casino_id,
                    source_type_id: SourceType.CASINO,
                    status_id: TransactionStatus.SUCCESS,
                    external_reference_number,
                    code: v4(),
                    ip: casinoBet.ip,
                    ip_country: casinoBet.ip_country
                },
                QueueType.CORE_SERVICE
            );
        }

        if (casinoBet.real_stake) {
            await broker.sendRequest<ITransactionModel>(
                CommunicationCodes.UPDATE_USER_BALANCE,
                <ITransactionModel>{
                    amount: casinoBet.real_stake,
                    money_type_id: MoneyType.REAL,
                    user_id: casinoBet.user_id,
                    currency_id: casinoBet.currency_id,
                    type_id: TransactionType.BET_REVERSE,
                    channel_id: casinoBet.channel_id,
                    product_id: casinoBet.casino_game_id,
                    source_id: casino_id,
                    source_type_id: SourceType.CASINO,
                    status_id: TransactionStatus.SUCCESS,
                    external_reference_number,
                    code: v4(),
                    ip: casinoBet.ip,
                    ip_country: casinoBet.ip_country
                },
                QueueType.CORE_SERVICE
            );
        }
    }

    private static async createTransaction(amount: number, session: ISessionModel): Promise<ITransactionModel> {
        return broker.sendRequest<ITransactionModel>(
            CommunicationCodes.UPDATE_USER_BALANCE,
            <ITransactionModel>{
                amount: amount,
                money_type_id: MoneyType.REAL,
                user_id: session.user_id,
                currency_id: session.currency_id,
                type_id: TransactionType.BET,
                product_id: session.casino_game_id,
                channel_id: session.channel_id,
                source_id: CasinoID.EVOPLAY,
                source_type_id: SourceType.CASINO,
                status_id: TransactionStatus.SUCCESS,
                code: v4(),
                ip: session.ip,
                ip_country: session.ip_country
            },
            QueueType.CORE_SERVICE
        );
    }

    @Transactional()
    private static async updateCasinoBetWithRealStake(trans: ITransactionModel, bet_id: number) {
        await trx()
            .table(CasinoBet.tableName)
            .update({
                balance_after: trans && trans.balance_after ? trans.balance_after : 0,
                balance_after_usd: trans && trans.balance_after_usd ? trans.balance_after_usd : 0,
                balance_before: trans && trans.balance_before ? trans.balance_before : 0,
                balance_before_usd: trans && trans.balance_before_usd ? trans.balance_before_usd : 0
            })
            .where({ id: bet_id });
    }

    private static calculateAmount(missingAmount: number, wallet: BonusWallet, amountFromWallet: number) {
        if (round(missingAmount - wallet.balance, 2) > 0) {
            amountFromWallet = wallet.balance;
            missingAmount = round(missingAmount - wallet.balance, 2);
        } else {
            amountFromWallet = missingAmount;
            missingAmount = 0;
        }
        return { missingAmount, amountFromWallet };
    }

    private static async saveCasinoTransaction(amountFromWallet: number, wallet: BonusWallet, bet_id: number, session: ISessionModel) {
        await new CasinoTransaction(<ICasinoTransaction>{
            amount: amountFromWallet,
            balance_after: wallet.balance,
            balance_before: wallet.balance - amountFromWallet,
            bet_id,
            user_id: session.user_id,
            wallet_id: wallet.id,
            bet_type_id: CasinoTransactionType.BET
        }).saveWithID();
    }

    @Transactional()
    private static async getWalletsForUpdate(user_id: number) {
        return ((await trx()
            .table(BonusWallet.tableName)
            .where({ user_id, status_id: BonusStatus.ACTIVE })
            .where("balance", ">", 0)
            .forUpdate()) as IBonusWallet[]).map(w => new BonusWallet(w));
    }

    static async GetUserBalance(user_id: number) {
        const user = await broker.sendRequest<IUser>(CommunicationCodes.GET_USER, { id: user_id }, QueueType.CORE_SERVICE);
        const bonus = await BonusWalletService.GetBonusBalance(user_id);
        return round(user.balance + bonus, 2);
    }

    static async GetLastBetByUserAndGame(user_id: number, game_id: string) {
        return CasinoBet.oneOrNone(
            QueryBuilder(CasinoBet.tableName)
                .join(CasinoGameModel.tableName, `${CasinoGameModel.tableName}.id`, `${CasinoBet.tableName}.casino_game_id`)
                .where(`${CasinoGameModel.tableName}.game_id`, game_id)
                .where({ user_id })
                .orderBy(`${CasinoBet.tableName}.id`, "desc")
                .select(`${CasinoBet.tableName}.*`)
                .limit(1)
        );
    }

    static async GetRate(from: number) {
        if (from === DEFAULT_CURRENCY) return { rate: 1 };
        const rate = await ExchangeRateFilter.findOne({ from, to: DEFAULT_CURRENCY });
        if (!rate) throw ErrorUtil.newError(ErrorCodes.CURRENCY_NOT_SUPPORTED);
        return rate;
    }
}

export function GetCasinoGameCategory(type: string) {
    switch (type.toLowerCase()) {
        case "slots":
        case "video slots":
        case "classic slots":
            return CasinoCategoryType.SLOTS;
        case "table":
            return CasinoCategoryType.TABLE_GAMES;
        case "roulette":
            return CasinoCategoryType.ROULETTE;
        case "keno":
            return CasinoCategoryType.KENO;
        case "scratch card":
            return CasinoCategoryType.SCRATCH_CARD;
        case "baccarat":
        case "baccarat new":
            return CasinoCategoryType.BACCARAT;
        case "blackjack":
            return CasinoCategoryType.BLACKJACK;
        case "poker":
        case "video poker":
            return CasinoCategoryType.POKER;
        case "videobingos":
            return CasinoCategoryType.VIDEOBINGOS;
        case "lottery":
            return CasinoCategoryType.LOTTERY;
        case "multihand poker":
            return CasinoCategoryType.MULTIHAND_POKER;
        case "soft games":
            return CasinoCategoryType.SOFT_GAMES;
        case "pyramid poker":
            return CasinoCategoryType.PYRAMID_POKER;
        default:
            console.log(type);
            return undefined;
    }
}
