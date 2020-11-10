import { ServiceWithRequestInfo } from "../../../../../CommonJS/src/components/service_with_request_info/service_with_request_info";
import { ICasinoCategory, ICasinoCategoryPublic, ICasinoCategoryFilter } from "../interfaces/casino_category.interaface";
import { ErrorUtil, ErrorCodes } from "../../../../../CommonJS/src/messaging/ErrorCodes";
import { CasinoCategoryModel } from "../models/casino_category.model";
import { isNotNumber } from "../../../../../CommonJS/src/utils/validators";
import { CasinoCategoryTranslationService } from "../../casino_category_translation/services/casino_category_translation.service";
import { IMessage } from "../../../../../CommonJS/src/messaging/message.interface";
import { CasinoCategoryFilter } from "../filters/casino_category.filter";
import { isObject } from "util";
import { CasinoGameModel } from '../../casino_game/models/casino_game.model';

export class CasinoCategoryService extends ServiceWithRequestInfo {
    private casinoCategoryTranslationService = new CasinoCategoryTranslationService();

    public async setRequestInfo(msg: IMessage): Promise<void> {
        super.setRequestInfo(msg);
        await this.casinoCategoryTranslationService.setRequestInfo(msg);
    }

    public async findById(data: ICasinoCategoryFilter): Promise<ICasinoCategoryPublic> {
        if (isNotNumber(data.id)) throw ErrorUtil.newError(ErrorCodes.BAD_REQUEST);
        const [response] = await CasinoCategoryFilter.find({ id: +data.id });
        if (!response) throw ErrorUtil.newError(ErrorCodes.NOT_FOUND);
        return response;
    }

    public async create(data: ICasinoCategory): Promise<ICasinoCategory> {
        if (!isObject(data) || isNotNumber(data.order_id)) throw ErrorUtil.newError(ErrorCodes.BAD_REQUEST);
        const categoryModel = new CasinoCategoryModel(data);
        if (!categoryModel) throw ErrorUtil.newError(ErrorCodes.NOT_FOUND);
        return categoryModel.saveWithID();
    }

    public async update(data: ICasinoCategory): Promise<ICasinoCategory> {
        if (isNotNumber(data.id)) throw ErrorUtil.newError(ErrorCodes.BAD_REQUEST);
        const casinoCategoryModel = await CasinoCategoryModel.findOne({ id: data.id });
        if (!casinoCategoryModel) throw ErrorUtil.newError(ErrorCodes.NOT_FOUND);
        return new CasinoCategoryModel(Object.assign(casinoCategoryModel, data)).update();
    }

    public async remove(data: ICasinoCategoryFilter) {
        if (isNotNumber(data.id)) throw ErrorUtil.newError(ErrorCodes.BAD_REQUEST);
        const categoryModel = await CasinoCategoryModel.findOne({ id: data.id });
        if (!categoryModel) throw ErrorUtil.newError(ErrorCodes.NOT_FOUND);

        const games = await CasinoGameModel.findMany({ category: data.id });
        if (games.length > 0) throw ErrorUtil.newError(ErrorCodes.BAD_REQUEST);
        
        await CasinoCategoryModel.delete({ id: data.id });
        await this.casinoCategoryTranslationService.deleteList(data.id);
    }

    public async list(data: ICasinoCategoryFilter): Promise<ICasinoCategoryFilter[]> {
        data.is_admin = this.isAdminRequest;
        return CasinoCategoryFilter.find(Object.assign(this.requestInfo, data));
    }
}
