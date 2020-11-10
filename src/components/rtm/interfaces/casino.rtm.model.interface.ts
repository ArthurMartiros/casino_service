import { IBase, IModelWithChannelType } from "../../../../../CommonJS/src/base/base.interface";
import { IBaseRtmFilter } from "./base.rtm.filter.interface";
import { CasinoBetStatus, CasinoBetType } from "../../casino_bet/enums/casino_bet.enum";
import { VerificationStatus } from "../../../../../CoreService/src/components/users/enums/user.verification_status.enum";
import { ChannelType } from "../../../../../CommonJS/src/enums/channel_type.enum";

export interface ICasinoRtm extends IModelWithChannelType, IBase {
    id: number;
    game_id: number;
    game_name: string;
    game_currency_id: number;
    game_website_currency_id: number;
    game_provider_id: number;
    game_provider_name: string;
    game_bet_number: number;
    game_ip: string;
    game_ip_country: string;
    game_placement_time: Date;
    bet_type_id: CasinoBetType;
    ggr: number;
    ggr_website_currency: number;
    game_stake: number;
    game_stake_real: number;
    game_stake_real_usd: number;
    game_stake_bonus: number;
    game_stake_usd: number;
    game_won_amount: number;
    game_won_amount_real: number;
    game_won_amount_real_usd: number;
    game_won_amount_bonus: number;
    game_won_amount_usd: number;
    game_status_id: CasinoBetStatus;
    user_id: number;
    user_name: string;
    user_country_id: string;
    user_group_id: number;
    user_status_id: VerificationStatus;
    user_registration_ip?: string;
    user_balance_before: number;
    user_balance_before_usd: number;
    user_balance_after: number;
    user_balance_after_usd: number;
}

export interface ICasinoRtmFilter extends IBaseRtmFilter {
    game_id?: number;
    game_name?: string;
    game_ip?: string;
    game_ip_country?: string;
    channel_id?: ChannelType;
    website_id?: number;
    game_currency_id?: number;
    game_provider_id?: number;
    game_placement_time_from?: Date;
    game_placement_time_to?: Date;
    game_status_id?: CasinoBetStatus;
    game_bet_number_from?: number;
    game_bet_number_to?: number;
    bet_type_id?: CasinoBetType[];
    user_balance_before_from?: number;
    user_balance_before_to?: number;
    user_balance_after_from?: number;
    user_balance_after_to?: number;
}

export interface ICustomRTMFilter extends ICasinoRtmFilter {
    fields?: string[];
}
