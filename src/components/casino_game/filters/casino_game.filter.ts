import { CasinoGameModel, CasinoGameAdminModel } from "../models/casino_game.model";
import { ICasinoGameFilter, ICasinoGamePublicModel, ICasinoGameModel } from "../interfaces/casino_game.interface";
import { QueryBuilder, RawParam } from "../../../../../CommonJS/src/base/base.model";
import { isNotNumber, toBoolean } from "../../../../../CommonJS/src/utils/validators";
import { DEFAULT_LANGUAGE, DEFAULT_WEB_SITE } from "../../../../../CommonJS/src/domain/constant";
import { ChannelType } from "../../../../../CommonJS/src/enums/channel_type.enum";
import { isNil, toNumber } from "lodash";
import { CasinoGamesTranslationModel } from "../../casino_game_translation/models/casino_games_translation.model";
import { CasinoGamePublicModel } from "../models/casino_game_public.model";
import { NormalizePage, NormalizeLimit } from "../../../../../CommonJS/src/utils/utils";
import { CasinoGameOrderModel } from "../../casino_game_order/models/casino_game_order.model";
import { CasinoGameStatus } from "../enums/casino_game_status.enum";
import { WebsiteCasinoModel } from "../../website_casino/models/website_casino.model";
import { GameSort } from "../enums/casino_game_sort.enum";
import { CasinoID } from "../../casino/enums/casino.enum";
import { isString } from "util";

export class CasinoGameFilter implements ICasinoGameFilter {
    public lang_id?: number;
    public id?: number;
    public ids?: number[];
    public game_ids?: number[];
    public categories?: number[];
    public category?: number;
    public name?: string;
    public absolute_games?: string[];
    public unlimit?: boolean;
    public page: number;
    public limit: number;
    public website_id?: number;
    public channel_id?: ChannelType;
    public status_id?: CasinoGameStatus;
    public is_admin: boolean;
    public provider_id?: number;
    public sort_by?: GameSort;

    constructor(filter: ICasinoGameFilter) {
        this.website_id = toNumber(filter.website_id) || DEFAULT_WEB_SITE;
        this.channel_id = toNumber(filter.channel_id) || ChannelType.BACKEND;
        this.lang_id = toNumber(filter.lang_id) || DEFAULT_LANGUAGE;
        this.page = NormalizePage(filter.page);
        if (this.page <= 0) this.page = 1;
        this.limit = NormalizeLimit(filter.limit);
        this.unlimit = toBoolean(filter.unlimit, false);
        this.id = filter.id;
        this.ids = filter.ids;
        this.name = filter.name;
        this.game_ids = filter.game_ids;
        this.category = filter.category;
        this.categories = filter.categories;
        this.absolute_games = filter.absolute_games;
        this.status_id = filter.status_id;
        this.is_admin = filter.is_admin;
        if (!this.is_admin && isNil(this.status_id)) this.status_id = CasinoGameStatus.ACTIVE;
        this.provider_id = filter.provider_id;
        this.sort_by = filter.sort_by;
    }

    private static setQueryWhereIn(query, field, values) {
        if (values && values.length) query.whereIn(field, values);
    }

