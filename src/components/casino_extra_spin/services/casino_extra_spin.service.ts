import { ICasinoExtraSpin, ICasinoExtraSpinFilter, ICasinoExtraSpinPublic } from "../interfaces/casino_extra_spin.interface";
import { isNotNumber } from "../../../../../CommonJS/src/utils/validators";
import { ErrorUtil, ErrorCodes } from "../../../../../CommonJS/src/messaging/ErrorCodes";
import { CasinoExtraSpin } from "../models/casino_extra_spin.model";
import { CasinoExtraSpinFilter } from "../filters/casino_extra_spin.filter";
import { IListWithPagination } from "../../../../../CommonJS/src/interfaces/list_with_pagination.interface";
import { broker, QueryBuilder } from "../../../../../CommonJS/src/base/base.model";
import { IUser, IUserFilter } from "../../../../../CoreService/src/components/users/interfaces/user.interface";
import { CommunicationCodes } from "../../../../../CommonJS/src/messaging/CommunicationCodes";
import { QueueType } from "../../../../../CommonJS/src/messaging/QueueType";
import { CasinoGameModel } from "../../casino_game/models/casino_game.model";
import { CasinoProvider } from "../../casino/factory/casino.factory";
import { BonusWallet } from "../../bonus_wallet/models/bonus_wallet.model";
import { BonusType } from "../../../../../CoreService/src/components/bonuses/base/enums/bonus_type.enum";
import * as moment from "moment";
import { BonusStatus } from "../../../../../CoreService/src/components/bonuses/base/enums/bonus_status.enum";
import { WebsiteModel } from "../../../../../CoreService/src/components/website/models/website.model";
import { WebsiteDescriptionFilter } from "../../../../../CoreService/src/components/website_description/filters/website_description.filter";
import { ExtractRootDomain } from "../../../../../CommonJS/src/utils/domain.util";
import { ActionType } from "../../../../../SocketService/src/base/interfaces/observer.interface";
import { NotificationType } from "../../../../../NotificationService/src/components/notificationTemplate/enums/notification_template.enum";
import { CIOEvent, CIO } from "../../../../../CommonJS/src/utils/cio.util";
import { IWebsiteModel } from "../../../../../CoreService/src/components/website/interfaces/website.interface";
import { map } from "bluebird";
import { WebsiteCasinoModel } from "../../website_casino/models/website_casino.model";

export class CasinoExtraSpinService {
    public async updateFreespin(data: ICasinoExtraSpin): Promise<ICasinoExtraSpinPublic | undefined> {
        if (!this.validateSpinUpdate(data)) throw ErrorUtil.newError(ErrorCodes.BAD_REQUEST);

        const user = await broker.sendRequest<IUser>(CommunicationCodes.GET_USER, { id: data.user_id }, QueueType.CORE_SERVICE);
        if (!user) throw ErrorUtil.newError(ErrorCodes.USER_NOT_FOUND);
        const website = await WebsiteModel.findOne({ id: user.website_id });
        if (!website) throw ErrorUtil.newError(ErrorCodes.WEBSITE_NOT_FOUND);

        return this.saveSpin(data, user, website);
    }

    public async updateFreespins(data: ICasinoExtraSpin, filter: IUserFilter): Promise<(ICasinoExtraSpinPublic | undefined)[]> {
        if (!this.validateSpinUpdate(data)) throw ErrorUtil.newError(ErrorCodes.BAD_REQUEST);
        const users = await broker.sendRequest<IUser[]>(CommunicationCodes.GET_USERS, filter, QueueType.CORE_SERVICE);
        const website = await WebsiteModel.findOne({ id: data.personal_id });
        if (!website) throw ErrorUtil.newError(ErrorCodes.WEBSITE_NOT_FOUND);
        return map(users, async user => {
            return await this.saveSpin(data, user, website);
        });
    }

    public async getFreespin(filter: ICasinoExtraSpinFilter): Promise<IListWithPagination> {
        return new CasinoExtraSpinFilter(Object.assign(filter, true)).find();
    }

    public static async CloseOldSpins() {
        await CasinoExtraSpin.none(
            QueryBuilder(CasinoExtraSpin.tableName)
                .update({ status_id: BonusStatus.EXPIRED })
                .where({ status_id: BonusStatus.ACTIVE })
                .where("expire_date", "<", new Date())
        );
    }

    private validateSpinUpdate(data: ICasinoExtraSpin): boolean {
        return !(
            isNotNumber(data.user_id) ||
            isNotNumber(data.casino_game_id) ||
            isNotNumber(data.type_id) ||
            isNotNumber(data.spins_total) ||
            isNotNumber(data.days_to_expire_bonus)
        );
    }

    private async saveSpin(data: ICasinoExtraSpin, user: IUser, website: IWebsiteModel): Promise<ICasinoExtraSpinPublic | undefined> {
        data.currency_id = user.currency_id;
        data.left_spins = data.spins_total;
        data.expire_date = moment()
            .add(data.days_to_expire_bonus, "day")
            .endOf("day")
            .toDate();
        data.status_id = BonusStatus.ACTIVE;
        data.website_id = user.website_id;
        const spin = await new CasinoExtraSpin(data).saveWithID();
        const [publicSpin] = ((await new CasinoExtraSpinFilter({ id: spin.id, include_count: false }).find()).data as unknown) as ICasinoExtraSpinPublic[];

        // send socket msg about user bonus
        broker.publishMessageWithCode(
            CommunicationCodes.ADD_NOTIFICATION,
            {
                type_id: NotificationType.USER_BONUS_SPIN,
                notificationData: {
                    actionType: ActionType.UPDATE,
                    data: {
                        id: user.id,
                        bonus_spin: publicSpin
                    }
                }
            },
            QueueType.NOTIFICATION_SERVICE
        );
        //send bonus email
        const websiteDescription = await WebsiteDescriptionFilter.findOne({ website_id: user.website_id, lang_id: <number>user.language_id });
        const copyright = websiteDescription ? websiteDescription.copyright : "";

        CIO.SendEvent(user.id, CIOEvent.FREE_SPIN_BONUS, {
            domain: ExtractRootDomain(website.domain),
            email: user.email,
            website_name: website.name,
            copyright,
            support_email: website.support_email,
            date: moment(publicSpin.expire_date).format("YYYY-MM-DD"),
            freeSpin_count: publicSpin.spins_total,
            game_name: publicSpin.casino_game_name,
            count: publicSpin.wagering_turnover,
            name: (user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username) || user.email,
            lang_id: user.language_id
        });
        await new BonusWallet({
            user_id: user.id,
            balance: 0,
            bonus_id: spin.id as number,
            bonus_type_id: spin.bonus_type_id as BonusType,
            status_id: BonusStatus.INACTIVE,
            initial_balance: 0,
            wagering_turnover: spin.wagering_turnover,
            created: spin.created,
            days_to_expire: <number>data.days_to_expire_wallet
        }).saveWithID();

        const casinoGame = await CasinoGameModel.findOneById(data.casino_game_id);
        const websiteCasino = await WebsiteCasinoModel.findOne({ website_id: user.website_id, casino_id: casinoGame.provider_id });
        if (!websiteCasino) throw ErrorUtil.newError(ErrorCodes.CASINO_GAME_NOT_FOUND);
        await CasinoProvider(casinoGame.provider_id as number).registerBonusSpin(spin);
        return publicSpin;
    }
}
