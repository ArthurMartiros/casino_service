import { CashBackModel, GGRPreface, CashBackableUser } from "../models/cash_back.model";
import { ICashBack } from "../interfaces/cash_back.interface";
import { CashBackStatusID, SettlementStatusID } from "../enums/cash_back_status.enum";
import { CasinoBet } from "../../casino_bet/models/casino_bet.model";
import { broker, QueryBuilder } from "../../../../../CommonJS/src/base/base.model";
import { v4 } from "uuid";
import { ITransactionModel } from "../../../../../CoreService/src/components/transactions/interfaces/transaction.interface";
import { CommunicationCodes } from "../../../../../CommonJS/src/messaging/CommunicationCodes";
import { QueueType } from "../../../../../CommonJS/src/messaging/QueueType";
import { SourceType } from "../../../../../CommonJS/src/enums/source_type.enum";
import { TransactionStatus } from "../../../../../CoreService/src/components/transactions/enums/transaction_status.enum";
import { MoneyType } from "../../../../../CoreService/src/components/transactions/enums/money_type.enum";
import { TransactionType } from "../../../../../CoreService/src/components/transactions/enums/transaction_type.enum";
import { round } from "lodash";
import { ChannelType } from "../../../../../CommonJS/src/enums/channel_type.enum";
import { User } from "../../../../../CoreService/src/components/users/models/user.model";
import { ErrorCodes, ErrorUtil } from "../../../../../CommonJS/src/messaging/ErrorCodes";
import { CommonCasino } from "../../providers/common_casino";
import { map } from "bluebird";

export class CashBackService {
    public static async Create(data: ICashBack) {
        if (data.sub_cash_backs && data.sub_cash_backs.length) {
            // if cashback is recurring
            if (!data.recurring) throw ErrorUtil.newError(ErrorCodes.THERE_ARE_SUB_CASH_BACKS_IN_REQUEST_DATA); // for additional checking to avoid wrong datas
            let diff = (new Date(data.end_date).getTime() - new Date(data.start_date).getTime()) / 3600000;
            if (diff % data.period != 0) throw ErrorUtil.newError(ErrorCodes.WRONG_PERIOD_SET_IN_CASH_BACKS); // if intervals is not div.-able
            if (diff / data.period != data.sub_cash_backs.length) throw ErrorUtil.newError(ErrorCodes.WRONG_SUB_CASH_BACKS_COUNT); // if sub cashbacks count is wrong

            // set sub cashbacks start and end dates
            for (let x = 0; x < data.sub_cash_backs.length; ++x) {
                if (x == 0) {
                    data.sub_cash_backs[x].start_date = data.start_date;
                    let pst = new Date(data.start_date);
                    data.sub_cash_backs[x].end_date = new Date(pst.setHours(new Date(data.start_date).getHours() + data.period));
                } else {
                    data.sub_cash_backs[x].start_date = data.sub_cash_backs[x - 1].end_date;
                    let sdh = new Date(data.sub_cash_backs[x].start_date);
                    data.sub_cash_backs[x].end_date = new Date(sdh.setHours(sdh.getHours() + data.period));
                }
            }

            // check if settlement_date is not grather or equel to end_date for sub cashbacks
            const wrong_settlement_date = data.sub_cash_backs.some(item => {
                return new Date(item.settlement_date).getTime() <= new Date(item.end_date).getTime();
            });
            if (wrong_settlement_date) throw ErrorUtil.newError(ErrorCodes.SETTLEMENT_DATE_IS_LESSER_OR_EQUAL_TO_END_DATE);

            // do process
            const parent = await new CashBackModel(data).save();
            data.sub_cash_backs.forEach(async scb => {
                scb.recurring = false;
                new CashBackModel(Object.assign(scb, { parent_id: parent.id })).save();
            });
        } else {
            //if cashback is one time
            if (data.recurring) throw ErrorUtil.newError(ErrorCodes.SENT_DATA_CASH_BACK_HAS_NO_SUB_BUT_IS_RECURRING); // for additional checking to avoid wrong datas
            // check if settlement_date is not grather or equel to end_date one time cashbacks
            if (new Date(data.settlement_date).getTime() <= new Date(data.end_date).getTime())
                throw ErrorUtil.newError(ErrorCodes.SETTLEMENT_DATE_IS_LESSER_OR_EQUAL_TO_END_DATE);
            await new CashBackModel(data).save();
        }
        // return back
        return new CashBackModel(data);
    }

