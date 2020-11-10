import { isNumber, isNil } from 'lodash';
import { QueryBuilder, BaseModel } from "../../../../../CommonJS/src/base/base.model";
import { CasinoRtmModel, CasinoRtmTotalModel } from "../models/casino.rtm.model";
import { ICasinoRtmFilter, ICasinoRtm, ICustomRTMFilter } from "../interfaces/casino.rtm.model.interface";
import { CasinoGamesTranslationModel } from "../../casino_game_translation/models/casino_games_translation.model";
import { DEFAULT_LANGUAGE, DEFAULT_WEB_SITE } from "../../../../../CommonJS/src/domain/constant";
import { ChannelType } from "../../../../../CommonJS/src/enums/channel_type.enum";
import { CasinoTranslationModel } from "../../casino_translations/models/casino_translation.model";
import { CasinoGameModel } from "../../casino_game/models/casino_game.model";
import { CasinoBetStatus, CasinoBetType } from "../../casino_bet/enums/casino_bet.enum";
import { WebsiteModel } from "../../../../../CoreService/src/components/website/models/website.model";
import { User } from "../../../../../CoreService/src/components/users/models/user.model";
import { RiskGroupModel } from "../../../../../CoreService/src/components/user_risk_group/models/risk_group.model";
import { IListWithPagination } from "../../../../../CommonJS/src/interfaces/list_with_pagination.interface";
import { CountModel } from "../../../../../CommonJS/src/components/count_model/count.model";
import { NormalizePage, NormalizeLimit } from "../../../../../CommonJS/src/utils/utils";
import { ErrorUtil, ErrorCodes } from "../../../../../CommonJS/src/messaging/ErrorCodes";
import { toBoolean, isNotNumber, isRealString, toNumberIfExists } from "../../../../../CommonJS/src/utils/validators";

export class CasinoRtmFilter implements ICasinoRtmFilter {
    public id?: number;
    public page: number;
    public limit: number;
    public unlimit: boolean;
    public sort_by: string;
    public sort_order: string;
    public user_id?: number;
    public user_country_id?: string[];
    public user_group_id?: number[];
    public user_status_id?: number[];
    public user_name?: string;
    public user_registration_ip?: string;
    public game_id?: number;
    public game_name?: string;
    public game_ip?: string;
    public game_ip_country?: string;
    public game_currency_id?: number;
    public game_provider_id?: number;
    public game_placement_time_from?: Date;
    public game_placement_time_to?: Date;
    public game_status_id?: CasinoBetStatus;
    public game_bet_number_from?: number;
    public game_bet_number_to?: number;
    public bet_type_id?: CasinoBetType[];
    public user_balance_before_from?: number;
    public user_balance_before_to?: number;
    public user_balance_after_from?: number;
    public user_balance_after_to?: number;
    public channel_id?: ChannelType;
    public website_id?: number;

    private baseTableName: string = "casino_bet";
    protected onlyCount: boolean = false;
    private game_names_joined: boolean;

    constructor(data: ICasinoRtmFilter) {
        this.id = data.id;
        this.unlimit = toBoolean(data.unlimit);
        if (!this.unlimit) {
            this.page = NormalizePage((data.page || 1) - 1);
            this.limit = NormalizeLimit(data.limit || 20);
        }
        this.sort_by = data.sort_by === "id" ? "casino_bet.created" : data.sort_by || "casino_bet.created";
        this.sort_order = data.sort_order || "desc";
        this.user_country_id = data.user_country_id;
        this.user_id = data.user_id;
        this.user_group_id = data.user_group_id;
        this.user_status_id = data.user_status_id;
        this.user_name = data.user_name;
        this.user_registration_ip = data.user_registration_ip;
        this.id = data.id;
        this.game_id = toNumberIfExists(data.game_id);
        this.game_name = data.game_name;
        this.game_ip = data.game_ip;
        this.game_ip_country = data.game_ip_country;
        this.game_currency_id = data.game_currency_id;
        this.game_provider_id = data.game_provider_id;
        this.game_placement_time_from = data.game_placement_time_from;
        this.game_placement_time_to = data.game_placement_time_to;
        this.game_status_id = data.game_status_id;
        this.game_bet_number_from = data.game_bet_number_from;
        this.game_bet_number_to = data.game_bet_number_to;
        this.bet_type_id = data.bet_type_id;
        this.user_balance_before_from = data.user_balance_before_from;
        this.user_balance_before_to = data.user_balance_before_to;
        this.user_balance_after_from = data.user_balance_after_from;
        this.user_balance_after_to = data.user_balance_after_to;
        this.channel_id = data.channel_id;
        this.website_id = data.website_id;
    }

