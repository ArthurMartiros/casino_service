import { BonusWallet } from "../models/bonus_wallet.model";
import { QueryBuilder, broker } from "../../../../../CommonJS/src/base/base.model";
import { round, uniq } from "lodash";
import { IBonusWallet, IBonusWalletFilter, IListWithPagination } from "../interfaces/bonus_wallet.interface";
import { BonusStatus } from "../../../../../CoreService/src/components/bonuses/base/enums/bonus_status.enum";
import { map, each } from "bluebird";
import { CasinoTransaction } from "../../casino_transaction/models/casino_transaction.model";
import { CasinoTransactionType } from "../../casino_transaction/enums/casino_transaction.type";
import { ITransactionModel } from "../../../../../CoreService/src/components/transactions/interfaces/transaction.interface";
import { CommunicationCodes } from "../../../../../CommonJS/src/messaging/CommunicationCodes";
import { MoneyType } from "../../../../../CoreService/src/components/transactions/enums/money_type.enum";
import { TransactionType } from "../../../../../CoreService/src/components/transactions/enums/transaction_type.enum";
import { ChannelType } from "../../../../../CommonJS/src/enums/channel_type.enum";
import { SourceType } from "../../../../../CommonJS/src/enums/source_type.enum";
import { TransactionStatus } from "../../../../../CoreService/src/components/transactions/enums/transaction_status.enum";
import { v4 } from "uuid";
import { QueueType } from "../../../../../CommonJS/src/messaging/QueueType";
import { NotificationType } from "../../../../../NotificationService/src/components/notificationTemplate/enums/notification_template.enum";
import { ActionType } from "../../../../../SocketService/src/base/interfaces/observer.interface";
import { isNotNumber } from "../../../../../CommonJS/src/utils/validators";
import { SourceID } from "../../../../../CoreService/src/components/transactions/enums/product_type.enum";
import { BonusType } from "../../../../../CoreService/src/components/bonuses/base/enums/bonus_type.enum";
import { ICasinoTransaction } from "../../casino_transaction/interfaces/casino_transaction.interface";
import { CasinoBet } from "../../casino_bet/models/casino_bet.model";
import { BonusWalletFilter } from "../filters/bonus_wallet.filter";
import { Transactional, trx } from "../../../../../CommonJS/src/decorators/transaction.decorator";
import moment = require("moment");

export class BonusWalletService {
    public async getUserBalance(user_id: number) {
        return BonusWalletService.GetBonusBalance(user_id);
    }

    public async getWallets(filter: IBonusWalletFilter): Promise<IListWithPagination> {
        return BonusWalletFilter.Find(filter);
    }

    public async add(data: IBonusWallet) {
        return new BonusWallet(data).saveWithID();
    }

    public static async CloseOldWallets() {
        await BonusWallet.none(
            QueryBuilder(BonusWallet.tableName)
                .update({ status_id: BonusStatus.EXPIRED })
                .where("status_id", "!=", BonusStatus.FINISHED)
                .whereNotNull("expire_date")
                .where("expire_date", "<", new Date())
        );
    }

    public static async CloseFinishedWallets() {
        await BonusWallet.none(
            QueryBuilder(BonusWallet.tableName)
                .update({ status_id: BonusStatus.FINISHED })
                .where({ status_id: BonusStatus.ACTIVE, balance: 0 })
        );
    }

    public static async ConvertToReal(user_id: number, channel_id: number) {
        await BonusWalletService.ConvertWallets(user_id, channel_id);
    }