    public static async Update(data: ICashBack) {
        if (!data.recurring && data.sub_cash_backs && data.sub_cash_backs.length) throw ErrorUtil.newError(ErrorCodes.THERE_ARE_SUB_CASH_BACKS_IN_REQUEST_DATA); // for additional checking to avoid wrong datas

        const cb = await CashBackModel.findOne({ id: data.id });
        if (!cb) throw ErrorUtil.newError(ErrorCodes.NOT_FOUND);

        delete data.recurring; // implicitly ignore recurring change
        if (!cb.recurring) {
            // if cashback is finished or settled
            if (cb.status_id == CashBackStatusID.FINISHED || cb.status_id == CashBackStatusID.SETTLED)
                throw ErrorUtil.newError(ErrorCodes.THERE_ARE_FINISHED_OR_SETTLED_CASH_BACKS);
            // if settlement date is not lesser or equal to end date
            if (new Date(data.settlement_date).getTime() <= new Date(data.end_date).getTime())
                throw ErrorUtil.newError(ErrorCodes.SETTLEMENT_DATE_IS_LESSER_OR_EQUAL_TO_END_DATE);
            //if cash back is one time or just sub cashback
            return CashBackModel.update(new CashBackModel(data));
        }
        if (!data.sub_cash_backs || !data.sub_cash_backs.length) throw ErrorUtil.newError(ErrorCodes.SENT_DATA_CASH_BACK_HAS_NO_SUB_BUT_IS_RECURRING); // if cash back has sub cashbacks but is not recurring

        let diff = (new Date(data.end_date).getTime() - new Date(data.start_date).getTime()) / 3600000;
        if (diff % data.period != 0) throw ErrorUtil.newError(ErrorCodes.WRONG_PERIOD_SET_IN_CASH_BACKS); // if intervals is not div.-able
        if (diff / data.period != data.sub_cash_backs.length) throw ErrorUtil.newError(ErrorCodes.WRONG_SUB_CASH_BACKS_COUNT); // if sub cashbacks count is wrong

        // if changes are global
        if (
            data.period != cb.period ||
            (new Date(data.start_date).getTime() != new Date(cb.start_date).getTime() || new Date(data.end_date).getTime() != new Date(cb.end_date).getTime())
        ) {
            //get finished or settled sub cashbacks
            const query = QueryBuilder.table(CashBackModel.tableName);
            query
                .where("parent_id", data.id)
                .andWhere(QueryBuilder.raw(`(status_id = ${CashBackStatusID.FINISHED} OR status_id = ${CashBackStatusID.SETTLED})`));
            const finished_cash_backs: CashBackModel[] = await CashBackModel.manyOrNone(query);

            // get finished or settled parent cashback
            const query_parent = QueryBuilder.table(CashBackModel.tableName);
            query_parent
                .where("id", data.id)
                .andWhere(QueryBuilder.raw(`(status_id = ${CashBackStatusID.FINISHED} OR status_id = ${CashBackStatusID.SETTLED})`));
            const finished_parent_cash_back = await CashBackModel.oneOrNone(query_parent);

            //if there is finished or settled sub cashbacks
            if (finished_cash_backs.length || finished_parent_cash_back) throw ErrorUtil.newError(ErrorCodes.THERE_ARE_FINISHED_OR_SETTLED_CASH_BACKS);

            // set sub cashbacks start and end dates
            for (let x = 0; x < data.sub_cash_backs.length; ++x) {
                if (x == 0) {
                    data.sub_cash_backs[x].start_date = data.start_date;
                    let pst = new Date(data.start_date);
                    data.sub_cash_backs[x].end_date = new Date(pst.setHours(new Date(data.start_date).getHours() + data.period));
                } else {
                    data.sub_cash_backs[x].start_date = data.sub_cash_backs[x - 1].end_date;
                    let sdh = new Date(data.sub_cash_backs[x].start_date);
                    data.sub_cash_backs[x].end_date = new Date(sdh.setHours(sdh.getHours() + data.period));
                }
            }
            // check if settlement_date is not grather or equel to end_date for sub cashbacks
            const wrong_settlement_date = data.sub_cash_backs.some(item => {
                return new Date(item.settlement_date).getTime() <= new Date(item.end_date).getTime();
            });
            if (wrong_settlement_date) throw ErrorUtil.newError(ErrorCodes.SETTLEMENT_DATE_IS_LESSER_OR_EQUAL_TO_END_DATE);

            // do process
            await CashBackModel.delete({ parent_id: data.id });
            await CashBackModel.update(new CashBackModel(data));
            data.sub_cash_backs.forEach(async scb => {
                delete scb.recurring; // implicitly ignore recurring change
                new CashBackModel(Object.assign(scb, { parent_id: data.id })).save();
            });
        } else {
            //if changes are on sub level
            // if id is missing
            const missing = data.sub_cash_backs.some(item => {
                return !item.id;
            });
            if (missing) throw ErrorUtil.newError(ErrorCodes.CASH_BACK_ID_IS_MISSING);

            // edit sub cashbacks by id which are not settled or finished
            data.sub_cash_backs.forEach(scb => {
                // implicitly ignore uncommon changes
                delete scb.start_date;
                delete scb.end_date;
                delete scb.recurring;
                // do update
                CashBackModel.update(scb, { id: scb.id }, `and status_id <> ${CashBackStatusID.FINISHED} and status_id <> ${CashBackStatusID.SETTLED}`);
            });
        }

        // return back
        return new CashBackModel(data);
    }

