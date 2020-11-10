import { DEFAULT_LANGUAGE } from "../../../../../CommonJS/src/domain/constant";
import { ICasinoCategoryFilter, ICasinoCategoryPublic } from "../interfaces/casino_category.interaface";
import { QueryBuilder, RawParam } from "../../../../../CommonJS/src/base/base.model";
import { CasinoCategoryTranslationModel } from "../../casino_category_translation/models/category_translation.model";
import { CasinoCategoryPublic } from "../models/casino_category.public.model";
import { CasinoCategoryModel } from "../models/casino_category.model";
import { toBoolean } from "../../../../../CommonJS/src/utils/validators";
import { CasinoGameModel } from "../../casino_game/models/casino_game.model";
import { CasinoGameStatus } from "../../casino_game/enums/casino_game_status.enum";
import { ChannelType } from "../../../../../CommonJS/src/enums/channel_type.enum";
import { CasinoID } from "../../casino/enums/casino.enum";

export class CasinoCategoryFilter implements ICasinoCategoryFilter {
    public id?: number;
    public lang_id: number;
    public is_admin: boolean;
    public channel_id: ChannelType;

    constructor(filter: ICasinoCategoryFilter) {
        this.id = filter.id;
        this.lang_id = filter.lang_id || DEFAULT_LANGUAGE;
        this.is_admin = toBoolean(filter.is_admin, false);
        this.channel_id = filter.channel_id || ChannelType.BACKEND;
    }

    public static async find(filter: ICasinoCategoryFilter): Promise<ICasinoCategoryPublic[]> {
        filter = new CasinoCategoryFilter(filter);
        const query = QueryBuilder(`${CasinoCategoryModel.tableName} AS cc`).select(`cc.*`);
        if (filter.id) query.where("cc.id", filter.id);
        if (filter.lang_id !== DEFAULT_LANGUAGE) {
            query
                .leftJoin(`${CasinoCategoryTranslationModel.tableName} as def_tr`, function() {
                    this.on(`def_tr.casino_category_id`, `cc.id`);
                    this.andOn(`def_tr.lang_id`, RawParam(DEFAULT_LANGUAGE));
                })
                .leftJoin(`${CasinoCategoryTranslationModel.tableName} as tr`, function() {
                    this.on(`tr.casino_category_id`, `cc.id`);
                    this.andOn(`tr.lang_id`, RawParam(filter.lang_id as number));
                })
                .select([
                    QueryBuilder.raw(`COALESCE(tr.name, def_tr.name) as name`),
                    QueryBuilder.raw(`COALESCE(tr.casino_category_id, def_tr.casino_category_id) as category`)
                ]);
        } else {
            query
                .leftJoin(CasinoCategoryTranslationModel.tableName, function() {
                    this.on(`${CasinoCategoryTranslationModel.tableName}.casino_category_id`, `cc.id`);
                    this.andOn(`${CasinoCategoryTranslationModel.tableName}.lang_id`, RawParam(filter.lang_id as number));
                })
                .select([`${CasinoCategoryTranslationModel.tableName}.casino_category_id`, `${CasinoCategoryTranslationModel.tableName}.name`]);
        }
        if (!filter.is_admin) {
            query
                .join(`${CasinoGameModel.tableName} as cg`, `cg.category`, `cc.id`)
                .where(`cg.status_id`, CasinoGameStatus.ACTIVE)
                .where(`cg.has_lobby`, false)
                .distinct();

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
        }
        return CasinoCategoryPublic.manyOrNone(query);
    }
}
