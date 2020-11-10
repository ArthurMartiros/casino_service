import { isString } from "lodash";
import { BaseModel } from "../../../../../CommonJS/src/base/base.model";
import { ICasinoGameModel } from "../interfaces/casino_game.interface";
import { CasinoGameStatus } from "../enums/casino_game_status.enum";
import { toBoolean } from "../../../../../CommonJS/src/utils/validators";
import { ErrorUtil, ErrorCodes } from "../../../../../CommonJS/src/messaging/ErrorCodes";

export class CasinoGameModel extends BaseModel implements ICasinoGameModel {
    public static tableName: string = "casino_games";

    public id?: number;
    public game_id: string;
    public provider_id: number;
    public technology_id: number;
    public category?: number;

    public name: string;
    public image_lg_url?: string;
    public image_md_url?: string;
    public image_sm_url?: string;
    public thumb_url?: string;

    // tslint:disable-next-line:no-any
    public data?: any;
    public play_count?: number;
    public status_id: CasinoGameStatus;
    public free_spins: boolean;
    public free_spins_count: number[];
    public bonus_spins: boolean;
    public has_lobby: boolean;
    public is_mobile: boolean;
    public game_tags?: string[];

    constructor(data: ICasinoGameModel) {
        super();
        this.id = data.id;
        this.game_id = data.game_id;
        this.category = data.category || 0;
        this.name = data.name;
        this.image_lg_url = isString(data.image_lg_url) ? data.image_lg_url : "";
        this.image_md_url = isString(data.image_md_url) ? data.image_md_url : "";
        this.image_sm_url = isString(data.image_sm_url) ? data.image_sm_url : "";
        this.thumb_url = isString(data.thumb_url) ? data.thumb_url : this.image_sm_url;
        this.data = data.data;
        this.play_count = data.play_count;
        this.status_id = data.status_id;
        this.free_spins = toBoolean(data.free_spins, false);
        this.free_spins_count = data.free_spins_count || [];
        this.bonus_spins = toBoolean(data.bonus_spins, false);
        this.has_lobby = toBoolean(data.has_lobby, false);
        this.is_mobile = toBoolean(data.is_mobile, false);
        this.provider_id = data.provider_id;
        this.technology_id = data.technology_id;
        this.game_tags = data.game_tags;
    }

    public static async findOneById(id: number) {
        const game = await CasinoGameModel.findOne({ id });
        if (!game) throw ErrorUtil.newError(ErrorCodes.CASINO_GAME_NOT_FOUND);
        return game;
    }
}

export class CasinoGameAdminModel extends CasinoGameModel {
    public website_id: number;
    public casino_id: number;
    public position_x: number;
    public position_y: number;
    public weight: number;
    constructor(data: CasinoGameAdminModel) {
        super(data);
        this.website_id = data.website_id;
        this.casino_id = data.casino_id;
        this.position_x = data.position_x;
        this.position_y = data.position_y;
        this.weight = data.weight;
    }
}
