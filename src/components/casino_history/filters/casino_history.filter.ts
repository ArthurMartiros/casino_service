import { MAX_DATE, MIN_DATE, DEFAULT_LANGUAGE, DEFAULT_WEB_SITE } from "../../../../../CommonJS/src/domain/constant";
import { NormalizeLimit, NormalizePage } from "../../../../../CommonJS/src/utils/utils";
import { QueryBuilder, RawParam } from "../../../../../CommonJS/src/base/base.model";
import { CasinoBet } from "../../casino_bet/models/casino_bet.model";
import { CasinoGameModel } from "../../casino_game/models/casino_game.model";
import { CasinoBetPublic, CasinoBetCount } from "../models/casino_history.model";
import { ICasinoBetPublicFilter } from "../interfaces/casino_history.interface";
import { CasinoGamesTranslationModel } from "../../casino_game_translation/models/casino_games_translation.model";
import { ChannelType } from "../../../../../CommonJS/src/enums/channel_type.enum";
import { all } from "bluebird";
import { IListWithPagination } from "../../../../../CommonJS/src/interfaces/list_with_pagination.interface";

export class CasinoBetPublicFilter implements ICasinoBetPublicFilter {
    public place_date_from: Date;
    public place_date_to: Date;
    public user_id: number;
    public website_id: number;
    public lang_id: number;
    public page: number;
    public limit: number;

    constructor(data: ICasinoBetPublicFilter) {
        this.user_id = Number(data.user_id);
        this.place_date_from = data.place_date_from || MIN_DATE;
        this.place_date_to = data.place_date_to || MAX_DATE;
        this.page = NormalizePage(data.page);
        if (this.page > 0) this.page = this.page - 1;
        this.limit = NormalizeLimit(data.limit);
    }

    public async find(): Promise<IListWithPagination> {
        const query = QueryBuilder(CasinoBet.tableName)
            .select([
                `${CasinoBetPublic.tableName}.id`,
                `${CasinoBetPublic.tableName}.created`,
                `${CasinoBetPublic.tableName}.stake as amount`,
                `${CasinoBetPublic.tableName}.won_amount`,
                `${CasinoBetPublic.tableName}.status_id`,
                `${CasinoBetPublic.tableName}.user_id`,
                `${CasinoBetPublic.tableName}.casino_game_id`,
                `${CasinoGamesTranslationModel.tableName}.name as game_name`
            ])
            .join(CasinoGameModel.tableName, `${CasinoBetPublic.tableName}.casino_game_id`, `${CasinoGameModel.tableName}.id`)
            .join(CasinoGamesTranslationModel.tableName, function() {
                this.on(`${CasinoGameModel.tableName}.id`, `${CasinoGamesTranslationModel.tableName}.casino_game_id`)
                    .andOn(`${CasinoGamesTranslationModel.tableName}.website_id`, RawParam(DEFAULT_WEB_SITE))
                    .andOn(`${CasinoGamesTranslationModel.tableName}.channel_id`, RawParam(ChannelType.BACKEND))
                    .andOn(`${CasinoGamesTranslationModel.tableName}.lang_id`, RawParam(DEFAULT_LANGUAGE));
            })
            .limit(this.limit)
            .offset(this.page * this.limit)
            .orderBy(`${CasinoBetPublic.tableName}.created`, `DESC`);
        this.setWhere(query);
        // create count query
        const queryCount = QueryBuilder(CasinoBet.tableName).select(QueryBuilder.raw("count(*) as full_count"));
        this.setWhere(queryCount);
        // get data from db
        const data = await all([CasinoBetPublic.manyOrNone(query), CasinoBetCount.one(queryCount)]);
        // return data
        return <IListWithPagination>{
            data: data[0],
            full_count: data[1].full_count
        };
    }

    private setWhere(query) {
        query.where(`${CasinoBetPublic.tableName}.user_id`, this.user_id)
        .whereBetween(`${CasinoBetPublic.tableName}.created`, [new Date(this.place_date_from).toISOString(), new Date(this.place_date_to).toISOString()]);
    }
}
