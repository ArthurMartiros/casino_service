import { pickBy } from "lodash";
import { IUserFinancialFilter, IUserFinancialModel, ICalculatedUserProfit } from "../interfaces/user.financial.interface";
import { UserFinancialModel, UserFinancialSupportQuery } from "../models/user.financial.model";
import { QueryBuilder } from "../../../../../CommonJS/src/base/base.model";
import { ProfitGrade } from "../../../../../CoreService/src/components/users/enums/user.profit_grade.enum";
import { CasinoBetStatus } from "../../casino_bet/enums/casino_bet.enum";
import { CasinoBet } from "../../casino_bet/models/casino_bet.model";

export class UserFinancialFilter implements IUserFinancialFilter {
    public userId: number;

    constructor(userId: number | string) {
        this.userId = Number(userId);
    }

    private calculateUserProfitHelper(data): ICalculatedUserProfit {
        if (!data) return { profitability: 0, profitability_grade: ProfitGrade.UNPROFITABLE };

        const placedAmount = data.map(d => Number(d.stake)).reduce((prev, next) => prev + next, 0) || 0;

        const wonAmount =
            data
                .filter(d => d.status_id === CasinoBetStatus.ACTIVE || d.status_id === CasinoBetStatus.WON)
                .map(d => Number(d.stake))
                .reduce((prev, next) => prev + next, 0) || 0;
        const profitability = placedAmount - wonAmount;
        const profitability_grade = placedAmount - wonAmount > 0 ? ProfitGrade.PROFITABLE : ProfitGrade.UNPROFITABLE;

        return { profitability, profitability_grade } as ICalculatedUserProfit;
    }

    async get(): Promise<IUserFinancialModel> {
        const [profitData, ...financialData] = await Promise.all([
            UserFinancialSupportQuery.manyOrNone(
                QueryBuilder(CasinoBet.tableName)
                    .select(["stake", "status_id"])
                    .where({
                        user_id: this.userId
                    })
            ),
            UserFinancialModel.oneOrNone(
                QueryBuilder(CasinoBet.tableName)
                    .sum("stake as open_bets_amount")
                    .count("stake as open_bets_sum")
                    .where({
                        user_id: this.userId,
                        status_id: CasinoBetStatus.ACTIVE
                    })
            ),
            UserFinancialModel.oneOrNone(
                QueryBuilder(CasinoBet.tableName)
                    .sum("won_amount as payout")
                    .where({
                        user_id: this.userId,
                        status_id: CasinoBetStatus.WON
                    })
            ),
            UserFinancialModel.oneOrNone(
                QueryBuilder(CasinoBet.tableName)
                    .sum("stake as stake_amount")
                    .count("stake as stake_count")
                    .where({
                        user_id: this.userId
                    })
                    .whereIn("status_id", [CasinoBetStatus.ACTIVE, CasinoBetStatus.WON, CasinoBetStatus.LOST])
            )
        ]);

        return new UserFinancialModel(Object.assign(this.calculateUserProfitHelper(profitData), ...financialData.map(el => pickBy(el))));
    }
}