    public static async Delete(data: any) {
        const cb = await CashBackModel.findOne({ id: data.id });
        if (!cb) throw ErrorUtil.newError(ErrorCodes.NOT_FOUND);

        //if there is finished or settled cashback
        if (cb.status_id == CashBackStatusID.FINISHED || cb.status_id == CashBackStatusID.SETTLED)
            throw ErrorUtil.newError(ErrorCodes.THERE_ARE_FINISHED_OR_SETTLED_CASH_BACKS);
        if (cb.recurring) {
            const query = QueryBuilder.table(CashBackModel.tableName);
            query
                .where("parent_id", data.id)
                .andWhere(QueryBuilder.raw(`(status_id = ${CashBackStatusID.FINISHED} OR status_id = ${CashBackStatusID.SETTLED})`));
            const finished_cash_backs: CashBackModel[] = await CashBackModel.manyOrNone(query);

            //if there is finished or settled sub cashbacks
            if (finished_cash_backs && finished_cash_backs.length) throw ErrorUtil.newError(ErrorCodes.THERE_ARE_FINISHED_OR_SETTLED_CASH_BACKS);

            await CashBackModel.delete({ parent_id: data.id });
        }
        return CashBackModel.delete({ id: data.id });
    }

    public static async CashOut() {
        const query = QueryBuilder.table(CashBackableUser.tableName);
        query.where("settlement_status_id", SettlementStatusID.UNSETTLED); // get only unsettled cashbackables
        const cash_backable_users: CashBackableUser[] = await CashBackableUser.manyOrNone(query);

        if (!cash_backable_users.length) return;
        //if there are unsettled cashbackables
        cash_backable_users.map(async cbu => {
            const settlement_date = new Date(cbu.settlement_date).getTime();
            const now = new Date().getTime();
            if (now < settlement_date) return;
            // if its time to settle
            // transaction process
            await broker.sendRequest<ITransactionModel>(
                CommunicationCodes.UPDATE_USER_BALANCE,
                <ITransactionModel>{
                    amount: cbu.amount,
                    money_type_id: MoneyType.REAL,
                    user_id: cbu.user_id,
                    currency_id: cbu.currency_id,
                    type_id: TransactionType.BONUS,
                    product_id: cbu.cash_back_id,
                    channel_id: ChannelType.BACKEND,
                    source_type_id: SourceType.CASINO,
                    status_id: TransactionStatus.SUCCESS,
                    code: v4()
                },
                QueueType.CORE_SERVICE
            );
            // set cashback and cashbackable as settled
            cbu.settlement_status_id = SettlementStatusID.SETTLED;
            await CashBackableUser.update({ id: cbu.id, settlement_status_id: SettlementStatusID.SETTLED });
            await CashBackModel.update({ id: cbu.cash_back_id, status_id: CashBackStatusID.SETTLED });
        });
    }

