import { ServiceWithRequestInfo } from "../../../../../CommonJS/src/components/service_with_request_info/service_with_request_info";
import { ICasinoTranslation } from "../interfaces/casino_translation.interface";
import { isNotNumber } from "../../../../../CommonJS/src/utils/validators";
import { ErrorCodes, ErrorUtil } from "../../../../../CommonJS/src/messaging/ErrorCodes";
import { CasinoTranslationFilter } from "../filters/casino_translation.filter";
import { map } from "bluebird";
import { CasinoTranslationModel } from "../models/casino_translation.model";
import { isUndefined } from "util";
import { cloneDeep } from "lodash";

export class CasinoTranslationService extends ServiceWithRequestInfo {
    public async getList(casino_id: number): Promise<ICasinoTranslation[]> {
        if (isNotNumber(casino_id)) throw ErrorUtil.newError(ErrorCodes.BAD_REQUEST);
        return new CasinoTranslationFilter(Object.assign({ casino_id }, this.requestInfo)).findList();
    }

    public async setList(casino_id: number, data: ICasinoTranslation[]): Promise<ICasinoTranslation[]> {
        const requestInfo = cloneDeep(this.requestInfo);
        if (isNotNumber(casino_id)) throw ErrorUtil.newError(ErrorCodes.BAD_REQUEST);

        return map(data, async (item: ICasinoTranslation) => {
            if (isNotNumber(item.channel_id)) throw ErrorUtil.newError(ErrorCodes.BAD_REQUEST);

            item.casino_id = casino_id;
            if (isNotNumber(item.lang_id)) item.lang_id = requestInfo.lang_id;
            if (isNotNumber(item.website_id)) item.website_id = requestInfo.website_id;

            const byFields = {
                casino_id,
                website_id: item.website_id,
                channel_id: item.channel_id,
                lang_id: item.lang_id
            };

            let translation = await CasinoTranslationModel.findOne(byFields);

            if (isUndefined(translation)) {
                translation = await new CasinoTranslationModel(item).save();
            } else {
                translation = await translation.update(item, byFields);
            }

            return translation;
        });
    }

    public async deleteList(casino_id: number): Promise<void> {
        await CasinoTranslationModel.delete({ casino_id });
    }
}
