import { IChannelAndLangFilter } from "../../../../../CacheService/src/components/today_special_offers/interfaces/today_special_offer.filter.interface";
import { TransactionType } from "../../../../../CoreService/src/components/transactions/enums/transaction_type.enum";

export interface ICasinoHistoryFilter extends IChannelAndLangFilter {
    user_id: number;
    place_date_from: Date;
    place_date_to: Date;

    type_id?: TransactionType;
    page?: number;
    limit?: number;
}