    protected get getSum() {
        const tableName = this.baseTableName;
        const query = QueryBuilder(`${CasinoRtmModel.tableName} as ${tableName}`)
            // join casino_games_translation
            .sum(`${tableName}.real_stake as game_stake_sum`)
            .sum(`${tableName}.real_stake_usd as game_stake_usd_sum`)
            .sum(`${tableName}.real_won_amount as game_won_amount_sum`)
            .sum(`${tableName}.real_won_amount_usd as game_won_amount_usd_sum`)
            .count(`${tableName}.stake as game_stake_count`)
            .select(QueryBuilder.raw(`count(${tableName}.won_amount) FILTER (WHERE ${tableName}.won_amount != 0) as game_won_amount_count`));
        this.setWhere(query);
        return query;
    }

    protected get queryList() {
        const query = QueryBuilder(`${CasinoRtmModel.tableName} as ${this.baseTableName}`);

        if (!this.onlyCount) {
            query.select([
                `${this.baseTableName}.id`,
                `${this.baseTableName}.casino_game_id as game_id`,
                `${CasinoGamesTranslationModel.tableName}.name as game_name`,
                `${this.baseTableName}.created as game_bet_time`,
                `${this.baseTableName}.currency_id as game_currency_id`,
                `${this.baseTableName}.provider_id as game_provider_id`,
                `${CasinoTranslationModel.tableName}.name as game_provider_name`,
                `${this.baseTableName}.ip as game_ip`,
                `${this.baseTableName}.ip_country as game_ip_country`,
                `${this.baseTableName}.status_id as game_status_id`,
                `${this.baseTableName}.stake as game_stake`,
                `${this.baseTableName}.real_stake as game_stake_real`,
                `${this.baseTableName}.real_stake_usd as game_stake_real_usd`,
                `${this.baseTableName}.bonus_stake as game_stake_bonus`,
                `${this.baseTableName}.stake_usd as game_stake_usd`,
                `${this.baseTableName}.won_amount as game_won_amount`,
                `${this.baseTableName}.bonus_won_amount as game_won_amount_bonus`,
                `${this.baseTableName}.real_won_amount as game_won_amount_real`,
                `${this.baseTableName}.real_won_amount_usd as game_won_amount_real_usd`,
                `${this.baseTableName}.won_amount_usd as game_won_amount_usd`,
                `${this.baseTableName}.created as game_placement_time`,
                `${this.baseTableName}.bet_number as game_bet_number`,
                `${this.baseTableName}.bet_type_id`,
                `${this.baseTableName}.user_id`,
                `${this.baseTableName}.balance_after as user_balance_after`,
                `${this.baseTableName}.balance_after_usd as user_balance_after_usd`,
                `${this.baseTableName}.balance_before as user_balance_before`,
                `${this.baseTableName}.balance_before_usd as user_balance_before_usd`,
                `${User.tableName}.risk_group_id`,
                `${User.tableName}.verification_status as user_status_id`,
                `${User.tableName}.country as user_country_id`,
                `${User.tableName}.registration_ip as user_registration_ip`,
                `${this.baseTableName}.website_id`,
                `${this.baseTableName}.channel_id`,
                QueryBuilder.raw(`
                    CASE WHEN length(${User.tableName}.first_name) <> 0
                        AND length(${User.tableName}.last_name) <> 0 THEN
                        CONCAT(${User.tableName}.first_name, ' ', ${User.tableName}.last_name)
                    WHEN length(${User.tableName}.first_name) <> 0 THEN
                        ${User.tableName}.first_name
                    WHEN length(${User.tableName}.last_name) <> 0 THEN
                        ${User.tableName}.last_name
                    WHEN length(${User.tableName}.username) <> 0 THEN
                        ${User.tableName}.username
                    WHEN ${User.tableName}.email IS NOT NULL THEN
                        ${User.tableName}.email
                    ELSE
                        '(Unknown)'
                    END AS user_name            
                `)
            ]);

            if (!this.unlimit) query.limit(this.limit).offset(this.page * this.limit);
            query.orderBy(this.sort_by, this.sort_order);
            // join website to get website_currency
            // join casino_translation
            query.joinRaw(`
            left join ${CasinoTranslationModel.tableName} 
            on ${CasinoTranslationModel.tableName}.casino_id = ${this.baseTableName}.provider_id
            and ${CasinoTranslationModel.tableName}.website_id = ${DEFAULT_WEB_SITE}
            and ${CasinoTranslationModel.tableName}.channel_id = ${ChannelType.BACKEND}
            and ${CasinoTranslationModel.tableName}.lang_id = ${DEFAULT_LANGUAGE}
        `);
            this.joinCasinoGameNames(query);
        } else {
            query.select(QueryBuilder.raw(`count (${this.baseTableName}.id)`));
        }

        // add filter logic
        this.setWhere(query);
        this.game_names_joined = false;
        return query;
    }

