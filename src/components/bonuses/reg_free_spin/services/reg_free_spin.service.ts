import { isNotNumber } from "../../../../../../CommonJS/src/utils/validators";
import { ErrorUtil, ErrorCodes } from "../../../../../../CommonJS/src/messaging/ErrorCodes";
import { isString } from "util";
import { RegFreeSpinBonusFilter } from "../filter/reg_free_spin.filter";
import { IRegFreeSpinBonus, IRegFreeSpinBonusFilter } from "../interfaces/reg_free_spin";
import { RegFreeSpinBonus } from "../models/reg_free_spin.model";
import { map } from "bluebird";
import { CasinoExtraSpin } from "../../../casino_extra_spin/models/casino_extra_spin.model";
import { ICasinoExtraSpin } from "../../../casino_extra_spin/interfaces/casino_extra_spin.interface";
import { ServiceWithRequestInfo } from "../../../../../../CommonJS/src/components/service_with_request_info/service_with_request_info";
import { ExtractRootDomain } from "../../../../../../CommonJS/src/utils/domain.util";
import { CasinoGamesTranslationFilter } from "../../../casino_game_translation/filters/casino_games_translation.filter";
import { DEFAULT_LANGUAGE } from "../../../../../../CommonJS/src/domain/constant";
import { WebsiteModel } from "../../../../../../CoreService/src/components/website/models/website.model";
import { WebsiteDescriptionFilter } from "../../../../../../CoreService/src/components/website_description/filters/website_description.filter";
import { IUser } from "../../../../../../CoreService/src/components/users/interfaces/user.interface";
import * as moment from "moment";
import { BonusType } from "../../../../../../CoreService/src/components/bonuses/base/enums/bonus_type.enum";
import { BonusWallet } from "../../../bonus_wallet/models/bonus_wallet.model";
import { BonusStatus } from "../../../../../../CoreService/src/components/bonuses/base/enums/bonus_status.enum";
import { CIO, CIOEvent } from "../../../../../../CommonJS/src/utils/cio.util";
import { cloneDeep } from "lodash";

export class RegFreeSpinBonusService extends ServiceWithRequestInfo {
    async get() {
        return RegFreeSpinBonus.findOne({ status_id: BonusStatus.ACTIVE });
    }

    async create(data: IRegFreeSpinBonus) {
        if (isNotNumber(data.amount) || !isString(data.name) || isNotNumber(data.wagering_turnover)) {
            throw ErrorUtil.newError(ErrorCodes.BAD_REQUEST);
        }
        return await new RegFreeSpinBonus(data, this.source).saveWithID();
    }

    async update(data: IRegFreeSpinBonus) {
        if (isNotNumber(data.id)) throw ErrorUtil.newError(ErrorCodes.BAD_REQUEST);
        const source = cloneDeep(this.source);
        const [bonus] = await this.list({ id: data.id });
        if (!bonus) throw ErrorUtil.newError(ErrorCodes.NOT_FOUND);
        bonus.sourceData = source;
        return bonus.update(data);
    }

    async list(filter: IRegFreeSpinBonusFilter) {
        return RegFreeSpinBonusFilter.find(filter);
    }

    static async ApplyRegistrationFreeSpinBonuses(user: IUser) {
        const bonuses = await RegFreeSpinBonus.manyOrNone(`
        select * from ${RegFreeSpinBonus.tableName}
        where status_id = ${BonusStatus.ACTIVE} 
        and ((start_date is null or start_date < now()) and (end_date is null or end_date > now())) 
        and website_id = ${user.website_id} 
        and currency_id = ${user.currency_id}
        `);
        // ! TODO: take bonus with aff ref and without but if with aff ref exists take that one and ingore without
        // ${isRealString(user.affiliate_reference) ? `and affiliate_reference = '${user.affiliate_reference}'` : ``}

        const website = await WebsiteModel.findOne({ id: user.website_id });
        if (!website) throw ErrorUtil.newError(ErrorCodes.WEBSITE_NOT_FOUND);
        const websiteDescription = await WebsiteDescriptionFilter.findOne({
            website_id: user.website_id,
            lang_id: <number>user.language_id
        });
        const copyright = websiteDescription ? websiteDescription.copyright : "";

        await map(bonuses, async bonus => {
            const newBonus = await new CasinoExtraSpin(<ICasinoExtraSpin>{
                spins_total: bonus.spins_total,
                left_spins: bonus.spins_total,
                bonus_type_id: BonusType.REGISTRATION_FREE_SPIN,
                casino_game_id: bonus.casino_game_id,
                currency_id: bonus.currency_id,
                type_id: bonus.type_id,
                user_id: user.id,
                bet_id: bonus.bet_id,
                bet_per_line: bonus.bet_per_line,
                lines: bonus.lines,
                wagering_turnover: bonus.wagering_turnover,
                denomination: bonus.denomination,
                denomination_value: bonus.denomination_value,
                bet_amount: bonus.denomination ? bonus.denomination * bonus.denomination_value * bonus.lines * bonus.bet_per_line : bonus.amount || 0,
                expire_date: moment()
                    .add(bonus.days_to_expire, "day")
                    .endOf("day")
                    .toDate(),
                status_id: BonusStatus.ACTIVE
            }).saveWithID();
            // save new wallet for bonus
            await new BonusWallet({
                user_id: user.id,
                balance: 0,
                bonus_id: newBonus.id as number,
                bonus_type_id: newBonus.bonus_type_id as BonusType,
                status_id: BonusStatus.INACTIVE,
                initial_balance: 0,
                wagering_turnover: newBonus.wagering_turnover,
                created: newBonus.created,
                days_to_expire: 0 // this wallet will not expire
            }).saveWithID();
            // get game name
            const [translation] = await new CasinoGamesTranslationFilter({
                casino_game_id: bonus.casino_game_id,
                lang_id: DEFAULT_LANGUAGE
            }).findList();
            CIO.SendEvent(user.id, CIOEvent.FREE_SPIN_BONUS, {
                domain: ExtractRootDomain(website.domain),
                email: user.email,
                website_name: website.name,
                copyright,
                support_email: website.support_email,
                freeSpin_count: bonus.spins_total,
                count: bonus.wagering_turnover,
                date: moment()
                    .add(bonus.days_to_expire, "day")
                    .format("YYYY-MM-DD"),
                game_name: translation.name,
                name: (user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username) || user.email,
                lang_id: user.language_id
            });
        });
    }
}