    @Transactional()
    public static async ConvertWallet(wallet_id: number, channel_id: ChannelType) {
        const transaction = new CasinoTransaction((await trx()
            .table(CasinoTransaction.tableName)
            .where({ wallet_id, bet_type_id: CasinoTransactionType.BET })
            .sum("amount as amount"))[0] as ICasinoTransaction);
        let wallet: IBonusWallet = (await trx()
            .table(BonusWallet.tableName)
            .whereRaw(`wagering_turnover * initial_balance <= ${transaction.amount}`)
            .where({ id: wallet_id, status_id: BonusStatus.ACTIVE })
            .update({ status_id: BonusStatus.FINISHED })
            .returning("*"))[0];
        if (!wallet) return;
        wallet = new BonusWallet(wallet);
        return BonusWalletService.sendMoneyToUser(wallet.balance, wallet.user_id, wallet.bonus_type_id, channel_id);
    }

    public static async UpdateBonusBalance(id: number, balance?: number) {
        if (isNotNumber(balance)) balance = await this.GetBonusBalance(id);
        else balance = round(balance, 2);
        // send socket msg about update user balance
        BonusWalletService.SendBalanceUpdateNotification(id, balance);
    }

    public static SendBalanceUpdateNotification(id: number, balance: number) {
        broker.publishMessageWithCode(
            CommunicationCodes.ADD_NOTIFICATION,
            {
                type_id: NotificationType.USER_UPDATE_BONUS_BALANCE,
                notificationData: {
                    actionType: ActionType.UPDATE,
                    data: {
                        id,
                        casino_bonus_balance: balance
                    }
                }
            },
            QueueType.NOTIFICATION_SERVICE
        );
    }

    public static async ActivateBonus(bonus_id: number, bonus_type_id: BonusType, user_id: number) {
        const wallet = await BonusWallet.findOne({bonus_id, bonus_type_id});
        if(!wallet) return;
        const updateData: Partial<IBonusWallet> = {status_id: BonusStatus.ACTIVE};
        if(wallet.days_to_expire) updateData.expire_date = moment().add(wallet.days_to_expire, "day").endOf("day").toDate();
        await wallet.update(updateData);
        BonusWalletService.UpdateBonusBalance(user_id);
    }

    public static async UpdateWalletBalanceByBonusId(bonus_id: number, amount: number): Promise<BonusWallet> {
        return BonusWallet.one(
            QueryBuilder(BonusWallet.tableName)
                .increment("balance", amount)
                .increment("initial_balance", amount)
                .where({ bonus_id })
                .returning("*")
        );
    }

    public static async UpdateWalletsWonAmounts(wonAmount: number, casinoBet: CasinoBet) {
        const transactions = await CasinoTransaction.manyOrNone(
            QueryBuilder(CasinoTransaction.tableName)
                .where({ bet_id: casinoBet.id, bet_type_id: CasinoTransactionType.BET })
                .where("amount", ">", 0)
        );

        const wallets = await BonusWalletFilter.FindByIds(uniq(transactions.map(t => t.wallet_id)));
        const bonusWonAmount = round((wonAmount * casinoBet.bonus_stake) / (casinoBet.real_stake + casinoBet.bonus_stake), 2);
        await each(transactions, async trans => {
            let wallet = wallets.find(w => w.id === trans.wallet_id) as IBonusWallet;
            const walletWonAmount = round((bonusWonAmount * trans.amount) / casinoBet.bonus_stake, 2);
            wallet = await BonusWallet.one(
                QueryBuilder(BonusWallet.tableName)
                    .increment("balance", walletWonAmount)
                    .where({ id: wallet.id })
                    .returning("*")
            );
            await new CasinoTransaction({
                amount: walletWonAmount,
                balance_after: wallet.balance,
                balance_before: wallet.balance + trans.amount,
                bet_id: casinoBet.id as number,
                user_id: casinoBet.user_id,
                wallet_id: wallet.id as number,
                bet_type_id: CasinoTransactionType.WIN,
                created: new Date()
            }).saveWithID();
            if (wallet.status_id === BonusStatus.FINISHED) this.sendMoneyToUser(wonAmount, wallet.user_id, wallet.bonus_type_id, casinoBet.channel_id);
        });
        return bonusWonAmount;
    }

