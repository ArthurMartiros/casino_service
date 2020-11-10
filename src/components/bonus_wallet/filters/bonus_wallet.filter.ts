import { IBonusWalletFilter, IListWithPagination } from "../interfaces/bonus_wallet.interface";
import { QueryBuilder } from "../../../../../CommonJS/src/base/base.model";
import { BonusWallet } from "../models/bonus_wallet.model";
import { BonusWalletPublic } from "../models/bonus_wallet_public.model";
import { CountModel } from "../../../../../CommonJS/src/components/count_model/count.model";
import { BonusStatus } from "../../../../../CoreService/src/components/bonuses/base/enums/bonus_status.enum";
import { map } from "bluebird";
import { NormalizeLimit, NormalizePage } from "../../../../../CommonJS/src/utils/utils";

export class BonusWalletFilter implements IBonusWalletFilter {
    public user_id: number;
    public limit: number;
    public page: number;

    constructor(data: IBonusWalletFilter) {
        this.user_id = data.user_id;
        this.limit = NormalizeLimit(data.limit);
        this.page = NormalizePage((data.page || 1) - 1);
    }

    public static async Find(filter: IBonusWalletFilter): Promise<IListWithPagination> {
        filter = new BonusWalletFilter(filter);
        const count = await CountModel.one(
            QueryBuilder(BonusWallet.tableName)
                .where({ user_id: filter.user_id })
                .count("*")
        );
        let data: BonusWalletPublic[] = [];
        if (count.count) {
            const wallets = await BonusWallet.manyOrNone(
                QueryBuilder(BonusWallet.tableName)
                    .where("user_id", "=", filter.user_id)
                    .where("status_id", "<>", BonusStatus.INACTIVE)
                    .limit(filter.limit)
                    .offset(filter.page * filter.limit)
                    .orderBy("id", "desc")
            );
            data = await map(wallets, async wallet => new BonusWalletPublic(wallet).calculate());
        }

        return {
            full_count: count.count,
            data: data
        };
    }

    public static async FindByIds(ids: number[]) {
        return BonusWallet.manyOrNone(
            QueryBuilder(BonusWallet.tableName)
                .whereIn("id", ids)
                .forUpdate()
        );
    }
}
