import { IModelSaveWithLanguage } from "../../../../../CommonJS/src/base/base.interface";
import { ChannelType } from "../../../../../CommonJS/src/enums/channel_type.enum";

export interface ICasinoCategory {
    id?: number;
    order_id: number;
    is_deletable: boolean;
}

export interface ICasinoCategoryPublic extends ICasinoCategory {
    id: number;
    order_id: number;
    name: string;
}

export interface ICasinoCategoryFilter extends IModelSaveWithLanguage {
    id?: number;
    lang_id?: number;
    is_admin?: boolean;
    channel_id?: ChannelType;
}
