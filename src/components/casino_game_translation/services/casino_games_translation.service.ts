import { map } from "bluebird";
import { isUndefined } from "util";
import { ServiceWithRequestInfo } from "../../../../../CommonJS/src/components/service_with_request_info/service_with_request_info";
import { ErrorCodes, ErrorUtil } from "../../../../../CommonJS/src/messaging/ErrorCodes";
import { isNotNumber } from "../../../../../CommonJS/src/utils/validators";

import { ICasinoGamesTranslation } from "../interfaces/casino_games_translation.interface";
import { CasinoGamesTranslationFilter } from "../filters/casino_games_translation.filter";
import { CasinoGamesTranslationModel } from "../models/casino_games_translation.model";
import { ICasinoGamesTranslationFilter } from "../interfaces/casino_games_translation_filter.interface";
import { cloneDeep } from "lodash";

export class CasinoGamesTranslationService extends ServiceWithRequestInfo {
    public async getList(filter: ICasinoGamesTranslationFilter): Promise<ICasinoGamesTranslation[]> {
        if (isNotNumber(filter.casino_game_id)) throw ErrorUtil.newError(ErrorCodes.BAD_REQUEST);
        return new CasinoGamesTranslationFilter(Object.assign(this.requestInfo, filter)).findList();
    }

    public async setList(casino_game_id: number, data: ICasinoGamesTranslation[]): Promise<ICasinoGamesTranslation[]> {
        const requestInfo = cloneDeep(this.requestInfo);
        if (isNotNumber(casino_game_id)) throw ErrorUtil.newError(ErrorCodes.BAD_REQUEST);

        return map(data, async (item: ICasinoGamesTranslation) => {
            if (isNotNumber(item.channel_id)) throw ErrorUtil.newError(ErrorCodes.BAD_REQUEST);

            item.casino_game_id = casino_game_id;
            if (isNotNumber(item.lang_id)) item.lang_id = requestInfo.lang_id;
            if (isNotNumber(item.website_id)) item.website_id = requestInfo.website_id;

            const byFields = {
                casino_game_id,
                website_id: item.website_id,
                channel_id: item.channel_id,
                lang_id: item.lang_id
            };

            let translation = await CasinoGamesTranslationModel.findOne(byFields);

            if (isUndefined(translation)) {
                translation = await new CasinoGamesTranslationModel(item).save();
            } else {
                translation = await translation.update(item, byFields);
            }

            return translation;
        });
    }

    public async saveTranslation(data: ICasinoGamesTranslation) {
        const byFields = {
            casino_game_id: data.casino_game_id
        };
        const translation = await CasinoGamesTranslationModel.findOne(byFields);
        if (isUndefined(translation)) {
            const result = await CasinoGamesTranslationModel.save(data);
            return result;
        } else {
            const result = await CasinoGamesTranslationModel.update(data);
            return result;
        }
    }

    public async deleteList(casino_game_id: number): Promise<void> {
        if (isNotNumber(casino_game_id)) throw ErrorUtil.newError(ErrorCodes.BAD_REQUEST);
        await CasinoGamesTranslationModel.delete({ casino_game_id });
    }
}
