import { BaseModel, broker } from "../../../../../CommonJS/src/base/base.model";
import { ICasinoBet } from "../interfaces/casino_bet.interface";
import { ChannelType } from "../../../../../CommonJS/src/enums/channel_type.enum";
import { CasinoBetStatus, CasinoBetType } from "../enums/casino_bet.enum";
import { CasinoRtmFilter } from "../../rtm/filters/casino.rtm.filter";
import { CommunicationCodes } from "../../../../../CommonJS/src/messaging/CommunicationCodes";
import { NotificationType } from "../../../../../NotificationService/src/components/notificationTemplate/enums/notification_template.enum";
import { ActionType } from "../../../../../SocketService/src/base/interfaces/observer.interface";
import { QueueType } from "../../../../../CommonJS/src/messaging/QueueType";
import { MoneyType } from "../../../../../CoreService/src/components/transactions/enums/money_type.enum";
import { DEFAULT_WEB_SITE } from "../../../../../CommonJS/src/domain/constant";
import { BonusWalletService } from "../../bonus_wallet/services/bonus_wallet.service";
import { Transactional, trx } from "../../../../../CommonJS/src/decorators/transaction.decorator";

export class CasinoBet extends BaseModel implements ICasinoBet {
    public static tableName = "casino_bet";
    public user_id: number;
    public bet_type_id: CasinoBetType;
    public money_type_id: MoneyType;
    public stake: number;
    public stake_usd: number;
    public balance_after: number;
    public balance_after_usd: number;
    public balance_after_result: number;
    public balance_after_result_usd: number;
    public balance_before: number;
    public balance_before_usd: number;
    public won_amount: number;
    public won_amount_usd: number;
    public channel_id: ChannelType;
    public website_id: number;
    public currency_id: number;
    public casino_game_id: number;
    public provider_id: number;
    public ip: string;
    public ip_country: string;
    public status_id: CasinoBetStatus;
    public external_action_id: string;
    public created?: Date;
    public updated?: Date;
    public bet_number: number;
    public bonus_stake: number;
    public bonus_won_amount: number;
    public real_stake: number;
    public real_stake_usd: number;
    public real_won_amount: number;
    public real_won_amount_usd: number;
    public session_id: number;
    public date: Date;
    public hash: string;
    public bonus_id: number;

    constructor(data: ICasinoBet) {
        super();
        this.id = data.id;
        this.user_id = data.user_id;
        this.bet_type_id = data.bet_type_id || CasinoBetType.SPIN;
        this.money_type_id = data.money_type_id;
        this.stake = data.stake;
        this.stake_usd = data.stake_usd || 0;
        this.balance_after_result = data.balance_after_result || 0;
        this.balance_after_result_usd = data.balance_after_result_usd || 0;
        this.balance_after = data.balance_after || 0;
        this.balance_after_usd = data.balance_after_usd || 0;
        this.balance_before = data.balance_before || 0;
        this.balance_before_usd = data.balance_before_usd || 0;
        this.won_amount = data.won_amount || 0;
        this.won_amount_usd = data.won_amount_usd || 0;
        this.channel_id = data.channel_id;
        this.website_id = data.website_id || DEFAULT_WEB_SITE;
        this.currency_id = data.currency_id;
        this.casino_game_id = data.casino_game_id;
        this.provider_id = data.provider_id;
        this.ip = data.ip;
        this.ip_country = data.ip_country;
        this.status_id = data.status_id;
        this.external_action_id = data.external_action_id;
        this.created = new Date(data.created || new Date());
        this.updated = data.updated ? new Date(data.updated) : undefined;
        this.bet_number = data.bet_number;
        this.bonus_stake = data.bonus_stake || 0;
        this.bonus_won_amount = data.bonus_won_amount || 0;
        this.real_stake = data.real_stake || 0;
        this.real_stake_usd = data.real_stake_usd || 0;
        this.real_won_amount = data.real_won_amount || 0;
        this.real_won_amount_usd = data.real_won_amount_usd || 0;
        this.session_id = data.session_id;
        this.date = data.date || this.created;
        this.hash = data.hash;
        this.bonus_id = data.bonus_id;
    }

    public async saveWithID() {
        // set bet number
        await this.assignBetNumber();
        // save bet
        await super.saveWithID();
        // commit transaction
        this.sendCreateNotification();
        return this;
    }

    @Transactional()
    public async assignBetNumber() {
        let [actionNumber] = await trx()
            .table(`casino_bet_number`)
            .increment("bet_number", 1)
            .where({ user_id: this.user_id })
            .returning("*");
        if (!actionNumber) {
            [actionNumber] = await trx()
                .table(`casino_bet_number`)
                .insert({ bet_number: 1, user_id: this.user_id })
                .returning("*");
        }
        // set bet number
        this.bet_number = actionNumber.bet_number;
    }

    public setLost() {
        setTimeout(async () => this.setLostImmediate(), 2000);
    }

    public async setLostImmediate() {
        const bet = await CasinoBet.findOne({ id: this.id });
        if (!bet) return;
        if (bet.status_id !== CasinoBetStatus.ACTIVE) return;
        bet.status_id = CasinoBetStatus.LOST;
        bet.updated = new Date();
        bet.balance_after_result = bet.balance_after;
        bet.balance_after_result_usd = bet.balance_after_usd;
        await bet.update();
        this.sendUpdateNotification();
        await BonusWalletService.ConvertToReal(this.user_id, bet.channel_id);
    }

    public async sendCreateNotification() {
        const casinoRtmItem = await new CasinoRtmFilter({ id: this.id }).findOne();
        if (casinoRtmItem) {
            broker.publishMessageWithCode(
                CommunicationCodes.ADD_NOTIFICATION,
                {
                    type_id: NotificationType.CASINO,
                    notificationData: {
                        actionType: ActionType.CREATE,
                        data: casinoRtmItem
                    }
                },
                QueueType.NOTIFICATION_SERVICE
            );
        }
    }

    public async sendUpdateNotification() {
        const casinoRtmItem = await new CasinoRtmFilter({ id: this.id }).findOne();
        if (casinoRtmItem) {
            broker.publishMessageWithCode(
                CommunicationCodes.ADD_NOTIFICATION,
                {
                    type_id: NotificationType.CASINO,
                    notificationData: {
                        actionType: ActionType.UPDATE,
                        data: casinoRtmItem
                    }
                },
                QueueType.NOTIFICATION_SERVICE
            );
        }
    }
}
