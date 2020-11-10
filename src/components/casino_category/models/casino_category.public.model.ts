import { CasinoCategoryModel } from "./casino_category.model";
import { ICasinoCategoryPublic } from "../interfaces/casino_category.interaface";
import { toInteger } from "lodash";
export class CasinoCategoryPublic extends CasinoCategoryModel implements ICasinoCategoryPublic {
    public id: number;
    public order_id: number;
    public name: string;

    constructor(data: ICasinoCategoryPublic) {
        super(data);
        this.id = data.id;
        this.order_id = toInteger(data.order_id);
        this.name = data.name;
    }
}