    public static async OneTimeCashBackImplementation(scb: CashBackModel) {
        if (scb.start_date && scb.end_date) {
            if (new Date(scb.end_date).getTime() <= new Date().getTime() && scb.status_id == CashBackStatusID.ACTIVE) {
                //if it is time to calculate and cashback is active
                const query = QueryBuilder.table(CasinoBet.tableName);
                // get sufficient players for cashback criteria
                query
                    .select("user_id")
                    .select(QueryBuilder.raw("SUM(stake) AS stake"))
                    .select(QueryBuilder.raw("SUM(won_amount) AS won_amount"))
                    .whereBetween("date", [new Date(scb.start_date).toISOString(), new Date(scb.end_date).toISOString()]);
                if (scb.casino_game_ids && scb.casino_game_ids.length && (scb.casino_provider_ids && scb.casino_provider_ids.length))
                    query.andWhereRaw(` (casino_game_id in (${scb.casino_game_ids}) OR provider_id in (${scb.casino_provider_ids}))`);
                if (!(scb.casino_game_ids && scb.casino_game_ids.length) && (scb.casino_provider_ids && scb.casino_provider_ids.length))
                    query.whereIn("provider_id", scb.casino_provider_ids);
                if (scb.casino_game_ids && scb.casino_game_ids.length && !(scb.casino_provider_ids && scb.casino_provider_ids.length))
                    query.whereIn("casino_game_id", scb.casino_game_ids);

                query.groupBy("user_id");
                const casinoBets: GGRPreface[] = await GGRPreface.manyOrNone(query);

                if (casinoBets.length) {
                    // if there are sufficient players
                    await casinoBets.map(async casinoBet => {
                        const ggr: number = casinoBet.stake - casinoBet.won_amount;
                        if (ggr > 0) {
                            if (ggr >= scb.min_ggr && ggr <= scb.ggr_limit) {
                                // if ggr is in cashback ggr interval
                                //if ggr is in ggr interval
                                const cash_back_amount = ggr * (scb.ggr_percent / 100);
                                const user = await User.findOneById(casinoBet.user_id);
                                if (user) {
                                    const rate = await CommonCasino.GetRate(user.currency_id);
                                    // generate cashbackable user
                                    await new CashBackableUser(
                                        new CashBackableUser({
                                            user_id: casinoBet.user_id,
                                            cash_back_id: scb.id,
                                            periodic: scb.recurring,
                                            amount: cash_back_amount,
                                            amount_usd: round(cash_back_amount * rate.rate, 2),
                                            total_stake: casinoBet.stake,
                                            total_stake_usd: round(casinoBet.stake * rate.rate, 2),
                                            total_won_amount: casinoBet.won_amount,
                                            total_won_amount_usd: round(casinoBet.won_amount * rate.rate, 2),
                                            settlement_date: scb.settlement_date,
                                            ggr_percent: scb.ggr_percent,
                                            settlement_status_id: SettlementStatusID.UNSETTLED,
                                            currency_id: user.currency_id
                                        })
                                    ).save();
                                }
                            }
                        }
                    });
                    // set cashback as finished
                    await CashBackModel.update({ id: scb.id, status_id: CashBackStatusID.FINISHED });
                }
            }
        }
    }

    public static async CashBackProcess() {
        const queryOTACB = QueryBuilder.table(CashBackModel.tableName);
        // get one time cashbacks
        queryOTACB
            .where(function() {
                this.where({ recurring: false }).orWhereNull("recurring");
            })
            .where("status_id", CashBackStatusID.ACTIVE)
            .whereNull("parent_id");

        const oneTimeActiveCB: CashBackModel[] = await CashBackModel.manyOrNone(queryOTACB);
        if (oneTimeActiveCB.length) {
            oneTimeActiveCB.map(
                async otacb => CashBackService.OneTimeCashBackImplementation(otacb) // proecess calculation
            );
        }
        const subCB = await CashBackModel.manyOrNone(
            QueryBuilder.table(CashBackModel.tableName)
                .where(function() {
                    this.where({ recurring: false }).orWhereNull("recurring");
                })
                .where("status_id", CashBackStatusID.ACTIVE)
                .whereNotNull("parent_id")
        );
        if (!subCB.length) return;
        await map(subCB, async scb => {
            // get parent cashback
            const parentCB = await CashBackModel.oneOrNone(
                QueryBuilder(CashBackModel.tableName)
                    .where({ id: scb.parent_id, status_id: CashBackStatusID.ACTIVE })
                    .whereNotNull("start_date")
                    .whereNotNull("end_date")
            );
            if (!parentCB) return;

            const now = new Date().getTime();
            if (new Date(parentCB.start_date).getTime() <= now && new Date(parentCB.end_date).getTime() >= now) {
                //if parent cash_back dates are in current
                // process calculation
                CashBackService.OneTimeCashBackImplementation(scb);
            } else if (new Date(parentCB.end_date).getTime() < new Date().getTime()) {
                // if parent cash_back dates are expired
                await CashBackModel.update(
                    { status_id: CashBackStatusID.FINISHED },
                    {
                        recurring: false,
                        parent_id: parentCB.id,
                        status_id: CashBackStatusID.ACTIVE
                    }
                );
                // set parent cashback as finished
                await CashBackModel.update({ id: parentCB.id, status_id: CashBackStatusID.FINISHED });
            }
        });
    }
}