    protected joinCasinoGameNames(query): void {
        if (this.game_names_joined) return;
        this.game_names_joined = true;
        query
            .leftJoin(CasinoGameModel.tableName, `${CasinoGameModel.tableName}.id`, `${this.baseTableName}.casino_game_id`)
            .leftJoin(`${CasinoGamesTranslationModel.tableName}`, function() {
                this.on(`${CasinoGamesTranslationModel.tableName}.casino_game_id`, `${CasinoGameModel.tableName}.id`);
                this.andOn(`${CasinoGamesTranslationModel.tableName}.website_id`, DEFAULT_WEB_SITE);
                this.andOn(`${CasinoGamesTranslationModel.tableName}.channel_id`, ChannelType.BACKEND);
                this.andOn(`${CasinoGamesTranslationModel.tableName}.lang_id`, DEFAULT_LANGUAGE);
            });
    }
    protected joinUsers(query): void {
        query.join(`${User.tableName}`, `${User.tableName}.id`, `${this.baseTableName}.user_id`);
    }

    protected userFilter(query): void {
        if (this.user_id) query.where(`${this.baseTableName}.user_id`, this.user_id);
        if (this.user_country_id && this.user_country_id.length) query.whereIn(`${User.tableName}.country`, this.user_country_id);
        if (this.user_group_id && this.user_group_id.length) query.whereIn(`${User.tableName}.risk_group_id`, this.user_group_id);
        if (this.user_status_id && this.user_status_id.length) query.whereIn(`${User.tableName}.verification_status`, this.user_status_id);
        if (this.user_name) {
            query.whereRaw(`
            (${User.tableName}.username ilike '%${this.user_name}%'
            OR ${User.tableName}.email ilike '%${this.user_name}%'
            OR ${User.tableName}.last_name ilike '%${this.user_name}%' 
            OR ${User.tableName}.first_name ilike '%${this.user_name}%'
            OR ${User.tableName}.first_name || ' ' || ${User.tableName}.last_name ilike '%${this.user_name}%'
            )`);
        }
        if (this.user_registration_ip) query.where(`${User.tableName}.registration_ip`, `ilike`, `%${this.user_registration_ip}%`);
    }

