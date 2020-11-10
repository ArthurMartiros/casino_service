import { CasinoExtraSpinType } from "../enums/casino_extra_spin.enum";
import { ICasinoExtraSpinFilter } from "../interfaces/casino_extra_spin.interface";
import { QueryBuilder, RawParam } from "../../../../../CommonJS/src/base/base.model";
import { CasinoExtraSpin, CasinoExtraSpinPublic } from "../models/casino_extra_spin.model";
import { isNotNumber, toBoolean, isRealNumber } from "../../../../../CommonJS/src/utils/validators";
import { CasinoGamesTranslationModel } from "../../casino_game_translation/models/casino_games_translation.model";
import { ChannelType } from "../../../../../CommonJS/src/enums/channel_type.enum";
import { NormalizeLimit, NormalizePage } from "../../../../../CommonJS/src/utils/utils";
import { BonusType } from "../../../../../CoreService/src/components/bonuses/base/enums/bonus_type.enum";
import { CurrencyModel } from "../../../../../CoreService/src/components/currencies/models/currency.model";
import { CountModel } from "../../../../../CommonJS/src/components/count_model/count.model";
import { DEFAULT_LANGUAGE, DEFAULT_WEB_SITE } from "../../../../../CommonJS/src/domain/constant";
import { BonusWallet } from "../../bonus_wallet/models/bonus_wallet.model";
import { isNil } from "lodash";
import { IListWithPagination } from "../../../../../CommonJS/src/interfaces/list_with_pagination.interface";

export class CasinoExtraSpinFilter implements ICasinoExtraSpinFilter {
    public id?: number;
    public date_from?: Date;
    public date_to?: Date;
    public type_id?: CasinoExtraSpinType;
    public user_id?: number;
    public bonus_type_id?: BonusType;
    public bet_amount_from?: number;
    public bet_amount_to?: number;
    public currency_id?: number;
    public personal_id?: number;
    public casino_game_id?: number;
    public include_won_amount?: boolean;
    public include_count?: boolean;
    public limit: number;
    public page: number;
    public sort_by?: string;
    public sort_order?: string;
    public website_id?: number;

    constructor(data: ICasinoExtraSpinFilter) {
        this.id = data.id;
        this.date_from = data.date_from;
        this.date_to = data.date_to;
        this.type_id = data.type_id;
        this.user_id = data.user_id;
        this.bonus_type_id = data.bonus_type_id;
        this.bet_amount_from = data.bet_amount_from || 0;
        this.bet_amount_to = data.bet_amount_to || Number.MAX_SAFE_INTEGER;
        this.currency_id = data.currency_id;
        this.personal_id = data.personal_id;
        this.casino_game_id = data.casino_game_id;
        this.include_won_amount = toBoolean(data.include_won_amount, false);
        this.include_count = toBoolean(data.include_count, false);
        this.page = NormalizePage((data.page || 1) - 1);
        this.limit = NormalizeLimit(data.limit);
        this.sort_by = data.sort_by || `id`;
        this.sort_order = data.sort_order || `DESC`;
        this.website_id = data.website_id || DEFAULT_WEB_SITE;
    }

    public async find(): Promise<IListWithPagination> {
        const query = QueryBuilder(`${CasinoExtraSpin.tableName} as extra`)
            .join(CasinoGamesTranslationModel.tableName, function() {
                this.on(`${CasinoGamesTranslationModel.tableName}.casino_game_id`, `extra.casino_game_id`);
                this.andOn(`${CasinoGamesTranslationModel.tableName}.lang_id`, RawParam(DEFAULT_LANGUAGE));
                this.andOn(`${CasinoGamesTranslationModel.tableName}.channel_id`, RawParam(ChannelType.BACKEND));
            })
            .join(CurrencyModel.tableName, `${CurrencyModel.tableName}.id`, `extra.currency_id`);
        if (this.include_won_amount)
            query
                .leftJoin(BonusWallet.tableName, `${BonusWallet.tableName}.bonus_id`, `extra.id`)
                .select(QueryBuilder.raw(`COALESCE(${BonusWallet.tableName}.initial_balance, 0) as won_amount`));
        query
            .select(`extra.*`)
            .select(`${CasinoGamesTranslationModel.tableName}.name as casino_game_name`)
            .select(`${CurrencyModel.tableName}.code as currency_code`)
            .limit(this.limit)
            .offset(this.page * this.limit)
            .orderBy(<string>this.sort_by, this.sort_order);

        if (this.id) query.where(`extra.id`, this.id);
        if (this.currency_id) query.where(`extra.currency_id`, this.currency_id);
        if (this.bonus_type_id) query.where(`extra.bonus_type_id`, this.bonus_type_id);
        if (this.casino_game_id) query.where(`extra.casino_game_id`, this.casino_game_id);
        if (this.personal_id) query.where(`extra.personal_id`, this.personal_id);
        if (this.user_id) query.where(`extra.user_id`, this.user_id);
        if (this.type_id) query.where(`extra.type_id`, this.type_id);
        if (this.website_id) query.where(`extra.website_id`, this.website_id);
        if (!isNil(this.date_from)) query.where(`extra.created`, ">=", new Date(this.date_from).toISOString());
        if (!isNil(this.date_to)) query.where(`extra.created`, "<=", new Date(this.date_to).toISOString());
        if (isRealNumber(this.bet_amount_from) && isRealNumber(this.bet_amount_to))
            query.whereBetween("extra.bet_amount", [this.bet_amount_from, this.bet_amount_to]);
        else if (isRealNumber(this.bet_amount_from) && isNotNumber(this.bet_amount_to)) query.where(`extra.bet_amount >= ${this.bet_amount_from}`);
        else if (isNotNumber(this.bet_amount_to) && isRealNumber(this.bet_amount_to)) query.where(`extra.bet_amount <= ${this.bet_amount_to}`);
        // get data
        const data = await CasinoExtraSpinPublic.manyOrNone(query);
        // count
        let count = { count: 0 };
        if (this.include_count) {
            if (this.user_id)
                count = await CountModel.one(QueryBuilder.raw(`select count(*) from ${CasinoExtraSpin.tableName} where user_id = ${this.user_id}`));
            else count = await CountModel.one(QueryBuilder.raw(`select count(*) from ${CasinoExtraSpin.tableName}`));
        }
        // return
        return <IListWithPagination>{
            full_count: count.count,
            data
        };
    }
}
