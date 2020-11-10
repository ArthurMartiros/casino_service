import { BaseModel } from "../../../../../CommonJS/src/base/base.model";
import { ICasinoCategory } from "../interfaces/casino_category.interaface";
import { toBoolean } from "../../../../../CommonJS/src/utils/validators";

export class CasinoCategoryModel extends BaseModel implements ICasinoCategory {
    public static tableName = "casino_category";

    public id?: number;
    public order_id: number;
    public is_deletable: boolean;

    constructor(data: ICasinoCategory) {
        super();
        this.id = data.id;
        this.order_id = data.order_id;
        this.is_deletable = toBoolean(data.is_deletable, true);
    }
}