    public async findToCSV(data: ICustomRTMFilter): Promise<Buffer[]> {
        if (isNotNumber(data.user_id)) throw ErrorUtil.newError(ErrorCodes.INVALID_CUSTOMER_ID);
        if (!data.fields || !data.fields.length) throw ErrorUtil.newError(ErrorCodes.BAD_REQUEST);
        const selectedFields = this.wrapFields(data.fields.filter(f => f !== "undefined")).filter(a => a.toString().length);
        const query = QueryBuilder(`${CasinoRtmModel.tableName} as ${this.baseTableName}`)
            .select(selectedFields)
            .orderBy(this.sort_by, this.sort_order)
            .join(WebsiteModel.tableName, `${WebsiteModel.tableName}.id`, `${this.baseTableName}.website_id`);
        // join casino_translation
        query.joinRaw(`
                    left join ${CasinoTranslationModel.tableName} 
                    on ${CasinoTranslationModel.tableName}.casino_id = ${this.baseTableName}.provider_id
                    and ${CasinoTranslationModel.tableName}.website_id = ${DEFAULT_WEB_SITE}
                    and ${CasinoTranslationModel.tableName}.channel_id = ${ChannelType.BACKEND}
                    and ${CasinoTranslationModel.tableName}.lang_id = ${DEFAULT_LANGUAGE}
                `);
        // join casino_games_translation
        this.joinCasinoGameNames(query);
        // add filter logic
        this.setWhere(query);
        return BaseModel.manyOrNoneRaw(query.toString());
    }

    protected setWhere(query): void {
        this.joinUsers(query);
        if (isRealString(this.game_name)) {
            this.joinCasinoGameNames(query);
            query.where(`${CasinoGamesTranslationModel.tableName}.name`, "ilike", `%${this.game_name}%`);
        }
        if (!isNotNumber(this.id)) query.where(`${this.baseTableName}.id`, this.id);
        if (!isNotNumber(this.id)) query.where(`${this.baseTableName}.id`, this.id);
        if (isNumber(this.game_id)) query.where(`${this.baseTableName}.casino_game_id`, this.game_id);
        if (isRealString(this.game_ip)) query.where(`${this.baseTableName}.ip`, `ilike`, `%${this.game_ip}%`);
        if (isRealString(this.game_ip_country)) query.where(`${this.baseTableName}.ip_country`, `ilike`, `%${this.game_ip_country}%`);
        if (!isNotNumber(this.game_currency_id)) query.where(`${this.baseTableName}.currency_id`, this.game_currency_id);
        if (!isNotNumber(this.game_provider_id)) query.where(`${this.baseTableName}.provider_id`, this.game_provider_id);
        if (!isNotNumber(this.game_status_id)) query.where(`${this.baseTableName}.status_id`, this.game_status_id);
        if (!isNotNumber(this.channel_id)) query.where(`${this.baseTableName}.channel_id`, this.channel_id);
        if (!isNotNumber(this.website_id)) query.where(`${this.baseTableName}.website_id`, this.website_id);
        if (this.bet_type_id && this.bet_type_id.length) query.whereIn(`${this.baseTableName}.bet_type_id`, this.bet_type_id);
        if (this.user_balance_before_from && this.user_balance_before_to)
            query.whereBetween(`${this.baseTableName}.balance_before`, [this.user_balance_before_from, this.user_balance_before_to]);
        if (this.user_balance_after_from && this.user_balance_after_to)
            query.whereBetween(`${this.baseTableName}.balance_after`, [this.user_balance_after_from, this.user_balance_after_to]);

        if (!isNil(this.game_placement_time_from)) query.where(`${this.baseTableName}.created`, ">=", new Date(this.game_placement_time_from).toISOString());
        if (!isNil(this.game_placement_time_to)) query.where(`${this.baseTableName}.created`, "<=", new Date(this.game_placement_time_to).toISOString());

        if (!isNotNumber(this.game_bet_number_from) || !isNotNumber(this.game_bet_number_to)) {
            this.game_bet_number_from = this.game_bet_number_from || 1;
            if (!isNotNumber(this.game_bet_number_to)) {
                query.whereBetween(`${this.baseTableName}.bet_number`, [this.game_bet_number_from, this.game_bet_number_to]);
            } else {
                query.where(`${this.baseTableName}.bet_number`, `>`, this.game_bet_number_from);
            }
        }
        this.userFilter(query);
    }

