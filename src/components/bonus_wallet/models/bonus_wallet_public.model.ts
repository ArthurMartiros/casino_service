import { IBonusWallet, IBonusWalletPublic } from "../interfaces/bonus_wallet.interface";
import { BonusType } from "../../../../../CoreService/src/components/bonuses/base/enums/bonus_type.enum";
import { round } from "lodash";
import { CasinoTransaction } from "../../casino_transaction/models/casino_transaction.model";
import { CasinoTransactionType } from "../../casino_transaction/enums/casino_transaction.type";
import { QueryBuilder } from "../../../../../CommonJS/src/base/base.model";
import { BonusStatus } from "../../../../../CoreService/src/components/bonuses/base/enums/bonus_status.enum";

export class BonusWalletPublic implements IBonusWalletPublic {
    id?: number;
    initial_balance: number;
    balance: number;
    wager: number;
    stake_left_to_convert: number;
    stake_to_convert: number;
    expire_date?: Date;
    bonus_type_id: BonusType;
    given_date: Date;
    status_id: BonusStatus;

    constructor(wallet: IBonusWallet) {
        this.id = wallet.id;
        this.initial_balance = wallet.initial_balance;
        this.balance = wallet.balance;
        this.wager = wallet.wagering_turnover;
        this.expire_date = wallet.expire_date;
        this.bonus_type_id = wallet.bonus_type_id;
        this.given_date = wallet.created;
        this.status_id = wallet.status_id;
    }

    async calculate() {
        const transactionsStake = await CasinoTransaction.one(
            QueryBuilder(CasinoTransaction.tableName)
                .sum("amount as amount")
                .where({ wallet_id: this.id })
                .where({ bet_type_id: CasinoTransactionType.BET })
        );
        this.stake_left_to_convert = round(this.initial_balance * this.wager - transactionsStake.amount, 2);
        if (this.stake_left_to_convert < 0) this.stake_left_to_convert = 0;
        this.stake_to_convert = round(this.initial_balance * this.wager, 2);
        return this;
    }
}
