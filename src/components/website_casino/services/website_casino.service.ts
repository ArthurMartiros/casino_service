import { ErrorUtil, ErrorCodes } from "../../../../../CommonJS/src/messaging/ErrorCodes";
import { IWebsiteCasinoModel, IWebsiteCasinoFilter } from "../interfaces/website_casino.interface";
import { WebsiteCasinoModel } from "../models/website_casino.model";
import { WebsiteCasinoFilter } from "../../website_casino/filters/website_casino.filter";
import { NOT_FOUND } from "http-status-codes";
import { isNaN, isObject } from "lodash";

export class WebsiteCasinoService {
    /**
     * @description create a website casino model
     */
    async create(data: IWebsiteCasinoModel): Promise<IWebsiteCasinoModel | undefined> {
        this.validateCreate(data);
        const websiteCasinoModel: WebsiteCasinoModel = await WebsiteCasinoModel.saveWithID(data);
        return websiteCasinoModel;
    }

    private validateCreate(data: IWebsiteCasinoModel): void {
        if (!isObject(data)) throw ErrorUtil.newError(ErrorCodes.BAD_REQUEST);
        data.website_id = <number>data.website_id;
        if (isNaN(data.website_id)) throw ErrorUtil.newError(ErrorCodes.BAD_REQUEST);
        data.casino_id = <number>data.casino_id;
        if (isNaN(data.casino_id)) throw ErrorUtil.newError(ErrorCodes.BAD_REQUEST);
    }

    /**
     * @description update a website casino model
     */
    async update(data: IWebsiteCasinoModel) {
        this.validateUpdate(data);
        const foundWebsiteCasinoModel = await WebsiteCasinoModel.findOne({ id: data.id });
        if (!foundWebsiteCasinoModel) return;
        return foundWebsiteCasinoModel.update(data);
    }

    private validateUpdate(data: IWebsiteCasinoModel): void {
        this.validateCreate(data);
        if (isNaN(data.id)) throw ErrorUtil.newError();
    }

    /**
     * @description get website casino models
     */
    public async list(filter: IWebsiteCasinoFilter): Promise<IWebsiteCasinoModel[]> {
        this.validateList(filter);
        return WebsiteCasinoFilter.FindAll(filter);
    }

    private validateList(filter: IWebsiteCasinoFilter): void {
        if (!isObject(filter)) throw ErrorUtil.newError(ErrorCodes.BAD_REQUEST);
        filter.website_id = +(<number>filter.website_id);
        if (isNaN(filter.website_id)) throw ErrorUtil.newError(ErrorCodes.BAD_REQUEST);
    }

    /**
     * @description delete a website casino model
     */
    async delete(data: IWebsiteCasinoModel): Promise<IWebsiteCasinoModel[]> {
        this.validateDelete(data);
        const websiteCasino = await WebsiteCasinoModel.findOne({ id: data.casino_id });
        if (!websiteCasino) throw ErrorUtil.newError(NOT_FOUND);
        return websiteCasino.delete();
    }

    private validateDelete(data: IWebsiteCasinoModel): void {
        if (!isObject(data)) throw ErrorUtil.newError(ErrorCodes.BAD_REQUEST);
        data.website_id = <number>data.website_id;
        if (isNaN(data.website_id)) throw ErrorUtil.newError(ErrorCodes.BAD_REQUEST);
        data.casino_id = <number>data.casino_id;
        if (isNaN(data.casino_id)) throw ErrorUtil.newError(ErrorCodes.BAD_REQUEST);
    }
}
