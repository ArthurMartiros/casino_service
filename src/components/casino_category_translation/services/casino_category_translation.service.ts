import { ServiceWithRequestInfo } from "../../../../../CommonJS/src/components/service_with_request_info/service_with_request_info";
import { isUndefined } from "util";
import { ErrorUtil, ErrorCodes } from "../../../../../CommonJS/src/messaging/ErrorCodes";
import { ICasinoCategoryTranslation, ICasinoCategoryTranslationFilter } from "../interfaces/Category_translation.interface";
import { CasinoCategoryTranslationFilter } from "../filters/category_translation.filter";
import { isNotNumber } from "../../../../../CommonJS/src/utils/validators";
import { map } from "bluebird";
import { CasinoCategoryTranslationModel } from "../models/category_translation.model";

export class CasinoCategoryTranslationService extends ServiceWithRequestInfo {
    public async getList(filter: ICasinoCategoryTranslationFilter): Promise<ICasinoCategoryTranslation[]> {
        if (isNotNumber(filter.casino_category_id)) throw ErrorUtil.newError(ErrorCodes.BAD_REQUEST);
        return CasinoCategoryTranslationFilter.findList(filter);
    }

    public async setList(casino_category_id: number, data: ICasinoCategoryTranslation[]): Promise<ICasinoCategoryTranslation[]> {
        // validate request
        if (isNotNumber(casino_category_id)) throw ErrorUtil.newError(ErrorCodes.BAD_REQUEST);
        return map(data, async item => {
            // validate lang_id
            if (isNotNumber(item.lang_id)) throw ErrorUtil.newError(ErrorCodes.BAD_REQUEST);
            // set casino category id to translation
            item.casino_category_id = casino_category_id;
            // find existing tranlsation
            const translation = await CasinoCategoryTranslationModel.findOne({ casino_category_id, lang_id: item.lang_id });
            // if not found create new one
            if (isUndefined(translation)) return new CasinoCategoryTranslationModel(item).saveWithID();
            // update existing translation
            return translation.update(item);
        });
    }

    public async deleteList(casino_category_id: number): Promise<void> {
        // validate request
        if (isNotNumber(casino_category_id)) throw ErrorUtil.newError(ErrorCodes.BAD_REQUEST);
        // delete translations
        await CasinoCategoryTranslationModel.delete({ casino_category_id });
    }
}
