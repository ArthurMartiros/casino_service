import { isString, isObject, toNumber, cloneDeep } from "lodash";
import { map } from "bluebird";
import { BAD_REQUEST } from "http-status-codes";
import { ServiceWithRequestInfo } from "../../../../../CommonJS/src/components/service_with_request_info/service_with_request_info";
import { CasinoGamesTranslationService } from "../../casino_game_translation/services/casino_games_translation.service";
import { IMessage } from "../../../../../CommonJS/src/messaging/message.interface";
import { ICasinoGameModel, ICasinoGameFilter, ICasinoGamePublicModel } from "../../casino_game/interfaces/casino_game.interface";
import { CasinoGameModel } from "../../casino_game/models/casino_game.model";
import { ErrorUtil, ErrorCodes } from "../../../../../CommonJS/src/messaging/ErrorCodes";
import { isNotNumber } from "../../../../../CommonJS/src/utils/validators";
import { WebsiteCasinoModel } from "../../website_casino/models/website_casino.model";
import { CasinoGameFilter } from "../filters/casino_game.filter";
import { CasinoProvider } from "../../casino/factory/casino.factory";
import { isArray } from "util";

export class CasinoGameService extends ServiceWithRequestInfo {
    private translationService = new CasinoGamesTranslationService();

    public setRequestInfo(msg: IMessage): void {
        super.setRequestInfo(msg);
        this.translationService.setRequestInfo(msg);
    }

    /**
     * @description list of casino games
     */
    public async list(request: ICasinoGameFilter): Promise<(ICasinoGamePublicModel | ICasinoGameModel)[]> {
        const filter = Object.assign(this.requestInfo, request);
        return CasinoGameFilter.findAllByFilter(filter);
    }

    /**
     * @description create a casino game
     */
    public async create(request: ICasinoGameModel): Promise<ICasinoGameModel> {
        this.validateCreate(request);
        const casinoGameModel = new CasinoGameModel(request);
        return casinoGameModel.saveWithID();
    }

    /**
     * @description update a casino game
     */
    public async update(data: ICasinoGameModel): Promise<ICasinoGameModel> {
        this.validateUpdate(data);
        const casinoGameModel = await CasinoGameModel.findOne({ id: data.id });
        if (!casinoGameModel) throw ErrorUtil.newError(ErrorCodes.NOT_FOUND);
        if (data.game_tags) {
            data.game_tags.map(async tag => {
                await casinoGameModel.addToArray(tag, "character varying", "game_tags", "id", toNumber(casinoGameModel.id), true, "*");
            });
        }
        return new CasinoGameModel(Object.assign(casinoGameModel, data)).update();
    }

    private validateUpdate(request: ICasinoGameModel) {
        this.validateCreate(request);
        if (isNotNumber(request.id)) throw ErrorUtil.newError();
        if (!isArray(request.game_tags)) throw ErrorUtil.newError(BAD_REQUEST);
        request.id = toNumber(request.id);
    }

    /**
     * @description update casino games
     */
    public async updates(items: ICasinoGameModel[]): Promise<ICasinoGameModel[]> {
        return map(items, async item => {
            if (isNotNumber(item.id)) throw ErrorUtil.newError(ErrorCodes.CASINO_GAME_NOT_FOUND);
            const oldGame = await CasinoGameModel.findOne({ id: item.id });
            if (!oldGame) throw ErrorUtil.newError(ErrorCodes.CASINO_GAME_NOT_FOUND);
            delete item["absolute_name"];
            delete item["playCount"];
            delete item.game_id;
            delete item.technology_id;
            delete item.provider_id;
            delete item.has_lobby;
            return oldGame.update(item);
        });
    }

    private validateCreate(request: ICasinoGameModel) {
        if (!isObject(request) || isNotNumber(request.game_id) || !isString(request.name)) throw ErrorUtil.newError();
    }

    /**
     * @description delete a casino game
     */
    public async delete(data: ICasinoGameModel) {
        if (isNotNumber(data.id)) throw ErrorUtil.newError(BAD_REQUEST);
        const casinoGameModel = await CasinoGameModel.findOne({ id: data.id });
        if (!casinoGameModel) throw ErrorUtil.newError(ErrorCodes.NOT_FOUND);
        await CasinoGameModel.delete({ id: data.id });
        await this.translationService.deleteList(data.id);
    }

    /**
     * @description refresh casino games by casino
     */
    public async refresh(id: number): Promise<void> {
        const requestInfo = cloneDeep(this.requestInfo);
        // get casino provider
        const provider = CasinoProvider(id);
        if (!provider) throw ErrorUtil.newError(ErrorCodes.CASINO_ID_IS_INVALID);
        const websites = await WebsiteCasinoModel.findMany({ casino_id: id });
        map(websites, async websiteCasino => provider.refreshGames(websiteCasino, requestInfo));
    }

    /**
     * @description add casino game tags
     */
}