    @Transactional()
    static async UpdateWalletBalance(wallet_id: number, amount: number, status?: number) {
        return (await trx()
            .table(BonusWallet.tableName)
            .where({ id: wallet_id })
            .update({ status_id: status })
            .increment("balance", amount)
            .returning("*"))[0] as IBonusWallet;
    }

    public static async RollbackBet(bet_id: number, bonus_stake?: number, bonus_won_amount?: number) {
        if (!bonus_stake && !bonus_won_amount) return;
        // get casinoTransactions
        const casinoTransactions = await CasinoTransaction.find({ bet_id });
        // get wallet`s ids from casinoTransactions
        let wallets_id = casinoTransactions.map(ct => ct.wallet_id);
        // get wallets
        const wallets = await BonusWalletFilter.FindByIds(wallets_id);
        // update wallets and save casino transactions
        await each(wallets, async wallet => {
            if (bonus_won_amount) {
                const winTransactions = await casinoTransactions.filter(obj => obj.wallet_id === wallet.id && obj.bet_type_id === CasinoTransactionType.WIN);
                await map(winTransactions, async trans => {
                    const updatedWallet = await this.UpdateWalletBalance(wallet.id as number, -1 * trans.amount);
                    await new CasinoTransaction({
                        amount: trans.amount,
                        balance_after: updatedWallet.balance,
                        balance_before: wallet.balance,
                        bet_id,
                        user_id: wallet.user_id,
                        wallet_id: wallet.id as number,
                        bet_type_id: CasinoTransactionType.WIN_REVERSE,
                        created: new Date()
                    }).saveWithID();
                });
            }

            if (bonus_stake) {
                const stakeTransactions = await casinoTransactions.filter(obj => obj.wallet_id === wallet.id && obj.bet_type_id === CasinoTransactionType.BET);
                await map(stakeTransactions, async trans => {
                    const updatedWallet = await this.UpdateWalletBalance(wallet.id as number, trans.amount);
                    await new CasinoTransaction({
                        amount: trans.amount,
                        balance_after: updatedWallet.balance,
                        balance_before: wallet.balance,
                        bet_id,
                        user_id: wallet.user_id,
                        wallet_id: wallet.id as number,
                        bet_type_id: CasinoTransactionType.BET_REVERSE,
                        created: new Date()
                    }).saveWithID();
                });
            }
        });
    }

    @Transactional()
    private static async ConvertWallets(user_id: number, channel_id: ChannelType) {
        const wallets = ((await trx()
            .table(BonusWallet.tableName)
            .where({ status_id: BonusStatus.ACTIVE, user_id })
            .forUpdate()
            .select("id")) as IBonusWallet[]).map(w => new BonusWallet(w));
        await map(wallets, async wal => this.ConvertWallet(wal.id as number, channel_id));
    }

    @Transactional()
    public static async GetBonusBalance(user_id: number): Promise<number> {
        const bonusBalance = (await trx()
            .table(BonusWallet.tableName)
            .where({ user_id, status_id: BonusStatus.ACTIVE })
            .sum("balance as balance"))[0] as IBonusWallet;
        return round(bonusBalance.balance, 2);
    }

    private static async sendMoneyToUser(amount: number, user_id: number, bonus_type_id: number, channel_id: ChannelType) {
        if (!amount) return;
        await broker.sendRequest<ITransactionModel>(
            CommunicationCodes.UPDATE_USER_BALANCE,
            <ITransactionModel>{
                amount,
                money_type_id: MoneyType.REAL,
                user_id,
                type_id: TransactionType.BONUS,
                bonus_type: bonus_type_id,
                product_id: SourceID.SYSTEM,
                channel_id,
                source_id: SourceType.SYSTEM,
                source_type_id: SourceType.SYSTEM,
                status_id: TransactionStatus.SUCCESS,
                code: v4()
            },
            QueueType.CORE_SERVICE
        );
    }
}
