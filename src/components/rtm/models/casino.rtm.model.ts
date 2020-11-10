import { round } from "lodash";
import { ICasinoRtm } from "../interfaces/casino.rtm.model.interface";
import { BaseModel } from "../../../../../CommonJS/src/base/base.model";
import { CasinoBetStatus, CasinoBetType } from "../../casino_bet/enums/casino_bet.enum";

export class CasinoRtmModel extends BaseModel implements ICasinoRtm {
    public static tableName = "casino_bet";
    public id: number;
    public game_id: number;
    public game_name: string;
    public game_currency_id: number;
    public game_website_currency_id: number;
    public game_provider_id: number;
    public game_provider_name: string;
    public game_bet_number: number;
    public bet_type_id: CasinoBetType;
    public game_ip: string;
    public game_ip_country: string;
    public game_placement_time: Date;
    public ggr: number;
    public ggr_website_currency: number;
    public game_stake: number;
    public game_stake_real: number;
    public game_stake_real_usd: number;
    public game_stake_bonus: number;
    public game_stake_usd: number;
    public game_won_amount: number;
    public game_won_amount_real: number;
    public game_won_amount_real_usd: number;
    public game_won_amount_bonus: number;
    public game_won_amount_usd: number;
    public game_status_id: CasinoBetStatus;
    public user_id: number;
    public user_name: string;
    public user_country_id: string;
    public user_group_id: number;
    public user_status_id: number;
    public user_registration_ip?: string;
    public website_id: number;
    public channel_id: number;
    public user_balance_before: number;
    public user_balance_before_usd: number;
    public user_balance_after: number;
    public user_balance_after_usd: number;

    constructor(data: ICasinoRtm) {
        super();
        this.id = data.id;
        this.game_id = data.game_id;
        this.game_name = data.game_name;
        this.game_currency_id = data.game_currency_id;
        this.game_website_currency_id = data.game_website_currency_id;
        this.game_provider_id = data.game_provider_id;
        this.game_provider_name = data.game_provider_name;
        this.game_bet_number = data.game_bet_number || 0;
        this.game_ip = data.game_ip;
        this.game_ip_country = data.game_ip_country;
        this.game_placement_time = data.game_placement_time;
        this.bet_type_id = data.bet_type_id;
        this.user_country_id = data.user_country_id;
        this.game_stake = round(data.game_stake, 2);
        this.game_stake_bonus = round(data.game_stake_bonus, 2);
        this.game_stake_real = round(data.game_stake_real, 2);
        this.game_stake_real_usd = round(data.game_stake_real_usd, 2);
        this.game_stake_usd = round(data.game_stake_usd, 2);
        this.game_won_amount = round(data.game_won_amount, 2);
        this.game_won_amount_real = round(data.game_won_amount_real, 2);
        this.game_won_amount_real_usd = round(data.game_won_amount_real_usd, 2);
        this.game_won_amount_bonus = round(data.game_won_amount_bonus, 2);
        this.game_won_amount_usd = round(data.game_won_amount_usd, 2);
        this.game_status_id = data.game_status_id;
        this.ggr = round(this.game_stake_real_usd - this.game_won_amount_real_usd, 2);
        this.ggr_website_currency = 0;
        this.user_id = data.user_id;
        this.user_name = data.user_name;
        this.user_group_id = data.user_group_id || 0;
        this.user_status_id = data.user_status_id;
        this.user_registration_ip = data.user_registration_ip;
        this.website_id = data.website_id;
        this.channel_id = data.channel_id;
        this.user_balance_after = round(data.user_balance_after, 2);
        this.user_balance_after_usd = round(data.user_balance_after_usd, 2);
        this.user_balance_before = round(data.user_balance_before, 2);
        this.user_balance_before_usd = round(data.user_balance_before_usd, 2);
    }
}

export class CasinoRtmTotalModel extends BaseModel {
    public static tableName = "casino_bet";
    public game_stake_sum: number;
    public game_stake_usd_sum: number;
    public game_stake_count: number;
    public game_won_amount_sum: number;
    public game_won_amount_usd_sum: number;
    public game_won_amount_count: number;
    public profitability_percent: number;

    constructor(data: CasinoRtmTotalModel) {
        super();
        this.game_stake_sum = round(data.game_stake_sum, 2) || 0;
        this.game_stake_usd_sum = round(data.game_stake_usd_sum, 2) || 0;
        this.game_stake_count = round(data.game_stake_count, 2) || 0;
        this.game_won_amount_sum = round(data.game_won_amount_sum, 2) || 0;
        this.game_won_amount_usd_sum = round(data.game_won_amount_usd_sum, 2) || 0;
        this.game_won_amount_count = round(data.game_won_amount_count, 2) || 0;
        this.profitability_percent = data.game_stake_sum ? ((data.game_stake_sum - data.game_won_amount_sum) / data.game_stake_sum) * 100 : 0;
        this.profitability_percent = round(this.profitability_percent, 2);
    }
}
