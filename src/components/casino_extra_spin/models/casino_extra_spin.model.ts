import { ICasinoExtraSpin, ICasinoExtraSpinPublic } from "../interfaces/casino_extra_spin.interface";
import { BaseModel } from "../../../../../CommonJS/src/base/base.model";
import { toBoolean } from "../../../../../CommonJS/src/utils/validators";
import { CasinoExtraSpinType } from "../enums/casino_extra_spin.enum";
import { BonusType } from "../../../../../CoreService/src/components/bonuses/base/enums/bonus_type.enum";
import { BonusStatus } from "../../../../../CoreService/src/components/bonuses/base/enums/bonus_status.enum";
import { BonusWalletService } from "../../bonus_wallet/services/bonus_wallet.service";
import { redis } from "../../../../../CacheService/src/utils/cache";
import { ActionType } from "../../../../../SocketService/src/base/interfaces/observer.interface";
import { SubjectType } from "../../../../../SocketService/src/base/enums/subject_type.enum";
import { CurrencyModel } from "../../../../../CoreService/src/components/currencies/models/currency.model";
import { User } from "../../../../../CoreService/src/components/users/models/user.model";
import { CasinoGameModel } from "../../casino_game/models/casino_game.model";
import { BonusWallet } from "../../bonus_wallet/models/bonus_wallet.model";

export class CasinoExtraSpin extends BaseModel implements ICasinoExtraSpin {
    public static tableName: string = "casino_extra_spin";
    public id?: number;
    public type_id: CasinoExtraSpinType;
    public personal_id?: number;
    public created: Date;
    public user_id: number;
    public bonus_type_id?: BonusType;
    public bet_amount: number;
    public currency_id: number;
    public spins_total: number;
    public left_spins: number;
    public casino_game_id: number;
    public used: boolean;
    public expire_date: Date;
    public bet_per_line: number;
    public lines: number;
    public bet_id: number;
    public denomination: number;
    public denomination_value: number;
    public wagering_turnover: number;
    public status_id: BonusStatus;
    public website_id: number;

    constructor(data: ICasinoExtraSpin) {
        super();
        this.id = data.id;
        this.type_id = data.type_id;
        this.personal_id = data.personal_id;
        this.created = new Date(data.created || new Date());
        this.user_id = data.user_id;
        this.bonus_type_id = data.bonus_type_id;
        this.bet_amount = data.bet_amount || data.denomination * data.denomination_value;
        this.currency_id = data.currency_id;
        this.spins_total = data.spins_total;
        this.left_spins = data.left_spins;
        this.casino_game_id = data.casino_game_id;
        this.used = toBoolean(data.used, false);
        this.expire_date = data.expire_date;
        this.bet_per_line = data.bet_per_line;
        this.lines = data.lines || 1;
        this.bet_id = data.bet_id;
        this.denomination = data.denomination;
        this.denomination_value = data.denomination_value;
        this.denomination_value = data.denomination_value;
        this.wagering_turnover = data.wagering_turnover || 10;
        this.status_id = data.status_id;
    }

    async updateLeftSpin(left?: number) {
        this.left_spins = left || this.left_spins - 1;
        this.status_id = BonusStatus.FINISHED;
        await this.update();
        if (this.left_spins === 0) await BonusWalletService.ActivateBonus(this.id as number, this.bonus_type_id as number, this.user_id);
    }

    async saveWithID(conflictRule?: string) {
        const saved = await super.saveWithID(conflictRule);

        const currency: any = await CurrencyModel.findOne({ id: saved.currency_id });
        const user: any = await User.oneOrNone(`SELECT  CASE 
        WHEN users.first_name IS NOT NULL AND users.last_name IS NOT NULL 
            THEN CONCAT(users.first_name, ' ', users.last_name)
        WHEN users.first_name IS NOT NULL 
            THEN users.first_name
        WHEN users.last_name IS NOT NULL 
            THEN users.last_name
        WHEN users.username IS NOT NULL 
            THEN users.username
        WHEN users.email IS NOT NULL 
            THEN users.email
        ELSE '(Unknown)'
        END AS user_name FROM ${User.tableName} WHERE id = ${saved.personal_id}`);
        const game = await CasinoGameModel.findOneById(saved.casino_game_id);
        const bonus_wallet: any = await BonusWallet.findOne({ user_id: saved.personal_id });
        const thumb_url = game.thumb_url || game.image_sm_url || game.image_md_url || game.image_lg_url || "";

        await redis.publish(
            JSON.stringify({
                type: SubjectType.UPDATE_BONUS_RECEIVERS
            }),
            JSON.stringify({
                actionType: ActionType.UPDATE,
                actionData: {
                    casino_game_id: saved.casino_game_id,
                    currency_id: saved.currency_id,
                    bonus_amount: bonus_wallet.initial_balance,
                    currency_code: currency.code,
                    user_name: user.user_name,
                    name: game.name,
                    thumb_url: thumb_url,
                    spins_count: saved.spins_total
                }
            })
        );
        return saved;
    }
}

export class CasinoExtraSpinPublic extends BaseModel implements ICasinoExtraSpinPublic {
    public static tableName: string = "casino_extra_spin";
    public id: number;
    public type_id: CasinoExtraSpinType;
    public personal_id?: number;
    public created: Date;
    public user_id: number;
    public bonus_type_id?: BonusType;
    public bet_amount: number;
    public currency_code: string;
    public spins_total: number;
    public left_spins: number;
    public casino_game_name: string;
    public wagering_turnover: number;
    public won_amount: number;
    public expire_date: Date;
    public status_id: BonusStatus;

    constructor(data: ICasinoExtraSpinPublic) {
        super();
        this.id = data.id;
        this.type_id = data.type_id;
        this.personal_id = data.personal_id;
        this.created = new Date(data.created || new Date());
        this.user_id = data.user_id;
        this.bonus_type_id = data.bonus_type_id;
        this.bet_amount = data.bet_amount;
        this.currency_code = data.currency_code;
        this.spins_total = data.spins_total;
        this.left_spins = data.left_spins;
        this.casino_game_name = data.casino_game_name;
        this.wagering_turnover = data.wagering_turnover;
        this.won_amount = data.won_amount;
        this.expire_date = data.expire_date;
        this.status_id = data.status_id;
    }
}
