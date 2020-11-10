import { ICasinoGamePublicModel } from "../interfaces/casino_game.interface";
import { CasinoGameWeight } from "../../casino_game_order/enums/casino_weight.enum";
import { BaseModel } from "../../../../../CommonJS/src/base/base.model";

export class CasinoGamePublicModel extends BaseModel implements ICasinoGamePublicModel {
    public static tableName: string = "casino_games";
    public id: number;
    public game_id: number;
    public category: number;
    public name: string;
    public weight: CasinoGameWeight;
    public position_x: number;
    public position_y: number;
    public image_lg_url?: string;
    public image_md_url?: string;
    public image_sm_url?: string;
    public thumb_url?: string;
    public play_count?: number;
    public game_tags?: string[];

    constructor(data: ICasinoGamePublicModel) {
        super();
        this.id = data.id;
        this.game_id = data.game_id;
        this.category = data.category;
        this.name = data.name;
        this.weight = data.weight;
        this.position_x = data.position_x;
        this.position_y = data.position_y;
        this.image_lg_url = data.image_lg_url;
        this.image_md_url = data.image_md_url;
        this.image_sm_url = data.image_sm_url;
        this.thumb_url = data.thumb_url;
        this.play_count = data.play_count || 0;
        this.game_tags = data.game_tags;
    }
}