    public static async findAllByFilter(data: ICasinoGameFilter): Promise<(ICasinoGamePublicModel | ICasinoGameModel)[]> {
        const filter = new CasinoGameFilter(data);

        const query = QueryBuilder(`${CasinoGameModel.tableName} AS cg`)
            .select(`cg.*`)
            .where(`cg.has_lobby`, false);

        this.setQueryWhereIn(query, "cg.id", filter.ids);
        this.setQueryWhereIn(query, "cg.game_id", filter.game_ids);
        this.setQueryWhereIn(query, "cg.category", filter.categories);
        this.setQueryWhereIn(query, "cg.absolute_name", filter.absolute_games);
        if (!isNotNumber(filter.id)) query.where("cg.id", filter.id);
        if (filter.status_id) query.where("cg.status_id", filter.status_id);
        if (filter.provider_id) query.where({ provider_id: filter.provider_id });
        if (filter.category) query.where({ category: filter.category });

        if (!isNotNumber(filter.website_id)) {
            query
                .join(`${WebsiteCasinoModel.tableName} as wc`, function() {
                    this.on(`wc.casino_id`, "cg.provider_id").andOn(`wc.website_id`, RawParam(filter.website_id as number));
                })
                .select("wc.website_id")
                .select("wc.casino_id");
        }

        if (filter.website_id !== DEFAULT_WEB_SITE || filter.channel_id !== ChannelType.BACKEND || filter.lang_id !== DEFAULT_LANGUAGE) {
            query
                .leftJoin(`${CasinoGamesTranslationModel.tableName} as def_tr`, function() {
                    this.on(`def_tr.casino_game_id`, `cg.id`);
                    this.andOn(`def_tr.website_id`, RawParam(DEFAULT_WEB_SITE));
                    this.andOn(`def_tr.channel_id`, RawParam(ChannelType.BACKEND));
                    this.andOn(`def_tr.lang_id`, RawParam(DEFAULT_LANGUAGE));
                })
                .leftJoin(`${CasinoGamesTranslationModel.tableName} as tr`, function() {
                    this.on(`tr.casino_game_id`, `cg.id`);
                    this.andOn(`tr.website_id`, RawParam(filter.website_id as number));
                    this.andOn(`tr.channel_id`, RawParam(filter.channel_id as number));
                    this.andOn(`tr.lang_id`, RawParam(filter.lang_id as number));
                })
                .select([
                    QueryBuilder.raw(`COALESCE(tr.name, def_tr.name) as name`),
                    QueryBuilder.raw(`COALESCE(tr.alt_name, def_tr.alt_name) as alt_name`),
                    QueryBuilder.raw(`COALESCE(tr.description, def_tr.description) as description`)
                ]);
            if (filter.name) {
                const gameName = filter.name.replace("'", "''");
                query.whereRaw(`COALESCE(tr.name, def_tr.name) ilike '%${gameName}%'`);
            }
        } else {
            query
                .leftJoin(CasinoGamesTranslationModel.tableName, function() {
                    this.on(`${CasinoGamesTranslationModel.tableName}.casino_game_id`, `cg.id`);
                    this.andOn(`${CasinoGamesTranslationModel.tableName}.website_id`, RawParam(filter.website_id as number));
                    this.andOn(`${CasinoGamesTranslationModel.tableName}.channel_id`, RawParam(filter.channel_id as number));
                    this.andOn(`${CasinoGamesTranslationModel.tableName}.lang_id`, RawParam(filter.lang_id as number));
                })
                .select([
                    `${CasinoGamesTranslationModel.tableName}.name`,
                    `${CasinoGamesTranslationModel.tableName}.alt_name`,
                    `${CasinoGamesTranslationModel.tableName}.description`
                ]);
            if (filter.name) {
                const gameName = filter.name.replace("'", "''");
                query.whereRaw(`${CasinoGamesTranslationModel.tableName}.name ilike '%${gameName}%'`);
            }
        }
        if (filter.channel_id === ChannelType.MOBILE) {
            query.where(`cg.is_mobile`, true);
        } else {
            query.whereRaw(
                `(cg.is_mobile = false or cg.provider_id in (${CasinoID.EVOPLAY}, ${CasinoID.SLOTEGRATOR_GAMEART}, ${CasinoID.SLOTEGRATOR_BETGAMES}, ${
                    CasinoID.SLOTEGRATOR_IGROSOFT
                }, ${CasinoID.SLOTEGRATOR_BOOONGO}, ${CasinoID.SLOTEGRATOR_REDRAKE}, ${CasinoID.SLOTEGRATOR_PLATIPUS}, ${CasinoID.SLOTEGRATOR_AMATIC}, ${
                    CasinoID.SLOTEGRATOR_SPINOMENAL
                }, ${CasinoID.SLOTEGRATOR_VIVOGAMING}, ${CasinoID.GAMSHY}, ${CasinoID.MASCOT}, ${CasinoID.PRAGMATIC}))`
            );
        }

        // join order table
        if (!isNotNumber(filter.category) && !isString(filter.name)) {
            query
                .joinRaw(
                    `${filter.is_admin ? "left" : ""} join ${CasinoGameOrderModel.tableName} as tar_order 
                    on 
                    tar_order.casino_game_id = cg.id 
                    and tar_order.website_id = ${filter.website_id}
                    and tar_order.channel_id = ${filter.channel_id}
                    ${!isNotNumber(filter.page) && !filter.is_admin ? `and tar_order.page = ${filter.page}` : ""}`
                )
                .select([`tar_order.position_x`, `tar_order.position_y`, `tar_order.weight`]);
        }
        if ((!filter.unlimit && isNotNumber(filter.category) && !filter.is_admin) || isString(filter.name)) {
            query.limit(filter.limit);
            query.offset((filter.page - 1) * filter.limit);
        }
        if (filter.sort_by) {
            query.orderBy(`cg.${filter.sort_by}`, "desc");
        }
        return filter.is_admin ? CasinoGameAdminModel.manyOrNone(query) : CasinoGamePublicModel.manyOrNone(query);
    }
}