    public async findList(): Promise<IListWithPagination> {
        let full_count: number = 0;
        let data: CasinoRtmModel[] = [];
        let total;
        this.onlyCount = true;
        const count = await CountModel.one(this.queryList);

        if (count) {
            full_count = count.count;
            this.onlyCount = false;
            data = await CasinoRtmModel.manyOrNone(this.queryList);
            total = await CasinoRtmTotalModel.oneOrNone(this.getSum);
        }

        return {
            full_count,
            data: {
                data,
                total
            }
        };
    }

    public async findOne(): Promise<ICasinoRtm | undefined> {
        this.unlimit = false;
        this.limit = 1;
        this.page = 0;
        this.onlyCount = false;
        return CasinoRtmModel.oneOrNone(this.queryList);
    }

    private wrapFields(fields: string[]) {
        return fields.map(field => {
            switch (field) {
                case "status_id":
                    return QueryBuilder.raw(`CASE 
                    WHEN ${this.baseTableName}.status_id = 1 THEN 'Active'
                    WHEN ${this.baseTableName}.status_id = 2 THEN 'Won'
                    WHEN ${this.baseTableName}.status_id = 3 THEN 'Lost'
                    WHEN ${this.baseTableName}.status_id = 4 THEN 'Bet Reverse'
                END as status`);
                case "game_currency_id":
                case "currency_id":
                    return QueryBuilder.raw(`CASE 
                    WHEN ${this.baseTableName}.currency_id = 1 THEN 'USD'
                    WHEN ${this.baseTableName}.currency_id = 2 THEN 'UAH'
                    WHEN ${this.baseTableName}.currency_id = 3 THEN 'RUB'
                    WHEN ${this.baseTableName}.currency_id = 4 THEN 'EUR'
                    WHEN ${this.baseTableName}.currency_id = 6 THEN 'GBP'
                    WHEN ${this.baseTableName}.currency_id = 8 THEN 'KZT'
                    WHEN ${this.baseTableName}.currency_id = 9 THEN 'TRY'
                    WHEN ${this.baseTableName}.currency_id = 10 THEN 'CNY'
                    WHEN ${this.baseTableName}.currency_id = 11 THEN 'IDR'
                END as currency`);
                case "bet_type_id":
                    return QueryBuilder.raw(`CASE 
                    WHEN ${this.baseTableName}.bet_type_id = 1 THEN 'Spin'
                    WHEN ${this.baseTableName}.bet_type_id = 2 THEN 'Respin'
                    WHEN ${this.baseTableName}.bet_type_id = 3 THEN 'Free Spin'
                    WHEN ${this.baseTableName}.bet_type_id = 4 THEN 'Bonus Spin'
                END as bet_type`);
                case "channel_id":
                    return QueryBuilder.raw(`CASE 
                    WHEN ${this.baseTableName}.channel_id = 1 THEN 'Web'
                    WHEN ${this.baseTableName}.channel_id = 2 THEN 'Mobile'
                    WHEN ${this.baseTableName}.channel_id = 3 THEN 'Tablet'
                    WHEN ${this.baseTableName}.channel_id = 4 THEN 'Desktop'
                    WHEN ${this.baseTableName}.channel_id = 5 THEN 'Backend'
                END as channel`);
                case "ggr_website_currency":
                    return QueryBuilder.raw(`(real_stake_usd - real_won_amount_usd) as ggr_usd`);
                case "user_group_id":
                    return `${User.tableName}.risk_group_id`;
                case "ggr":
                    return QueryBuilder.raw(`(real_stake - real_won_amount) as ggr`);
                case "user_balance_after_usd":
                    return `${this.baseTableName}.balance_after_usd `;
                case "user_balance_before_usd":
                    return `${this.baseTableName}.balance_before_usd`;
                case "game_status_id":
                    return QueryBuilder.raw(`CASE 
                    WHEN ${this.baseTableName}.status_id = 1 THEN 'Active'
                    WHEN ${this.baseTableName}.status_id = 2 THEN 'Won'
                    WHEN ${this.baseTableName}.status_id = 3 THEN 'Lost'
                    WHEN ${this.baseTableName}.status_id = 4 THEN 'Bet Reverse'
                END as game_status`);
                case "game_won_amount":
                    return `${this.baseTableName}.won_amount`;
                case "game_won_amount_real":
                    return `${this.baseTableName}.real_won_amount as won_amount_real`;
                case "game_won_amount_real_usd":
                    return `${this.baseTableName}.real_won_amount_usd as won_amount_real_usd`;
                case "game_won_amount_bonus":
                    return `${this.baseTableName}.bonus_won_amount as won_amount_bonus`;
                case "game_stake":
                    return `${this.baseTableName}.stake`;
                case "game_stake_real":
                    return `${this.baseTableName}.real_stake as stake_real`;
                case "game_stake_real_usd":
                    return `${this.baseTableName}.real_stake_usd as stake_real_usd`;
                case "game_stake_bonus":
                    return `${this.baseTableName}.bonus_stake as stake_bonus`;
                case "game_website_currency_id":
                    return QueryBuilder.raw(`CASE 
                    WHEN ${WebsiteModel.tableName}.currency_id = 1 THEN 'USD'
                    WHEN ${WebsiteModel.tableName}.currency_id = 2 THEN 'UAH'
                    WHEN ${WebsiteModel.tableName}.currency_id = 3 THEN 'RUB'
                    WHEN ${WebsiteModel.tableName}.currency_id = 4 THEN 'EUR'
                    WHEN ${WebsiteModel.tableName}.currency_id = 6 THEN 'GBP'
                END as company_currency`);
                case "game_id":
                    return `${CasinoGamesTranslationModel.tableName}.casino_game_id as game_id`;
                case "game_ip_country":
                    return `${this.baseTableName}.ip_country`;
                case "game_ip":
                    return `${this.baseTableName}.ip as bet_ip`;
                case "game_bet_number":
                    return `${this.baseTableName}.bet_number`;
                case "game_provider_name":
                    return `${CasinoTranslationModel.tableName}.name`;
                case "country":
                    return `${this.baseTableName}.ip_country as bet_country`;
                case "risk_group":
                    return `${RiskGroupModel.tableName}.name`;
                case "user_country":
                    return `${User.tableName}.country`;
                case "website":
                    return `${WebsiteModel.tableName}.name`;
                case "user_registration_ip":
                    return `${User.tableName}.registration_ip`;
                case "game_placement_time":
                    return `${this.baseTableName}.created`;
                case "user_status_id":
                    return QueryBuilder.raw(`CASE 
                    WHEN ${User.tableName}.status_id = 1 THEN 'Active'
                    WHEN ${User.tableName}.status_id = 2 THEN 'Blocked'
                END as user_status`);
                case "game_name":
                    return `${CasinoGamesTranslationModel.tableName}.name as game_name`;
                case "bet_time":
                    return `${this.baseTableName}.created as game_placement_time`;
                case "game_provider_id":
                    return `${CasinoTranslationModel.tableName}.name as provider`;
                case "id":
                    return `${this.baseTableName}.id as bet_id`;
                case "user_id":
                    return `${this.baseTableName}.user_id as customer_id`;
                case "website_id":
                    return `${WebsiteModel.tableName}.name as website`;
                case "user_balance_before":
                    return `${this.baseTableName}.balance_before as user_balance_before`;
                case "user_balance_after":
                    return `${this.baseTableName}.balance_after as user_balance_after`;
                case "user_name":
                    return QueryBuilder.raw(`
                CASE 
                    WHEN ${User.tableName}.first_name IS NOT NULL AND ${User.tableName}.last_name IS NOT NULL 
                        THEN CONCAT(${User.tableName}.first_name, ' ', ${User.tableName}.last_name)
                    WHEN ${User.tableName}.first_name IS NOT NULL 
                        THEN ${User.tableName}.first_name
                    WHEN ${User.tableName}.last_name  IS NOT NULL 
                        THEN ${User.tableName}.last_name
                    WHEN ${User.tableName}.username IS NOT NULL 
                        THEN ${User.tableName}.username
                    WHEN ${User.tableName}.email IS NOT NULL 
                        THEN ${User.tableName}.email
                    ELSE '(Unknown)'
                END AS customer_name
            `);
                default:
                    return `${this.baseTableName}.${field}`;
            }
        });
    }
}
